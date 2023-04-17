import DOTENV from 'dotenv';
import { createGoogleClient } from './Google';
import { Article, topArticles, topComments } from './Reddit';
import { GoogleProvider } from './TTS/GoogleProvider';
import { PexelProvider } from './Video/Stock/PexelProvider';
import { Generator } from './Generator';
import { readFile, writeFile } from 'fs/promises';
DOTENV.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CREDENTIAL_PATH = process.env.GOOGLE_CREDENTIAL_PATH || './client_secret.json';
const GOOGLE_TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || './client_token.json';
const GOOGLE_SCOPES = [ 'https://www.googleapis.com/auth/youtube.upload' ];
const PEXELS_KEY = process.env.PEXELS_KEY;
const HISTORY_FILE = process.env.HISTORY_FILE || './history.txt';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.';

const UPLOAD_VIDEO = true;
const YOUTUBE_VISIBILITY = 'public';

async function findSuitableArticle() : Promise<Article|null> {
    let content = '';
    try { content = (await readFile(HISTORY_FILE)).toString() } catch(e) { console.warn(e); }
    const records = content.split('\n');
    const articles = (await topArticles('r/askreddit', 'day', 100))
        .filter(article => !article.collapsed && !article.over_18);

    for(const article of articles) {
        if (!records.includes(article.id)) {
            records.push(article.id);
            await writeFile(HISTORY_FILE, records.join('\n'));
            return article;
        }
    }
    return null;
}

(async () => {   

    const googleClient = await createGoogleClient(GOOGLE_API_KEY, GOOGLE_CREDENTIAL_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES);
    const generator = new Generator(
        new GoogleProvider(googleClient),
        new PexelProvider(PEXELS_KEY),
        'temp'
    );

    // Step 1, find the best article
    console.log('Fetching article and comments');
    const article = await findSuitableArticle();
    if (article == null) {
        console.error('failed to find an article');
        return false;
    }

    const outputFile    = `${OUTPUT_DIR}/${article.id}.mp4`;
    const allComments   = (await topComments(article))
                            .filter(comment => !comment.collapsed && comment.body)
                            .map(comment => replaceLinks(comment.body));
    
    const messages = trimToEstimatedTime([article.title, ...allComments], 50, 12);

    console.log('Building video...');
    const genStartTime = Date.now();
    await generator.createVideo(messages, 60, outputFile);
    const genTimeTaken = Date.now() - genStartTime;
    console.log('Finished building video, took ', genTimeTaken, 's');

    // Upload to youtube
    if (UPLOAD_VIDEO) {
        console.log('Uploading Video...');
        const uploadStartTime = Date.now();
        await googleClient.uploadVideo(outputFile, article.title, article.title + ' #shorts #reddit', [ 'shorts', 'reddit' ], 22, YOUTUBE_VISIBILITY);
        const uploadTimeTaken = Date.now() - uploadStartTime;
        console.log('Finished uploading video, took ', uploadTimeTaken, 's');
    }


    /** Timings so far:
     * 
     * output-a.mp4 @ 69177s:
     * used 3  /  4 clips generated, chars per minute 346 / 21.36 = 16.198501872659175
     * 
     * output-b.mp4 @ 31734
     * used 4  /  4 clips generated
     * chars per minute 808 / 49.824 = 16.217084136159283
     * 
     * output-c.mp4 @ 52946
     * used 2  /  2 clips generated
     * chars per minute 696 / 42.552 = 16.356457980823464
     */
})();

function trimToEstimatedTime(comments : string[], duration : number, charPerSecond : number) : string[] {
    let results = [];
    let currentDuration = 0;
    for(const comment of comments) {
        const estDuration = comment.length * (1 / charPerSecond);
        if (estDuration + currentDuration > duration) 
            break;

        results.push(comment);
        currentDuration += estDuration;
    }
    return results;
}

function replaceLinks(str : string, replace : string = '') : string {
    return str.replace(/(?:https?|ftp):\/\/[\n\S]+/g, replace);
}
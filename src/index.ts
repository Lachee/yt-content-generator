import DOTENV from 'dotenv';
import { HTMLImageGenerator, ImageTiming, centerCropFit, compositeNarration, compositeSlideshow, duration } from './Video';
import { YOUTUBE_SHORT_VIDEO_HEIGHT, YOUTUBE_SHORT_VIDEO_WIDTH, createGoogleClient } from './Google';
import { mkdir, rm, unlink } from 'fs/promises';
import { topArticles, topComments } from './Reddit';
import { GoogleProvider } from './TTS/GoogleProvider';
import { PexelProvider } from './Video/Stock/PexelProvider';
import { Generator } from './Generator';
import { title } from 'process';
DOTENV.config();

const OUTPUT = 'output.mp4';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CREDENTIAL_PATH = process.env.GOOGLE_CREDENTIAL_PATH || './client_secret.json';
const GOOGLE_TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || './client_token.json';
const GOOGLE_SCOPES = [ 'https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly' ];
const PEXELS_KEY = process.env.PEXELS_KEY;

(async () => {   

    const client = await createGoogleClient(GOOGLE_API_KEY, GOOGLE_CREDENTIAL_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES);
    const generator = new Generator(
        new GoogleProvider(client),
        new PexelProvider(PEXELS_KEY),
        'temp'
    );

    // Step 1, find the best article
    console.log('Fetching article and comments');
    const articles = (await topArticles('r/askreddit', 'week', 1))
                        .filter(article => !article.collapsed && !article.over_18);

    const articleIndex = Math.floor(Math.random() * 10);
    const article = articles[articleIndex];
    const allComments = (await topComments(article))
                        .filter(comment => !comment.collapsed)
                        .map(comment => comment.body);
    
    const messages = trimToEstimatedTime([article.title, ...allComments], 50, 16);

    console.log(`Article #${articleIndex}`, article);

    console.log('Building video...');
    const videoStartTime = Date.now();
    await generator.createVideo(messages, 60, OUTPUT);
    const timeTaken = Date.now() - videoStartTime;
    console.log('Finished building video, took ', timeTaken, 's');

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
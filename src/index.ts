import DOTENV from 'dotenv';
import { createGoogleClient } from './Google';
import { Article, topArticles, topComments } from './Reddit';
import { GoogleProvider } from './TTS/GoogleProvider';
import { PexelProvider } from './Video/Stock/PexelProvider';
import { Generator } from './Generator';
import { readFile, writeFile } from 'fs/promises';
import { ContentProvider } from './Content';
import { RedditProvider, VettedRedditProvider } from './Content/RedditProvider';
import { TTSProvider } from './TTS';
import { StockProvider } from './Video/Stock';
import { Console } from 'console';
import { Uploader } from './Upload';
import { GoogleDriveUploader } from './Upload/GoogleDriveUploader';
DOTENV.config();

const GOOGLE_API_KEY            = process.env.GOOGLE_API_KEY;
const GOOGLE_CREDENTIAL_PATH    = process.env.GOOGLE_CREDENTIAL_PATH || './client_secret.json';
const GOOGLE_TOKEN_PATH         = process.env.GOOGLE_TOKEN_PATH || './client_token.json';
const GOOGLE_FOLDER             = process.env.GOOGLE_FOLDER || null;
const GOOGLE_SCOPES             = [ 'https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/drive.file' ];
const PEXELS_KEY                = process.env.PEXELS_KEY;
const CHATGPT_KEY               = process.env.CHATGPT_KEY || null;

const HISTORY_FILE = process.env.HISTORY_FILE;
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.';


(async () => {   
    
    const googleClient = await createGoogleClient(GOOGLE_API_KEY, GOOGLE_CREDENTIAL_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES);
    
    const uploader : Uploader = new GoogleDriveUploader(googleClient, GOOGLE_FOLDER);
    const ttsProvider : TTSProvider = new GoogleProvider(googleClient);
    const stockProvider : StockProvider = new PexelProvider(PEXELS_KEY);
    const contentProvider : RedditProvider =  CHATGPT_KEY 
            ? new VettedRedditProvider('r/askreddit', HISTORY_FILE, CHATGPT_KEY)
            : new RedditProvider('r/askreddit', HISTORY_FILE);

    console.log('Finding content...');
    
    const content = await contentProvider.find();

    console.log('Filming ', content.comments[0], '...');
    const generator = new Generator(ttsProvider, stockProvider, 'temp');
    const outputFile = `${OUTPUT_DIR}/${content.id}.mp4`;
    await generator.createVideo(content.comments, 60, outputFile);

    // Upload to youtube
    if (uploader != null) {
        console.log('Uploading Video...');
        let title = content.comments[0];
        if (title.length >= 100) 
            title = title.substring(0, 80).trim() + '...';
        
        const description = '/AskReddit ' + content.comments[0];
        await uploader.upload(outputFile, title, description, [ '#shorts' ], 22, true);
    }

    console.log('done');
})();


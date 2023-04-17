import DOTENV from 'dotenv';
import { YoutubeCategory, createGoogleClient } from './Google';
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

(async () => {   

    const client = await createGoogleClient(GOOGLE_API_KEY, GOOGLE_CREDENTIAL_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES);
    await client.uploadVideo('output.mp4', 'Test Video', '#short #shorts', [ 'short', 'shorts'], 22, 'private');
})();

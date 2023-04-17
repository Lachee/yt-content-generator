import DOTENV from 'dotenv';
import { YoutubeCategory, createGoogleClient } from './Google';

DOTENV.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CREDENTIAL_PATH = process.env.GOOGLE_CREDENTIAL_PATH || './client_secret.json';
const GOOGLE_TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || './client_token.json';
const GOOGLE_SCOPES = [ 'https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/drive' ];
const PEXELS_KEY = process.env.PEXELS_KEY;
const HISTORY_FILE = process.env.HISTORY_FILE || './history.txt';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.';

(async () => {   

    const client = await createGoogleClient(GOOGLE_API_KEY, GOOGLE_CREDENTIAL_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES);
    //await client.uploadYoutubeVideo('output.mp4', 'Test Video', '#short #shorts', [ 'short', 'shorts'], 22, 'private');
    await client.uploadDriveFile('output.mp4', 'Apples', 'some test file #shorts', '1e-aG031sMnmkWoPxmmFM7Us6iNrjOkNR');
})();

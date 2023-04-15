import { readFile, writeFile } from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';
import { google, youtube_v3 } from 'googleapis';
import readline from 'readline';

export const YOUTUBE_SHORT_VIDEO_WIDTH = 1080;
export const YOUTUBE_SHORT_VIDEO_HEIGHT = 1920;

/** Authorises with google */
export async function createGoogleClient(apiKey : string, clientSecretJsonPath : string, tokenCachePath : string, scopes : string[]) : Promise<GoogleClient> { 
    const credentials_json = await readFile(clientSecretJsonPath);
    const credentials = JSON.parse(credentials_json.toString());

    // Prepare the client
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    // Check if we have a token already. If we dont we will ask the console for the code
    try {
        const token = await readFile(tokenCachePath);
        oauth2Client.credentials = JSON.parse(token.toString());
    } catch(e) {
        console.error('failed to find the cached token: ', e);
        const token = await performTokenFlow(oauth2Client, scopes);
        await writeFile(tokenCachePath, JSON.stringify(token));
        oauth2Client.credentials = token;
    }

    // Return the client
    return new GoogleClient(apiKey, oauth2Client);
}

/** Asks the STDIN for the oauth2 flow */
async function performTokenFlow(client :  OAuth2Client, scopes : string[]) : Promise<any> {
    const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });

    console.log('Authorize this app by visiting: ', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const response = await new Promise<string>((resolve) => rl.question('Access Code / Redirect URL: ', (result) => resolve(result)));
    rl.close();

    let code = response;
    if (response.startsWith("http")) {
        const responseURL = new URL(response);
        code = responseURL.searchParams.get('code')
    }

    const { tokens } = await client.getToken(code);
    return tokens;
}


export class GoogleClient {
    private key : string;
    private client : OAuth2Client;

    constructor(apiKey : string, client : OAuth2Client) {
        this.key = apiKey;
        this.client = client;
    }

    async fetchOwnChannel() : Promise<youtube_v3.Schema$Channel> {
        const service = google.youtube('v3');
        const response = await service.channels.list({
            auth: this.client,
            mine: true,
            part: [ 'snippet', 'contentDetails', 'statistics' ]
        });
        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0];
        }
        return null;
    }

    async synthesizeSpeech(text : string) : Promise<Buffer>  {
        const service = google.texttospeech('v1');
        const response = await service.text.synthesize({
            auth: this.key,
            requestBody: {
                input: { text: text },
                voice: { languageCode: 'en-AU', ssmlGender: 'FEMALE' },
                audioConfig: { audioEncoding: 'MP3' }
            }
        });

        return Buffer.from(response.data.audioContent, 'base64');
    }
}
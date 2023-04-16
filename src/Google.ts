import { readFile, writeFile } from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';
import { google, youtube_v3 } from 'googleapis';
import readline from 'readline';

export type Voice = { languageCode: string, ssmlGender: 'MALE' | 'FEMALE', name?: string }
export const VoiceSamples : Voice[] = [
    { languageCode: 'en-AU', ssmlGender: 'FEMALE', name: 'en-AU-Neural2-A' },
    { languageCode: 'en-AU', ssmlGender: 'MALE', name: 'en-AU-Neural2-B' },
    { languageCode: 'en-AU', ssmlGender: 'FEMALE', name: 'en-AU-Neural2-C' },
    { languageCode: 'en-AU', ssmlGender: 'MALE', name: 'en-AU-Neural2-D' },
    
    { languageCode: 'en-IN', ssmlGender: 'FEMALE', name: 'en-IN-Standard-A' },
    { languageCode: 'en-IN', ssmlGender: 'MALE', name: 'en-IN-Standard-B' },
    { languageCode: 'en-IN', ssmlGender: 'MALE', name: 'en-IN-Standard-C' },
    { languageCode: 'en-IN', ssmlGender: 'FEMALE', name: 'en-IN-Standard-D' },
        
    { languageCode: 'en-GB', ssmlGender: 'FEMALE', name: 'en-GB-Neural2-A' },
    { languageCode: 'en-GB', ssmlGender: 'MALE', name: 'en-GB-Neural2-B' },
    { languageCode: 'en-GB', ssmlGender: 'FEMALE', name: 'en-GB-Neural2-C' },
    { languageCode: 'en-GB', ssmlGender: 'MALE', name: 'en-GB-Neural2-D' },
    { languageCode: 'en-GB', ssmlGender: 'FEMALE', name: 'en-GB-Neural2-F' },
        
    { languageCode: 'en-US', ssmlGender: 'MALE', name: 'en-US-Neural2-A' },
    { languageCode: 'en-US', ssmlGender: 'FEMALE', name: 'en-US-Neural2-C' },
    { languageCode: 'en-US', ssmlGender: 'MALE', name: 'en-US-Neural2-D' },
    { languageCode: 'en-US', ssmlGender: 'FEMALE', name: 'en-US-Neural2-E' },
    { languageCode: 'en-US', ssmlGender: 'FEMALE', name: 'en-US-Neural2-F' },
    { languageCode: 'en-US', ssmlGender: 'FEMALE', name: 'en-US-Neural2-G' },
]

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

    async synthesizeSpeech(text : string, voice : Voice) : Promise<Buffer>  {
        const service = google.texttospeech('v1');
        const response = await service.text.synthesize({
            auth: this.key,
            requestBody: {
                input: { text: text },
                voice: voice,
                audioConfig: { audioEncoding: 'MP3' }
            }
        });

        return Buffer.from(response.data.audioContent, 'base64');
    }
}
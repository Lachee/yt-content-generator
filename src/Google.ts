import { createReadStream } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { OAuth2Client } from 'google-auth-library';
import { drive_v2, google, youtube_v3 } from 'googleapis';
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
];

export type YoutubeVisibility = 'private'|'public'|'unlisted';
export const YoutubeCategories = {
    'Autos & Vehicles' : 2,
    'Film & Animation' : 1,
    'Music' : 10,
    'Pets & Animals' : 15,
    'Sports' : 17,
    'Short Movies' : 18,
    'Travel & Events' : 19,
    'Gaming' : 20,
    'Videoblogging' : 21,
    'People & Blogs' : 22,
    'Comedy' : 23,
    'Entertainment' : 24,
    'News & Politics' : 25,
    'Howto & Style' : 26,
    'Education' : 27,
    'Science & Technology' : 28,
    'Nonprofits & Activism' : 29,
    'Movies' : 30,
    'Anime/Animation' : 31,
    'Action/Adventure' : 32,
    'Classics' : 33,
    'Comedy 2' : 34,
    'Documentary' : 35,
    'Drama' : 36,
    'Family' : 37,
    'Foreign' : 38,
    'Horror' : 39,
    'Sci-Fi/Fantasy' : 40,
    'Thriller' : 41,
    'Shorts' : 42,
    'Shows' : 43,
    'Trailers' : 44,
} as const;
export type YoutubeCategory = keyof typeof YoutubeCategories;


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

    async uploadYoutubeVideo(fileName : string, title : string, description : string, tags : string[], category : number, visbility : YoutubeVisibility) : Promise<youtube_v3.Schema$Video> {
        const service = google.youtube('v3');
        const response = await service.videos.insert( {
            auth: this.client,
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title, 
                    description, 
                    tags, 
                    categoryId: category.toString(),
                    defaultLanguage: 'en',
                    defaultAudioLanguage: 'en',
                },
                status: {
                    privacyStatus: visbility,
                }
            },
            media: {
                body: createReadStream(fileName)
            }
        });
        return response.data;
    }

    async uploadDriveFile(fileName : string, title: string, description? : string, folderId? : string) : Promise<drive_v2.Schema$File> {
        const service = google.drive('v2');

        let parents : drive_v2.Schema$ParentReference[]|null = null;
        if (folderId != null) {
            const parentResponse = await service.files.get({
                auth: this.client,
                fileId: folderId
            });
            parents = [ parentResponse.data ];
        }

        const response = await service.files.insert({
            auth: this.client,
            requestBody: {
                title: title,
                description: description,
                parents: parents
                
            },
            media: {
                body: createReadStream(fileName)
            }
        });
        return response.data;
    }
}
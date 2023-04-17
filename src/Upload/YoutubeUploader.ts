import { GoogleClient, YoutubeCategories } from "@app/Google";
import type { Uploader, UploadResponse } from "."

/** Uploads directly to youtube
 * This has issues as youtube will block anything that isnt from a verified app
 */
export class YoutubeUploader implements Uploader 
{
    private client : GoogleClient;
    constructor(client : GoogleClient) {
        this.client = client;
    }

    async upload(
        fileName : string,
        title : string,
        description : string,
        tags : string[],
        category : string,
        isPublic : boolean
    ) : Promise<UploadResponse> {

        const cat = YoutubeCategories[category];
        const response = await this.client.uploadYoutubeVideo(
            fileName,
            title,
            description,
            tags,
            cat,
            isPublic ? 'public' : 'unlisted'
        );

        return { 
            url:`https://www.youtube.com/watch?v=${response.id}`,
            //...response
        };
    }
}
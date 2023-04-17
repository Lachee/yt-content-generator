import { GoogleClient, YoutubeCategories } from "@app/Google";
import type { Uploader, UploadResponse } from "."

/** Uploads directly to google drive
 */
export class GoogleDriveUploader implements Uploader 
{
    private client : GoogleClient;

    /** Prefered folder to upload into */
    public folderId : string|null;

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

        const response = await this.client.uploadDriveFile(
            fileName,
            title,
            description,
            this.folderId
        );

        return { 
            url: response.downloadUrl
            //...response
        };
    }
}
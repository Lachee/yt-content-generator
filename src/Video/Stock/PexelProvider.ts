import { StockProvider, StockResponse } from ".";
import { createClient, type Video } from 'pexels';
import { download as downloadFile } from "@app/utils/Download";
export class PexelProvider implements StockProvider {

    private key : string;
    constructor(apiKey : string) {
        this.key = apiKey;
    }

    /**
     * Finds a video that suits the given query
     * @param text the text to convert
     * @param temporaryFile the file to temporarily store the buffered content into. If not provided, the content will not be saved.
     * @return the filepath of the saved audio
     */
    async download(query : string, minDuration : number, downloadLocation : string) : Promise<StockResponse> {
        const bestVideo = await this.findBestResult(query, minDuration);
        await downloadFile(downloadLocation, {
            url: bestVideo.video_files[0].link,
            method: 'GET'
        });
        return { fileName: downloadLocation };
    }

    /** Finds the best video */
    async findBestResult(query : string, minDuration : number) : Promise<Video> 
    {
        const pexel = createClient(this.key);
        async function search(query : string, duration : number, minWidth : number, page : number = 1) : Promise<Video|null>
        {
            //console.log('searching page ', page);
            const videoSearchResults = await pexel.videos.search({  query,  min_duration: duration, min_width: minWidth, page: page });
            if ('error' in videoSearchResults) {
                console.error('failed to process: ', videoSearchResults.error);
                return null;
            }
            
            for(const video of videoSearchResults.videos) {
                if (video.width < minWidth)
                    continue;
    
                if (video.duration < duration)
                    continue;
    
                return video;
            }
    
            if (videoSearchResults.next_page == null) 
                return null;
            
            return await search(query, duration, minWidth, page + 1);
        }
    
        return await search(query, minDuration, 0, 1);
    }
}
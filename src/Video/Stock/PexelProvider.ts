import { StockProvider, StockResponse } from ".";
import { createClient, type Video } from 'pexels';
import { download as downloadFile } from "@app/utils/Download";
import axios from "axios";
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
    async downloadVideo(query : string, minDuration : number, downloadLocation : string) : Promise<StockResponse> {
        // Try at least several times before giving up
        let invalidIds = [];
        for (let attempt = 0; attempt < 50; attempt++) {
            const bestVideo = await this.findBestResult(query, minDuration, invalidIds);
        
            // Iterate over all files provided. If one of them DOESNT fail, then we will use that one.
            for(let i = 0; i < Math.min(bestVideo.video_files.length, 10); i++)
            {
                const file = bestVideo.video_files[i];
                try {
                    await downloadFile(downloadLocation, { url: file.link,  method: 'GET' });
                    return { fileName: downloadLocation };
                } catch(e) { 
                    console.warn('video failed to download:', bestVideo.id, file.link, e.message);
                }
            }
            
            // The video we got was invalid, try again
            invalidIds.push(bestVideo.id);
            console.warn('gave up on stock clip ', bestVideo.id);
        }

        // We never returned, so there is no valid video
        throw new Error('Failed to find anny appropriate videos');
    }

    /** Finds the best video */
    private async findBestResult(query : string, minDuration : number, invalidIds : number[] = []) : Promise<Video> 
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
    
                if (invalidIds.includes(video.id))
                    continue;

                // Ensure the video actually exists
                try { 
                    //const response = await axios.options(video.video_files[0].link);
                    //if (response.status === 200)
                        return video;
                } catch(_) { console.warn('failed to fetch a video because the link is invalid'); }
            }
    
            if (videoSearchResults.next_page == null) 
                return null;
            
            return await search(query, duration, minWidth, page + 1);
        }
    
        return await search(query, minDuration, 0, 1);
    }
}
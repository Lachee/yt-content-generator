import { mkdir, rm, rmdir } from 'fs/promises';
import type { TTSProvider } from './TTS'
import { centerCropFit, compositeNarration, compositeSlideshow, duration } from './Video';
import { HTMLImageGenerator } from './Video/Image';
import { StockProvider } from './Video/Stock';

const CLIP_WIDTH: number  = 1080;
const CLIP_HEIGHT: number = 1920;

export class Generator {
    ttsProvider : TTSProvider;
    stockProvider : StockProvider;
    imageProvider : HTMLImageGenerator;
    tempDir : string;

    constructor(ttsProvider: TTSProvider, stockProvider : StockProvider, tempDir : string) {
        this.ttsProvider = ttsProvider;
        this.stockProvider = stockProvider;
        this.imageProvider = new HTMLImageGenerator(CLIP_WIDTH, CLIP_HEIGHT);
        this.tempDir = tempDir;
    }

    async createVideo(comments : string[], maxDuration : number = 30, fileName : string) : Promise<void> {
        if (comments.length == 0) 
            throw new Error('Comments must have at least 1 element');
        
        type Slidehshow = { 
            fileName : string;
            audioClip : string;
            start : number;
            end : number;
            text: string;
        }
        try {    
            await this.prepareTempDirectory();
            const audioClips = await Promise.all(comments.map((c, i) => this.ttsProvider.convert(c, `${this.tempDir}/clip-${i}.mp3`)));
            const durations = await duration(audioClips.map(clip => clip.fileName));
            const slideshows : Slidehshow[] = [];

            await this.imageProvider.open();
            let totalClipDuration = 0;
            for(const index in durations) {
                const duration = durations[index];

                // Ensure the clip would fit (with some spacing)
                if (totalClipDuration + duration >= maxDuration + (slideshows.length * 0.25))
                    break;

                const img = await this.imageProvider.snapshot('src/public/card.html', { text: comments[index] }, `${this.tempDir}/img-${index}.png`);
                slideshows.push({
                    fileName:   img.fileName,
                    audioClip:  audioClips[index].fileName,
                    start:      totalClipDuration,
                    end:        totalClipDuration + duration,
                    text:       comments[index]
                });
                totalClipDuration += duration;
            }
            await this.imageProvider.close();


            const totalChars = slideshows.reduce((prev, slide) => prev + slide.text.length, 0);
            const totalSeconds = slideshows.reduce((prev, slide) => prev + (slide.end - slide.start), 0);
            console.log('used', slideshows.length, ' / ', comments.length, 'clips generated');
            console.log('chars per minute', totalChars, '/', totalSeconds, '=', totalChars/totalSeconds);

            // Download the stock and composite
            const stockFile = `${this.tempDir}/video.mp4`;
            const croppedFile = `${this.tempDir}/cropped.mp4`;
            const narratedFile = `${this.tempDir}/narrated.mp4`;
            await this.stockProvider.downloadVideo(comments[0], totalClipDuration, stockFile);
            await centerCropFit(stockFile, croppedFile, CLIP_WIDTH, CLIP_HEIGHT);
            await compositeNarration(croppedFile, slideshows.map(c => c.audioClip), narratedFile);
            await compositeSlideshow(narratedFile, slideshows, fileName);     
        } finally {
            this.cleanupTempDirectory();
        }
    }

    private async cleanupTempDirectory() : Promise<boolean> {
        try {
             await rm(this.tempDir, { recursive: true, force: true });
             return true;
        } catch(_) {
            return false;
        }
    }

    private async prepareTempDirectory() : Promise<void> {
        await this.cleanupTempDirectory();
        try { await mkdir(this.tempDir); } catch(_) {}
    }

}
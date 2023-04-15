import ffmpeg from 'fluent-ffmpeg';
import { unlink } from 'fs/promises';

export function concatAudioClips(audioFiles : string[], outputFile : string) : Promise<void> {
    return new Promise((resolve, reject) => {
        const command = ffmpeg();
        audioFiles.forEach((file, i) => {
            command.input(file);
        });

        let filter = '';
        filter += audioFiles.map((_, i) => `[${i}:a]`).join(' ');
        filter += `concat=n=${audioFiles.length}:v=0:a=1 [a1]`;
        command.complexFilter([filter]);
        command.outputOptions([ '-map [a1]' ]);
        command.output(outputFile);
        command.on('end', () => resolve());
        command.on('error', (err) => reject(err));
        command.run();
    });
}

export async function compositeNarration(videoInputFile : string, audioFiles : string[], outputFile : string) : Promise<void> {

    const tempAudioClipFile = `${videoInputFile}.mp3`;
    try {
        await concatAudioClips(audioFiles, tempAudioClipFile);
        await new Promise<void>((resolve, reject) => {
            const command = ffmpeg();
            command
                .input(videoInputFile)
                .input(tempAudioClipFile)
                .output(outputFile)
                .outputOptions([
                    '-c copy',
                    '-shortest',
                    '-map 0:v:0',
                    '-map 1:a'
                ]);

            command.on('end', () => resolve());
            command.on('error', (err) => reject(err));
            command.run();
        });
    } finally {
        await unlink(tempAudioClipFile);
    }
}

export interface ImageTiming { 
    file : string;
    start : number;
    end : number;
}
export async function compositeSlideshow(videoInputFile : string, images : ImageTiming[], outputFile : string) : Promise<void> {
    //ffmpeg -i tmp/video-result.mp4 -i tmp/question.png -i tmp/response.png -filter_complex "overlay=enable='between(t,0,4.66)',overlay=enable='between(t,4.66,15.72)'" -preset fast -c:a copy output.mp4
    return new Promise((resolve, reject) => {
        const command = ffmpeg();
        command.input(videoInputFile);

        let filters = [];
        images.forEach((timing, i) => {
            command.input(timing.file);
            filters.push(`overlay=enable='between(t,${timing.start.toFixed(2)},${timing.end.toFixed(2)})'`);
        });


        const f = filters.join(',');
        command.complexFilter(f);
        command.outputOptions([ 
            '-preset fast',
            '-c:a copy' 
        ]);
        command.output(outputFile);
        command.on('end', () => resolve());
        command.on('error', (err) => reject(err));
        command.run();
    });
}

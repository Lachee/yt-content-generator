import ffmpeg from 'fluent-ffmpeg';

/** gets the dimention of the given media */
export function dimensions(inputFile: string) : Promise<{ width: number; height: number }> {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        ffmpeg.ffprobe(inputFile, async function (err, metadata) {
            if (err) {
                reject(err);
                return;
            }
            
            resolve({
                width: metadata.streams[0].width,
                height: metadata.streams[0].height,
            });
        });
    });
}

export function duration(inputFile: string) : Promise<number> {
    return new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(inputFile, async function (err, metadata) {
            if (err) {
                reject(err);
                return;
            }
            
            resolve(metadata.streams[0].duration);
        });
    });
}
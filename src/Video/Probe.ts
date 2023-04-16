import ffmpeg from 'fluent-ffmpeg';

/** gets the dimention of the given media */
export function dimensions(inputFile: string) : Promise<{ width: number; height: number }> {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        ffmpeg.ffprobe(inputFile, function (err, metadata) {
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

export function duration(inputFile : string) : Promise<number>;
export function duration(inputFiles : string[]) : Promise<number[]>;
export function duration(inputFiles: string|string[]) : Promise<number|number[]> {
    async function probe(fileName) : Promise<number> {
        return new Promise<number>((resolve, reject) => {
            ffmpeg.ffprobe(fileName, (err, metadata) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(metadata.streams[0].duration);
            });
        });
    }
    
    if (Array.isArray(inputFiles)) {
        return Promise.all(inputFiles.map(f => probe(f)));
    } else {
        return probe(inputFiles);
    }
}
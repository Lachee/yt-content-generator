import ffmpeg from 'fluent-ffmpeg';
import { unlink } from 'fs/promises';
import { dimensions } from './Probe';

// a lot of this came from https://stackoverflow.com/a/61466949/5010271

/** resizes a video, padding inbetween */
export function resize(inputFile: string, outputFile : string, width: number, height: number,  autoPad?: boolean, padColor?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        let ff = ffmpeg().input(inputFile).size(`${width}x${height}`);
        if (autoPad)
            ff = ff.autoPad(autoPad, padColor);

        ff.output(outputFile)
            .on("error", function (err) {
                reject(err);
            })
            .on("end", function () {
                resolve(outputFile);
            })
            .run();
    });
}

/** crops the video in the center with the given dimensions */
export function centerCrop(inputFile: string, outputFile : string, width: number, height: number): Promise<string> {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(inputFile)
            .videoFilters([
                {
                    filter: "crop",
                    options: {
                        w: width,
                        h: height,
                    },
                },
            ])
            .output(outputFile)
            .on("error", function (err) {
                reject(err);
            })
            .on("end", function () {
                resolve(outputFile);
            })
            .run();
    });
}

/** Scales a video */
export async function centerCropFit(inputFile: string, outputFile : string, width: number, height: number) {
    const { width: originalWidth, height: originalHeight } = await dimensions(inputFile);
    if ((originalWidth / originalHeight).toFixed(2) > (width / height).toFixed(2)) {
        // y=0 case
        // landscape to potrait case
        const x = originalWidth - (width / height) * originalHeight;

        // Center crop and resize
        const tmpOutputCropFile = `${outputFile}.cropped.mp4`;
        try {
            await centerCrop(inputFile,  tmpOutputCropFile,  originalWidth - x,  originalHeight);
            await resize(tmpOutputCropFile, outputFile, width, height);       
        } finally {
            await unlink(tmpOutputCropFile);
        }
    } else if ((originalWidth / originalHeight).toFixed(2) < (width / height).toFixed(2)) {
        await resize(inputFile, outputFile, width, height, true);
    } else {
        await resize(inputFile, outputFile, width, height);
    }
    return outputFile;
}

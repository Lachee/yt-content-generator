import axios, { AxiosRequestConfig } from "axios";
import { createWriteStream } from "fs";
import { writeFile } from "fs/promises";

/**
 * Downloads a file to a given file location
 * @param request The Axios request to download
 * @param destination Destination file
 */
export async function download(destination : string, request : AxiosRequestConfig) : Promise<void>
{    
    request.responseType = 'arraybuffer';
    const response = await axios(request);
    await writeFile(destination, response.data);

    // Stopid node bug
    // await new Promise<void>(async (resolve, reject) => {
    //     request.responseType = 'stream';
    //     const response = await axios(request);
    //     const writer = createWriteStream(destination);
    //     writer.on('finished', () => {
    //         console.log('finished writing');
    //         //writer.close();
    //         resolve();
    //     });
    //     writer.on('error', (err) => {
    //         console.error('failed to write, error', err);
    //         //writer.close();
    //         reject(err)
    //     });
    //     response.data.pipe(writer);
    // });
}
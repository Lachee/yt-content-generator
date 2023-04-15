import { GoogleClient } from "@app/Google";
import { TTSProvider, TTSResponse } from ".";
import { readFile, writeFile } from "fs/promises";

export class GoogleProvider implements TTSProvider {
    
    private client : GoogleClient;
    public useExistingFilesWhenAvailable : boolean = false;

    constructor(client : GoogleClient) {
        this.client = client;
    }

    async convert(text: string, fileName?: string): Promise<TTSResponse> {
        if (this.useExistingFilesWhenAvailable) {
            try {
                const buffer = await readFile(fileName);

                console.log('( skipped file ' + fileName + ' because it exists )');
                return {
                    buffer,
                    fileName,
                    format: 'mp3'
                };
            }catch(err) {
                console.error('failed to load from cache');
            }
        } 


        const buffer = await this.client.synthesizeSpeech(text);
        if (fileName) 
            await writeFile(fileName, buffer);            

        return {
            buffer,
            fileName,
            format: 'mp3'
        };
        
    }
}
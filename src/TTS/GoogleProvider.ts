import { GoogleClient, Voice, VoiceSamples } from "@app/Google";
import { TTSProvider, TTSResponse } from ".";
import { readFile, writeFile } from "fs/promises";



export class GoogleProvider implements TTSProvider {
    
    private client : GoogleClient;
    public useExistingFilesWhenAvailable : boolean = false;
    public voice : Voice|null

    constructor(client : GoogleClient, voice? : Voice) {
        this.client = client;
        this.voice = voice;
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

        const voice = this.voice ?? VoiceSamples[Math.floor(Math.random() * VoiceSamples.length)];
        const buffer = await this.client.synthesizeSpeech(text, voice);
        if (fileName) 
            await writeFile(fileName, buffer);            

        return {
            buffer,
            fileName,
            format: 'mp3'
        };
        
    }
}
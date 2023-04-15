import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { readFile, writeFile } from 'fs/promises';

export interface ImageProviderResponse {
    /** The raw bytes from the conversion */
    buffer : Buffer;
    /** The optional filename that was saved */
    fileName? : string;
}

export class HTMLImageGenerator {
    private isOpen : boolean;
    private browser : Browser;

    public omitBackground : boolean = true;
    public width : number = 500;
    public height : number = 500;
   
    constructor(width : number, height : number) {
        this.width = width;
        this.height = height;
    }

    /** Begins the HTTP server */
    async open() : Promise<Browser> {
        if (this.isOpen) 
            return this.browser;
        this.browser = await puppeteer.launch();
        this.isOpen = true;
        return this.browser;
    }

    /** Aborts the http server */
    async close() : Promise<void> {
        if (!this.isOpen) 
            return;
        await this.browser.close();
        this.isOpen = false;
        this.browser = null;
    }

    async snapshot(layout : string, payload : any, temporaryFileName? : string) : Promise<ImageProviderResponse> {
        // Open the HTTP if not already and warn that we didnt wait for it to open
        if (!this.isOpen) {
            console.warn('Didn\'t wait for the http to open. You may have forgotten to call close(). This wont be automatically called');
            await this.open();
        }

        // Render the page with puppetter
        const content = await readFile(layout);
        const browser = this.browser;

        // Load page and send message
        const page = await browser.newPage();
        await page.setContent(content.toString(), { waitUntil: 'load' });
        
        //@ts-ignore
        await page.evaluate((content) => window.initialisePuppeteerData(content), JSON.stringify(payload));

        // Take a snapshot
        const buffer = await page.screenshot({
            omitBackground: this.omitBackground,
            clip: { 
                x: 0,
                y: 0,
                width: this.width,
                height: this.height
            }
        });

        await page.close();

        if (temporaryFileName != null) 
            await writeFile(temporaryFileName, buffer);
        
        return {
            buffer: buffer,
            fileName: temporaryFileName,
        };
    }
}





        // if (this.app) 
        //     await this.close();            
        // return new Promise<void>((resolve) => {
        //     this.app = new App();
        //     this.server = this.app.listen(this.port, () => {
        //         this.isOpen = true;
        //         resolve();
        //     });
        // });

        

        //return new Promise((resolve, reject) => {
        //    this.server.close((err) => { 
        //        if (err) {
        //            reject(err);
        //            return;
        //        }
        //        this.isOpen = false;
        //        this.app = null;
        //        this.server = null;
        //        resolve();
        //    });
        //    
        //})
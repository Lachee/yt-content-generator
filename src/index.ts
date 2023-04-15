import DOTENV from 'dotenv';
import { HTMLImageGenerator, ImageTiming, centerCropFit, compositeNarration, compositeSlideshow, duration } from './Video';
import { YOUTUBE_SHORT_VIDEO_HEIGHT, YOUTUBE_SHORT_VIDEO_WIDTH, createGoogleClient } from './Google';
import { mkdir, rm, unlink } from 'fs/promises';
import { topArticles, topComments } from './Reddit';
import { GoogleProvider } from './TTS/GoogleProvider';
import { PexelProvider } from './Video/Stock/PexelProvider';
DOTENV.config();

const TEMP = 'temp';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CREDENTIAL_PATH = process.env.GOOGLE_CREDENTIAL_PATH || './client_secret.json';
const GOOGLE_TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || './client_token.json';
const GOOGLE_SCOPES = [ 'https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly' ];
const PEXELS_KEY = process.env.PEXELS_KEY;

(async () => {   
    console.log('initializing dir');
    try { await mkdir('temp') } catch(_) {}

    console.log('Connecting to Google...');
    const client = await createGoogleClient(GOOGLE_API_KEY, GOOGLE_CREDENTIAL_PATH, GOOGLE_TOKEN_PATH, GOOGLE_SCOPES);
    const audioProvider = new GoogleProvider(client);  /* audioProvider.useExistingFilesWhenAvailable = true; */
    const videoProvider = new PexelProvider(PEXELS_KEY);
    const imageProvider = new HTMLImageGenerator(YOUTUBE_SHORT_VIDEO_WIDTH, YOUTUBE_SHORT_VIDEO_HEIGHT);
    const OUTPUT = 'output.mp4';

    // Step 1, find the best article
    console.log('Fetching Articles');
    const articles = (await topArticles('r/askreddit', 'week', 1));
    const article = articles[3];
    const comments = await topComments(article);
    const comment  = comments[0];

    // Step 2, convert the audios and find the video at hte same time
    console.log('Fetching Audio ');
    const results = await Promise.all([
        audioProvider.convert(article.title, `${TEMP}/question.mp3`),
        audioProvider.convert(comment.body, `${TEMP}/response.mp3`),
    ]);

    // Step 2B, fetch video
    console.log('Fetching Video ');
    const video = await videoProvider.download(article.title, 30, `${TEMP}/stock.mp4`);

    // Step 3, Take the images. They need to be sequencial as they share resources
    console.log('Fetching images');
    await imageProvider.open();
    const question = await imageProvider.snapshot('src/public/card.html',  { text: article.title, author: article.author }, `${TEMP}/question.png`);
    const response = await imageProvider.snapshot('src/public/card.html',  { text: comment.body, author: comment.author }, `${TEMP}/response.png`);
    await imageProvider.close();

    // Step 4, Time everything
    console.log('Timing');
    const audioClips = [ results[0].fileName, results[1].fileName ];
    const slideshow : ImageTiming[] = await getImageTimings([ question.fileName, response.fileName ], audioClips);

    // Step 5, Composite everythign
    console.log('Compositing');
    const stockFile = video.fileName;
    const croppedFile = `${stockFile}-crop.mp4`;
    const narratedFile = `${stockFile}-narrated.mp4`;
    try {
        console.log('| cropping');
        await centerCropFit(stockFile, croppedFile, YOUTUBE_SHORT_VIDEO_WIDTH, YOUTUBE_SHORT_VIDEO_HEIGHT);
        console.log('| narrating');
        await compositeNarration(croppedFile, audioClips, narratedFile);
        console.log('| slideshowing');
        await compositeSlideshow(narratedFile, slideshow, OUTPUT);
    } finally {
        unlink(croppedFile).catch(e => console.error('unable to delete file: ', e));
        unlink(narratedFile).catch(e => console.error('unable to delete file: ', e))
        unlink(stockFile).catch(e => console.error('unable to delete file: ', e));
    }

    
    console.log('Cleaning up...');
    await rm(TEMP, { recursive: true, force: true });
    
    console.log('done!');
})();

async function getImageTimings(imageFiles : string[], audioClips : string[]) : Promise<(ImageTiming & { audioFile : string})[]> {
    let slideshow = [];

    // Convert the audio clips into snapshots and caclulate their timings
    let elapsedTime = 0;
    const clipTimes = await Promise.all(audioClips.map(f => duration(f)));
    for (let i = 0; i < clipTimes.length; i++) {
        slideshow.push({
            file: imageFiles[i],
            audioFile: audioClips[i],
            start: elapsedTime,
            end: elapsedTime + clipTimes[i],
        });
        elapsedTime += clipTimes[i]
    };

    return slideshow;
}
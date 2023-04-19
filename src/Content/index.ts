export interface ContentProvider {
    /**
     * Converts the given text into audio
     * @param text the text to convert
     * @param temporaryFile the file to temporarily store the buffered content into. If not provided, the content will not be saved.
     * @return the filepath of the saved audio
     */
    find() : Promise<Content>;
}

export interface Content {
    id : string;
    comments : string[]
}

/**
 * Trims the array of comments so it would fit within the duration spoken
 * @param comments array of comments
 * @param duration the target duration in seconds
 * @param cps The average characters per second read by the voice 
 * @returns 
 */
export function trimToTime(comments : string[], duration : number, cps : number = 10) : string[] {
    let results = [];
    let currentDuration = 0;
    for(const comment of comments) {
        const estDuration = comment.length * (1 / cps);
        if (estDuration + currentDuration > duration) 
            break;

        results.push(comment);
        currentDuration += estDuration;
    }
    return results;
}

/**
 * Replaces all the link
 * @param str 
 * @param replace 
 * @returns 
 */
export function replaceLinks(str : string, replace : string = '') : string {
    return str.replace(/(?:https?|ftp):\/\/[\n\S]+/g, replace);
}
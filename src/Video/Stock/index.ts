export interface StockProvider {
    /**
     * Finds a video that suits the given query
     * @param text the text to convert
     * @param temporaryFile the file to temporarily store the buffered content into. If not provided, the content will not be saved.
     * @return the filepath of the saved audio
     */
    download(query : string, minDuration : number, downloadLocation : string) : Promise<StockResponse>;
}

export interface StockResponse {
    /** The optional filename that was saved */
    fileName : string;
}
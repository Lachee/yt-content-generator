export interface Uploader {
    /**
     * Converts the given text into audio
     * @param text the text to convert
     * @param temporaryFile the file to temporarily store the buffered content into. If not provided, the content will not be saved.
     * @return the filepath of the saved audio
     */
    upload(
        fileName : string,
        title : string,
        description : string,
        tags : string[],
        category : string,
        isPublic : boolean
    ) : Promise<UploadResponse>;
}

export interface UploadResponse {
    /** Link to the uploaded file */
    url : string;
}
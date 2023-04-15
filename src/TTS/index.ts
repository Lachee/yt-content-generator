export interface TTSProvider {
    /**
     * Converts the given text into audio
     * @param text the text to convert
     * @param temporaryFile the file to temporarily store the buffered content into. If not provided, the content will not be saved.
     * @return the filepath of the saved audio
     */
    convert(text : string, temporaryFile? : string) : Promise<TTSResponse>;
}

export interface TTSResponse {
    /** The raw bytes from the conversion */
    buffer : Buffer;
    /** The optional filename that was saved */
    fileName? : string;
    /** The format of the buffer */
    format : string;
}
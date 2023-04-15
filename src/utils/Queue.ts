export interface Queue<T> {
    /**
     * Adds an object to the queue
     */
    push(entry : T) : T;

    /**
     * Pops an object from the queue
     */
    pop() : T;

    /**
     * Gets the current item in the queue
     */
    peek() : T;

    /**
     * Seeks all records
     */
    all() : Generator<T>;

    /** Gets the length of items */
    length() : T;
    
    /** Gets a range of all entries */
    range(start : number, end? : number): Promise<T[]>;
}

export interface AsyncQueue<T> {
    /**
     * Adds an object to the queue
     */
    push(entry : T) : Promise<T>;

    /**
     * Pops an object from the queue
     */
    pop() : Promise<T>;

    /**
     * Gets the current item in the queue
     */
    peek() : Promise<T>;

    /** Gets the length of items */
    length() : Promise<number>;
    
    /** Gets a range of all entries */
    range(start : number, end? : number): Promise<T[]>;
}

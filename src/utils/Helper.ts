/**
 * Groups an array of items by their key
 * @param items 
 * @param key 
 * @returns 
 */
export function group<K extends keyof any, T extends Record<any, any>>(items : T[], key : keyof T|((i : T) => K)) : Record<K, T[]>
{
    const record = {} as Record<K, T[]>;
    for(const item of items) {
        const k = typeof key === 'function' ? key(item) : item[key];
        if (!record[k])
            record[k] = [];
        record[k].push(item);
    }
    return record;
}

/**
 * Maps an array of items into a record indexed by a key
 * @param items 
 * @param key 
 * @returns 
 */
export function key<K extends keyof any, T extends Record<any, any>>(items : T[], key : keyof T|((i : T) => K)) : Record<K, T> 
{
    const record = {} as Record<K, T>;
    for (const item of items) {
        const k = typeof key === 'function' ? key(item) : item[key];
        record[k] = item;
    }
    return record;
}

export function extract<K extends keyof any, T, V>(items : T[], key : ((i : T) => { key: K, item: V })) : Record<K, V>
{
    const record = {} as Record<K, V>;
    for (const item of items) {
        const kv = key(item);
        record[kv.key] = kv.item;
    }
    return record;
}

export function toInteger(str : string) : number|undefined {
    const num = parseInt(str);
    if (Number.isNaN(num))
        return undefined;
    return num;
}
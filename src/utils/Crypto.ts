import crypto from 'crypto';

export function sha1(content : string, digest : crypto.BinaryToTextEncoding = 'hex') : string {
    var shasum = crypto.createHash('sha1');
    shasum.update(content);
    return shasum.digest(digest);
}

export function sha256(content : string, digest : crypto.BinaryToTextEncoding = 'hex') : string {
    var shasum = crypto.createHash('sha256');
    shasum.update(content);
    return shasum.digest(digest);
}

export function md5(content : string, digest : crypto.BinaryToTextEncoding = 'hex') : string {
    var shasum = crypto.createHash('md5');
    shasum.update(content);
    return shasum.digest(digest);
}
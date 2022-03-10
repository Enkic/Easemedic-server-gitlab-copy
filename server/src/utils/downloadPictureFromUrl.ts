import * as fs from 'fs';

var request = require('request');

export async function downloadPictureFromUrl(
    uri: string,
    destFilePath: string
) {
    request.head(uri, function (err: any, res: any, body: any) {
        request(uri).pipe(fs.createWriteStream(destFilePath));
    });
}

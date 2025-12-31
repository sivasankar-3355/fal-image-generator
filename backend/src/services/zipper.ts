import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const zipImages = async (images: Express.Multer.File[]): Promise<string> => {
    const zipPath = path.join(
        process.cwd(),
        'temp',
        `${crypto.randomUUID()}.zip`
    );

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            console.log(`Archive created successfully at ${zipPath}`);
            resolve(zipPath);
        });

        output.on('error', reject);
        archive.on('error', reject);

        archive.pipe(output);

        for (const image of images) {
            archive.append(image.buffer, { name: image.originalname });
        }

        archive.finalize();
    });
};

// src/utils/file-storage.service.ts

import { Injectable } from '@nestjs/common';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';
import archiver from 'archiver';

@Injectable()
export class FileStorageService {
    public sanitizeNomorSurat(nomorSurat: string): string {
        return nomorSurat.replace(/[\/\\]/g, '-');
    }

    private sanitizeFolderName(folder: string): string {
        return folder.replace(/[^a-zA-Z0-9_-]/g, '');
    }

    async saveFile(buffer: Buffer, folder: string, filename: string, mimeType: string): Promise<string> {
        // Sanitasi folder
        const safeFolder = this.sanitizeFolderName(folder);

        // Tetapkan ekstensi
        let extension = '.png';
        switch (mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                extension = '.jpg';
                break;
            case 'application/pdf':
                extension = '.pdf';
                break;
        }

        // Sanitasi filename
        const baseFilename = filename.replace(/\.[^/.]+$/, ""); // Hapus ekstensi lama
        const sanitizedBase = baseFilename.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const finalFilename = `${sanitizedBase}${extension}`;

        // Buat direktori
        const dirPath = path.join(process.cwd(), 'uploads', safeFolder);
        await fsp.mkdir(dirPath, { recursive: true });

        // Tulis file
        const filePath = path.join(dirPath, finalFilename);
        await fsp.writeFile(filePath, buffer);

        return path.join(safeFolder, finalFilename).replace(/\\/g, '/');
    }

    async saveZip(files: Array<{ name: string; buffer: Buffer }>, folder: string, zipFileName: string): Promise<string> {
        // Sanitasi input
        const safeFolder = this.sanitizeFolderName(folder);
        const sanitizedZipName = zipFileName.replace(/[^a-zA-Z0-9_.-]/g, '_') + '.zip';

        // Path lengkap
        const dirPath = path.join(process.cwd(), 'uploads', safeFolder);
        const zipFilePath = path.join(dirPath, sanitizedZipName);

        // Buat direktori
        await fsp.mkdir(dirPath, { recursive: true });

        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipFilePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            // Handle error
            output.on('error', (err) => reject(err));
            archive.on('error', (err) => reject(err));

            // Setup pipeline
            archive.pipe(output);

            // Tambahkan file
            files.forEach(file => {
                const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
                archive.append(file.buffer, { name: safeFileName });
            });

            // Finalisasi
            archive.finalize();

            // Resolve path
            output.on('close', () => {
                resolve(path.join(safeFolder, sanitizedZipName).replace(/\\/g, '/'));
            });
        });
    }
}
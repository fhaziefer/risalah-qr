// src/qr-generator/qr-generator.service.ts

import { Injectable } from '@nestjs/common';
import { StampService } from '../stamp/stamp.service';
import { SignatureService } from '../signature/signature.service';
import { FileStorageService } from '../utils/file-storage.service';
import { formatIndonesianDate, getRomanMonth, getCurrentYear } from '../utils/date.util';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QRGeneratorService {
    constructor(
        private configService: ConfigService,
        private readonly stampService: StampService,
        private readonly signatureService: SignatureService,
        private readonly fileStorage: FileStorageService,
    ) { }

    async generateAllFiles(body: any) {
        const dateNow = new Date();
        const formattedIndonesianDate = formatIndonesianDate(dateNow);
        const currentYear = getCurrentYear();
        const romanMonth = getRomanMonth();
        const kodeSurat = `${body.nomorSurat}/${body.kodeKepengurusan}/${body.kodeSurat}/${romanMonth}/${currentYear}`;
        const nomorSanitized = this.fileStorage.sanitizeNomorSurat(kodeSurat);
        const timestamp = Date.now();

        if (!body.nomorSurat || !body.kodeKepengurusan || !body.kodeSurat || !body.tingkatKepengurusan || !body.daerahKepengurusan || !body.ketua || !body.sekretaris || !body.ketuaName || !body.sekretarisName) {
            throw new Error('Data required fields are missing');
        }

        // Generate semua buffer sekaligus
        const [stampBuffer, ketuaBuffer, sekretarisBuffer] = await Promise.all([
            this.stampService.generateQRCodeWithStamp(
                kodeSurat,
                body.tingkatKepengurusan,
                body.daerahKepengurusan,
            ),
            this.signatureService.generateSignature(
                kodeSurat,
                body.tingkatKepengurusan,
                body.daerahKepengurusan,
                body.ketua,
                body.ketuaName
            ),
            this.signatureService.generateSignature(
                kodeSurat,
                body.tingkatKepengurusan,
                body.daerahKepengurusan,
                body.sekretaris,
                body.sekretarisName
            )
        ]);

        [stampBuffer, ketuaBuffer, sekretarisBuffer].forEach((buffer, index) => {
            if (!buffer || buffer.length === 0) {
                throw new Error(`Failed to generate ${['stamp', 'ketua', 'sekretaris'][index]} file`);
            }
        });

        // Format nama file
        const filePrefix = `${nomorSanitized}_${timestamp}`;
        const files = {
            stamp: {
                name: `${filePrefix}_stempel.png`,
                buffer: stampBuffer
            },
            ketua: {
                name: `${filePrefix}_ketua.png`,
                buffer: ketuaBuffer
            },
            sekretaris: {
                name: `${filePrefix}_sekretaris.png`,
                buffer: sekretarisBuffer
            }
        };

        // Simpan semua file individu
        const [stampPath, ketuaPath, sekretarisPath] = await Promise.all([
            this.fileStorage.saveFile(files.stamp.buffer, 'stamps', files.stamp.name, 'image/png'),
            this.fileStorage.saveFile(files.ketua.buffer, 'signatures', files.ketua.name, 'image/png'),
            this.fileStorage.saveFile(files.sekretaris.buffer, 'signatures', files.sekretaris.name, 'image/png')
        ]);

        // Buat file ZIP
        const zipFileName = `${filePrefix}`;
        const zipPath = await this.fileStorage.saveZip(
            Object.values(files),
            'zips',
            zipFileName
        );

        // Siapkan URL
        const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';

        return {
            individual: {
                stamp: `${baseUrl}/uploads/${stampPath}`,
                ketua: `${baseUrl}/uploads/${ketuaPath}`,
                sekretaris: `${baseUrl}/uploads/${sekretarisPath}`
            },
            zip: `${baseUrl}/uploads/${zipPath}`,
            generatedAt: formattedIndonesianDate,
            kodeSurat: kodeSurat,
            paths: {
                stamp: stampPath,
                ketua: ketuaPath,
                sekretaris: sekretarisPath,
                zip: zipPath
            }
        };
    }

    async generateBulkFiles(bulkBody: any) {
        return Promise.all(
            bulkBody.nomorSurat.map(async (nomor: string) => {
                const singleBody = {
                    ...bulkBody,
                    nomorSurat: nomor
                };
                try {
                    const result = await this.generateAllFiles(singleBody);
                    return {
                        nomorSurat: nomor,
                        ...result
                    };
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    return {
                        nomorSurat: nomor,
                        error: errorMessage
                    };
                }
            })
        );
    }
}
// src/qr-generator/qr-generator.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { QRGeneratorService } from './qr-generator.service';

@Controller('generateQR')
export class QRGeneratorController {
    constructor(private readonly qrService: QRGeneratorService) { }

    @Post()
    async generateQR(@Body() body: any) {
        try {
            // Validasi input dasar
            if (!body.nomorSurat || !body.kodeKepengurusan || !body.kodeSurat || !body.tingkatKepengurusan || !body.daerahKepengurusan || !body.ketua || !body.sekretaris || !body.ketuaName || !body.sekretarisName) {
                throw new Error('Missing required fields');
            }

            const result = await this.qrService.generateAllFiles(body);
            
            return {
                status: 'success',
                data: {
                    kodeSurat: result.kodeSurat,
                    zipUrl: result.zip, // <-- Ubah 'zip' menjadi 'zipUrl' agar cocok dengan frontend
                    generatedAt: result.generatedAt,
                    individual: result.individual // 👇 TAMBAHKAN BARIS INI
                }
            };
        } catch (error) {
            // 1. Log error asalnya
            console.error('QR Generation Error:', error);

            // 2. Lakukan pengecekan tipe
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';

            return {
                status: 'error',
                error: 'QR_GENERATION_FAILED',
                message: errorMessage,
                timestamp: new Date().toISOString()
            };
        }
    }

    @Post('bulk')
    async generateBulkQR(@Body() body: {
        nomorSurat: string[];
        kodeSurat: string;
        kodeKepengurusan: string;
        ketua: string;
        ketuaName: string;
        sekretaris: string;
        sekretarisName: string;
        tingkatKepengurusan: string;
        daerahKepengurusan: string;
    }) {
        try {
            const results = await this.qrService.generateBulkFiles(body);
            return {
                status: 'success',
                files: results
            };
        } catch (error) {
            // 1. Log error asalnya
            console.error('QR Generation Error:', error);

            // 2. Lakukan pengecekan tipe
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';

            return {
                status: 'error',
                error: 'QR_GENERATION_FAILED',
                message: errorMessage,
                timestamp: new Date().toISOString()
            };
        }
    }

}
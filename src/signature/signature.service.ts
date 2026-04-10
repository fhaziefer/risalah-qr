// src/signature/signature.service.ts

import { Injectable } from '@nestjs/common';
import { createCanvas } from 'canvas';
import * as QRCode from 'qrcode';
import { formatFullDate } from '../utils/date.util';

@Injectable()
export class SignatureService {
    /**
     * Generates a QR code containing the standard signature text
     * @returns Buffer of the QR code image in PNG format
     */
    async generateSignature(nomorSurat: string, tingkatKepengurusan: string, daerahKepengurusan: string, jabatan: string, signatureName: string): Promise<Buffer> {
        const dateNow = new Date();
        const formattedDate = formatFullDate(dateNow);
        const size = 600; // QR code size (600x600 pixels)
        const canvas = createCanvas(size, size);

        // The standard text to encode in QR code
        const signatureText = `Surat nomor ${nomorSurat} resmi diterbitkan oleh ${tingkatKepengurusan} Lembaga Ittihadul Muballighin ${daerahKepengurusan}, ditandatangai oleh ${jabatan} ${signatureName} pada ${formattedDate}`;

        // Generate QR code with the signature text
        await QRCode.toCanvas(canvas, signatureText, {
            errorCorrectionLevel: 'H', // High error correction
            margin: 0,                 // Small margin
            width: size,              // Full canvas size
            color: {
                dark: '#056bb0',      // Same blue color as before
                light: '#ffffff',     // White background
            },
        });

        return canvas.toBuffer('image/png');
    }
}
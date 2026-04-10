// src/stamp/stamp.service.ts

import { Injectable } from '@nestjs/common';
import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import { formatFullDate } from '../utils/date.util';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs'; // <-- Tambahkan ini

@Injectable()
export class StampService {
  /**
   * Menghitung sudut awal dan akhir untuk teks melingkar berdasarkan panjang teks
   */
  private calculateTextAngles(
    text: string,
    ctx: CanvasRenderingContext2D,
    radius: number,
    isBottom: boolean
  ) {
    const textWidth = ctx.measureText(text).width;
    const circumference = 2 * Math.PI * radius;

    const angleRangeRad = (textWidth / circumference) * (2 * Math.PI);
    let angleRangeDeg = angleRangeRad * (180 / Math.PI);

    angleRangeDeg = Math.min(140, angleRangeDeg * 1.1);

    if (isBottom) {
      return {
        startAngle: 90 - angleRangeDeg / 2,
        endAngle: 90 + angleRangeDeg / 2,
      };
    }

    return {
      startAngle: 270 - angleRangeDeg / 2,
      endAngle: 270 + angleRangeDeg / 2,
    };
  }

  /**
   * Menggambar teks melingkar di sekitar titik pusat
   */
  private drawCircularText(
    ctx: CanvasRenderingContext2D,
    text: string,
    centerX: number,
    centerY: number,
    radius: number,
    isBottom: boolean = false,
    margin: number = 0
  ) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#056bb0';

    const fontSize = Math.min(36, radius * 0.2);
    ctx.font = `bold ${fontSize}px Arial`;

    const angles = this.calculateTextAngles(text, ctx, radius - margin, isBottom);
    const { startAngle, endAngle } = angles;
    const angleRange = endAngle - startAngle;

    const angleRad = (angle: number) => (angle * Math.PI) / 180;

    const chars = text.split('');

    chars.forEach((char, i) => {
      const progress = i / Math.max(1, chars.length - 1);
      const angle = angleRad(startAngle + angleRange * progress);

      const x = centerX + (radius - margin) * Math.cos(angle);
      const y = centerY + (radius - margin) * Math.sin(angle);

      ctx.save();
      ctx.translate(x, y);

      if (isBottom) {
        ctx.rotate(angle - Math.PI / 2);
      } else {
        ctx.rotate(angle + Math.PI / 2);
      }

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });
  }

  /**
   * Membuat stempel dinamis dengan teks melingkar
   */
  async generateDynamicStamp(topText: string, bottomText: string): Promise<Buffer> {
    // Jalur anti-gagal (Bulletproof pathing)
    let cleanStampPath = path.join(process.cwd(), 'src/assets/images/clean_stamp.png');

    // Fallback: Jika dijalankan di production dan folder src tidak ada, ambil dari dist
    if (!fs.existsSync(cleanStampPath)) {
      cleanStampPath = path.join(process.cwd(), 'dist/assets/images/clean_stamp.png');
    }

    // Load image
    const cleanStampImage = await loadImage(cleanStampPath);

    const stampSize = 600;
    const canvas = createCanvas(stampSize, stampSize);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(cleanStampImage, 0, 0, stampSize, stampSize);

    const baseRadius = stampSize * 0.38;

    this.drawCircularText(
      ctx,
      topText.toUpperCase(),
      stampSize / 2,
      stampSize / 2,
      baseRadius,
      false,
      0
    );

    const bottomTextReverse = bottomText.split('').reverse().join('');

    this.drawCircularText(
      ctx,
      bottomTextReverse.toUpperCase(),
      stampSize / 2,
      stampSize / 2,
      baseRadius,
      true,
      0
    );

    return canvas.toBuffer('image/png');
  }

  /**
   * Membuat QR Code dengan stempel di tengah
   */
  async generateQRCodeWithStamp(
    kodeSurat: string,
    topText: string,
    bottomText: string
  ): Promise<Buffer> {
    const size = 600;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const formattedDate = formatFullDate(new Date());
    const stampText = `Surat nomor ${kodeSurat} resmi diterbitkan oleh ${topText} Lembaga Ittihadul Muballighin ${bottomText} pada ${formattedDate}`;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    await QRCode.toCanvas(canvas, stampText, {
      errorCorrectionLevel: 'H',
      margin: 0,
      width: size,
      color: {
        dark: '#056bb0',
        light: '#ffffff',
      },
    });

    const dynamicStamp = await this.generateDynamicStamp(topText, bottomText);
    const stampImage = await loadImage(dynamicStamp);

    const stampSize = size * 0.45;
    const x = (size - stampSize) / 2;
    const y = (size - stampSize) / 2;

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, stampSize / 2 + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.drawImage(stampImage, x, y, stampSize, stampSize);

    return canvas.toBuffer('image/png');
  }
}

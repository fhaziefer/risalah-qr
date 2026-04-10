// src/qr-generator/qr-generator.module.ts

import { Module } from '@nestjs/common';
import { QRGeneratorController } from './qr-generator.controller';
import { QRGeneratorService } from './qr-generator.service';
import { StampModule } from '../stamp/stamp.module';
import { SignatureModule } from '../signature/signature.module';
import { UtilsModule } from '../utils/utils.module';

@Module({
    imports: [
        StampModule,         // Module untuk layanan stamp
        SignatureModule,     // Module untuk layanan signature
        UtilsModule          // Module untuk utilitas file storage
    ],
    controllers: [QRGeneratorController],
    providers: [QRGeneratorService],
    exports: [QRGeneratorService] // Diexport jika akan digunakan di module lain
})
export class QRGeneratorModule { }
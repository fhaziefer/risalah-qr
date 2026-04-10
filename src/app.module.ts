// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QRGeneratorModule } from './qr-generator/qr-generator.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    QRGeneratorModule,
  ],
})
export class AppModule {}

// src/main.ts
// Import core NestJS factory dan module
import { NestFactory } from '@nestjs/core';
// Import root application module
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // 1. Membuat instance aplikasi NestJS
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 4. Setting Cors
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  // Serve static files
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Serve static files untuk frontend
  app.useStaticAssets(join(process.cwd(), 'public'));

  // 4. Start aplikasi
  await app.listen(process.env.PORT ?? 3000); // Gunakan PORT dari env atau default 3000

  // 5. Log informasi startup
  console.log(`App running on PORT: ${process.env.PORT || 3000}`);
}

// 5. Jalankan aplikasi
bootstrap();
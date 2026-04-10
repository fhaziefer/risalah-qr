// src/utils/utils.module.ts

import { Module } from '@nestjs/common';
import { FileStorageService } from '../utils/file-storage.service';

@Module({
    providers: [
        FileStorageService // Langsung register di sini
    ],
    exports: [
        FileStorageService // Ekspor agar bisa digunakan di modul lain
    ]
})
export class UtilsModule { }
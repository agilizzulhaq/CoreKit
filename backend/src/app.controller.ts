import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(`File tersimpan di: ${file.path}`); 
    
    // 1. Dapatkan path absolut dari file yang baru saja diunggah
    const absolutePath = path.resolve(file.path);

    try {
      // 2. Komunikasi dengan Core Engine FastAPI
      const engineResponse = await fetch('http://127.0.0.1:8000/doc/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: absolutePath }),
      });

      if (!engineResponse.ok) {
        throw new Error(`Engine error: ${engineResponse.statusText}`);
      }

      const engineData = await engineResponse.json();

      // 3. Kembalikan data dari engine (terutama doc_id) ke Frontend
      return {
        message: 'File berhasil diunggah dan dibuka oleh Core Engine!',
        fileInfo: {
          filename: file.originalname,
          size: file.size,
        },
        engineState: engineData, // Berisi doc_id, total_pages, permissions, dll.
      };

    } catch (error) {
      throw new HttpException(
        `Gagal terhubung ke Core Engine: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
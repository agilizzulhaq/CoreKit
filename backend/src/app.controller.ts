import { Controller, Post, UseInterceptors, UploadedFile, HttpException, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

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
          const ext = path.extname(file.originalname);
          const uniqueName = `${randomUUID()}${ext}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    console.log(`File tersimpan di: ${file.path}`); 
    
    const absolutePath = path.resolve(file.path);
    const password = req.body.password; // Ambil password dari body (karena dikirim via FormData)

    try {
      const bodyPayload: any = { path: absolutePath };
      if (password) {
        bodyPayload.password = password; // Sertakan password jika ada
      }

      const engineResponse = await fetch('http://127.0.0.1:8000/doc/open', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload), // Gunakan payload yang sudah berisi password
      });

      if (!engineResponse.ok) {
        // Tambahkan log untuk debug jika engine mengembalikan error
        const errorData = await engineResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || engineResponse.statusText);
      }

      const engineData = await engineResponse.json();

      return {
        message: 'File berhasil diunggah dan dibuka oleh Core Engine!',
        fileInfo: {
          filename: file.originalname,
          size: file.size,
        },
        engineState: engineData,
      };

    } catch (error) {
      throw new HttpException(
        `Gagal terhubung ke Core Engine: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
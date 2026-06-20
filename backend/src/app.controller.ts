import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';

@Controller()
export class AppController {
  
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          // Membuat folder 'uploads' secara otomatis jika belum ada
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          // Menyimpan file dengan nama aslinya
          cb(null, file.originalname);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log(`File tersimpan di: ${file.path}`); 
    
    return {
      message: 'File berhasil disimpan secara fisik oleh NestJS!',
      filename: file.originalname,
      size: file.size,
    };
  }
}
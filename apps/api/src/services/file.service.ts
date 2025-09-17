import { cloudinary } from "../configs/cloudinary.config.js";
import { Readable } from "node:stream";

export class FileService {
  // Upload a Buffer to Cloudinary using upload_stream (no temp file)
  async uploadBuffer(buffer: Buffer, options?: any): Promise<string> {
    if (!buffer) throw new Error("No buffer provided for upload");

    return await new Promise<string>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options ?? {}, (error: any, result: any) => {
        if (error) return reject(error);
        if (!result || !result.secure_url) return reject(new Error("Invalid upload result"));
        resolve(result.secure_url as string);
      });

      // Create a small readable stream from the provided buffer and pipe it to Cloudinary
      const readable = new Readable({ read() {} });
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream).on("error", (err) => reject(err));
    });
  }
}

export const fileService = new FileService();
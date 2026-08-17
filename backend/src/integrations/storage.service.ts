import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { config } from "@/config/env";
import { ApiErrors } from "@/utils/errors";
import { UploadApiResponse } from "cloudinary";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger";

class StorageService {
    /**
     * Uploads a buffer directly to local storage (bypassing Cloudinary PDF restrictions)
     */
    async uploadFile(fileBuffer: Buffer, folder: string, filename: string): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            try {
                // Ensure the uploads directory exists
                const uploadsDir = path.join(process.cwd(), 'uploads', folder);
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }

                const filePath = path.join(uploadsDir, filename);
                fs.writeFileSync(filePath, fileBuffer);

                // Return a mock Cloudinary response with the local URL
                resolve({
                    public_id: `${folder}/${filename}`,
                    secure_url: `http://localhost:5000/uploads/${folder}/${filename}`,
                    version: 1,
                    signature: '',
                    width: 0,
                    height: 0,
                    format: '',
                    resource_type: '',
                    created_at: new Date().toISOString(),
                    tags: [],
                    bytes: fileBuffer.length,
                    type: '',
                    etag: '',
                    placeholder: false,
                    url: ''
                } as UploadApiResponse);
            } catch (error) {
                logger.error('Local Upload Error:', error);
                reject(error);
            }
        });
    }

    /**
     * Deletes a file from local storage using its public_id.
     */
    async deleteFile(publicId: string): Promise<void> {
        try {
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            logger.error('Cloudinary Delete Error:', error);
            // We usually don't block the request if delete fails, just log it.
        }
    }
}

export const storageService = new StorageService();
import { supabaseAdmin } from "@/config/supabase";
import { logger } from "@/utils/logger";

class StorageService {
    private readonly bucketName = 'StructurFlow';

    /**
     * Uploads a file buffer directly to Supabase Storage
     */
    async uploadFile(fileBuffer: Buffer, folder: string, filename: string, mimeType: string) {
        try {
            const filePath = `${folder}/${filename}`;

            const { data, error } = await supabaseAdmin.storage
                .from(this.bucketName)
                .upload(filePath, fileBuffer, {
                    contentType: mimeType,
                    upsert: false
                });

            if (error) {
                logger.error('Supabase Upload Error:', error);
                throw error;
            }

            // Get the public URL for the uploaded file
            const { data: urlData } = supabaseAdmin.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);

            return {
                public_id: filePath,
                secure_url: urlData.publicUrl
            };
        } catch (error) {
            logger.error('Storage Service Upload Error:', error);
            throw error;
        }
    }

    /**
     * Deletes a file from Supabase storage using its file path
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            const { error } = await supabaseAdmin.storage
                .from(this.bucketName)
                .remove([filePath]);
                
            if (error) {
                logger.error('Supabase Delete Error:', error);
            }
        } catch (error) {
            logger.error('Storage Service Delete Error:', error);
        }
    }
}

export const storageService = new StorageService();
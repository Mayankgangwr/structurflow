import multer, { Multer } from "multer";
import { ApiErrors } from "@/utils/errors";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_bYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const allowedMimeType = [
    'application/pdf',
    'image/jpeg',
    'image/png'
];

const storage = multer.memoryStorage(); // Store in RAM temporarily before pushing to Cloudinary

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedMimeType.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(ApiErrors.invalidFileType(file.mimetype));
    }
};

export const uploadMiddleware = multer({
    storage,
    limits: {
        fileSize: MAX_FILE_SIZE_bYTES,
    },
    fileFilter,
});


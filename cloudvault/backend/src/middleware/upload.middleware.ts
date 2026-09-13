import multer from 'multer';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { isDangerousExtension, sanitizeFileName } from '../utils/filename';

export const uploadFiles = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE, files: 20 },
  fileFilter: (_req, file, callback) => {
    const name = sanitizeFileName(file.originalname);
    if (isDangerousExtension(name)) {
      callback(new ApiError(400, 'UPLOAD_ERROR', `The file type for "${name}" is not allowed`));
      return;
    }
    callback(null, true);
  },
});

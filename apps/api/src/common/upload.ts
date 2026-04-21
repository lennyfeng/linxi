import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

export function generateFileKey(originalName: string, prefix = 'uploads'): string {
  const ext = path.extname(originalName);
  const id = uuidv4();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
  return `${prefix}/${date}/${id}${ext}`;
}

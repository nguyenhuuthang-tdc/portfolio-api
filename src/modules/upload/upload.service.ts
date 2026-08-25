import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { AppError } from '../../middleware/error.middleware';
import { toUploadDiskPath } from '../../utils/media-path';

const UPLOADS_BASE = path.join(__dirname, '../../../uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

function getUploadDir(module: string): string {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dir = path.join(UPLOADS_BASE, module, year, month);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed (jpeg, png, webp, gif, svg)', 400));
    }
  },
});

export const uploadService = {
  async processAndSave(
    buffer: Buffer,
    originalname: string,
    module: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'webp' | 'png' | 'svg';
      mimetype?: string;
    } = {}
  ): Promise<string> {
    const { width, height, quality = 85, format = 'webp', mimetype } = options;
    const dir = getUploadDir(module);

    const isSvg =
      mimetype === 'image/svg+xml' ||
      format === 'svg' ||
      path.extname(originalname).toLowerCase() === '.svg';

    const safeName = path
      .basename(originalname, path.extname(originalname))
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();

    if (isSvg) {
      const filename = `${safeName}-${Date.now()}.svg`;
      const filepath = path.join(dir, filename);
      fs.writeFileSync(filepath, buffer);
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      return `/uploads/${module}/${year}/${month}/${filename}`;
    }

    const filename = `${safeName}-${Date.now()}.${format}`;
    const filepath = path.join(dir, filename);

    let sharpInstance = sharp(buffer);
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (format === 'jpeg') {
      await sharpInstance.jpeg({ quality }).toFile(filepath);
    } else if (format === 'png') {
      await sharpInstance.png({ quality }).toFile(filepath);
    } else {
      await sharpInstance.webp({ quality }).toFile(filepath);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `/uploads/${module}/${year}/${month}/${filename}`;
  },

  deleteFile(publicPath: string): void {
    const filepath = path.join(UPLOADS_BASE, toUploadDiskPath(publicPath));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  },
};

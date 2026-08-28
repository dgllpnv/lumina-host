import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireAdmin } from '../middleware/rbac.js';
import { uploadPhoto, deletePhoto } from '../controllers/uploads.controller.js';

const router = Router();

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const orgId = req.effectiveOrgId;
    if (!orgId) return cb(new Error('Organization context required'), '');
    const dir = path.join(process.cwd(), 'public', 'uploads', orgId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new Error('Tipo de arquivo não suportado. Use JPG, PNG, WEBP ou GIF.'));
    }
    cb(null, true);
  },
});

router.post('/', authMiddleware, orgFilterMiddleware, requireAdmin, upload.single('photo'), uploadPhoto);
router.delete('/', authMiddleware, orgFilterMiddleware, requireAdmin, deletePhoto);

export default router;

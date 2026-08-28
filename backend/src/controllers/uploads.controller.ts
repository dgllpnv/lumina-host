import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const uploadPhoto = async (req: AuthenticatedRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    const url = `/uploads/${req.effectiveOrgId}/${req.file.filename}`;
    res.status(201).json({ url });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
};

// Só permite apagar arquivos dentro da própria pasta de uploads da organização
// do usuário — impede path traversal e apagar arquivos de outro cliente.
export const deletePhoto = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads');
    const orgDir = path.join(uploadsRoot, String(req.effectiveOrgId));
    const requestedPath = path.join(process.cwd(), 'public', url);

    const normalizedOrgDir = path.normalize(orgDir + path.sep);
    const normalizedRequested = path.normalize(requestedPath);

    if (!normalizedRequested.startsWith(normalizedOrgDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (fs.existsSync(normalizedRequested)) {
      fs.unlinkSync(normalizedRequested);
    }

    res.json({ message: 'Photo deleted' });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
};

import express from 'express';
import logger from '../utils/logger';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { Embeddings } from '@langchain/core/embeddings';
import { getAvailableEmbeddingModelProviders, getEmbeddingModel } from '../lib/providers';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from 'langchain/document';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 100,
});

interface MulterFile extends Express.Multer.File {
  fileId?: string;
}

interface MulterRequest extends express.Request {
  files?: MulterFile[] | { [fieldname: string]: MulterFile[] };
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileId = uuidv4();
    (file as MulterFile).fileId = fileId;
    cb(null, fileId + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/', upload.array('files'), async (req: MulterRequest, res) => {
  try {
    const embeddingModelProvider = req.body.embedding_model_provider;
    const embeddingModel = req.body.embedding_model;

    const embeddingClient = await getEmbeddingModel(
      embeddingModelProvider,
      embeddingModel,
    );

    if (!embeddingClient) {
      throw new Error('Failed to initialize embedding model');
    }

    const files = Array.isArray(req.files) ? req.files : [];
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const fileContent = fs.readFileSync(file.path, 'utf-8');
        const embedding = await embeddingClient.embedQuery(fileContent);

        return {
          fileId: file.fileId,
          name: file.originalname,
          path: file.path,
          embedding,
        };
      }),
    );

    res.json({ files: processedFiles });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({ error: 'Failed to process files' });
  }
});

export default router;

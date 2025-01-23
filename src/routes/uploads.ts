import express, { Request, Response } from 'express';
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

interface ProcessedFile {
  fileId?: string;
  name: string;
  path: string;
  embedding: number[];
}

interface UploadRequestBody {
  embedding_model_provider: string;
  embedding_model: string;
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

const processUpload = async (req: Request, res: Response) => {
  try {
    const body = req.body as UploadRequestBody;
    const files = req.files as MulterFile[];

    if (!files || !Array.isArray(files)) {
      throw new Error('No files uploaded');
    }

    const embeddingClient = await getEmbeddingModel(
      body.embedding_model_provider,
      body.embedding_model,
    );

    if (!embeddingClient) {
      throw new Error('Failed to initialize embedding model');
    }

    const processedFiles: ProcessedFile[] = await Promise.all(
      files.map(async (file: MulterFile) => {
        try {
          const fileContent = fs.readFileSync(file.path, 'utf-8');
          const embedding = await embeddingClient.embedQuery(fileContent);

          return {
            fileId: file.fileId,
            name: file.originalname,
            path: file.path,
            embedding,
          };
        } catch (err) {
          logger.error(`Error processing file ${file.originalname}: ${err instanceof Error ? err.message : String(err)}`);
          throw new Error(`Failed to process file ${file.originalname}`);
        }
      }),
    );

    res.json({ files: processedFiles });
  } catch (err) {
    logger.error(`Error processing files: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to process files' });
  }
};

router.post('/', upload.array('files'), processUpload);

export default router;

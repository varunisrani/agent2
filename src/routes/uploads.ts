import express, { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import multer, { Multer } from 'multer';
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
import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

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

type RequestWithFiles = Request<
  ParamsDictionary,
  any,
  UploadRequestBody,
  ParsedQs,
  Record<string, any>
> & {
  files: MulterFile[];
};

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

const handleUpload = async (
  req: RequestWithFiles,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || !Array.isArray(req.files)) {
      throw new Error('No files uploaded');
    }

    const embeddingClient = await getEmbeddingModel(
      req.body.embedding_model_provider,
      req.body.embedding_model,
    );

    if (!embeddingClient) {
      throw new Error('Failed to initialize embedding model');
    }

    const processedFiles: ProcessedFile[] = await Promise.all(
      req.files.map(async (file: MulterFile) => {
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
    next(err);
  }
};

router.post('/', [
  upload.array('files'),
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err) {
      logger.error(`Error processing files: ${err instanceof Error ? err.message : String(err)}`);
      res.status(500).json({ error: 'Failed to process files' });
    } else {
      next();
    }
  },
  handleUpload as express.RequestHandler
]);

export default router;

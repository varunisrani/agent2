import express from 'express';
import logger from '../utils/logger';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '../lib/providers';

interface ModelInfo {
  displayName: string;
  model?: any;  // Making model optional
}

interface ModelProvider {
  [key: string]: ModelInfo;
}

interface ModelProviders {
  [key: string]: ModelProvider;
}

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const [chatModelProviders, embeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const sanitizedChatProviders: ModelProviders = {};
    const sanitizedEmbeddingProviders: ModelProviders = {};

    // Create new objects without the model property for chat providers
    Object.keys(chatModelProviders).forEach((provider) => {
      sanitizedChatProviders[provider] = {};
      Object.keys(chatModelProviders[provider]).forEach((model) => {
        const { model: _, ...rest } = chatModelProviders[provider][model];
        sanitizedChatProviders[provider][model] = rest;
      });
    });

    // Create new objects without the model property for embedding providers
    Object.keys(embeddingModelProviders).forEach((provider) => {
      sanitizedEmbeddingProviders[provider] = {};
      Object.keys(embeddingModelProviders[provider]).forEach((model) => {
        const { model: _, ...rest } = embeddingModelProviders[provider][model];
        sanitizedEmbeddingProviders[provider][model] = rest;
      });
    });

    res.json({ 
      chatModelProviders: sanitizedChatProviders, 
      embeddingModelProviders: sanitizedEmbeddingProviders 
    });
  } catch (err) {
    logger.error(`Error getting models: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

export default router;

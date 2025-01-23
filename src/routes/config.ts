import express from 'express';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '../lib/providers';
import {
  getGroqApiKey,
  getOllamaApiEndpoint,
  getAnthropicApiKey,
  getGeminiApiKey,
  getOpenaiApiKey,
  updateConfig,
} from '../config';
import logger from '../utils/logger';

interface ModelInfo {
  name: string;
  displayName: string;
}

interface ModelProvider {
  [key: string]: {
    displayName: string;
    [key: string]: any;
  };
}

interface ModelProviders {
  [key: string]: ModelProvider;
}

interface Config {
  [key: string]: any;
  chatModelProviders: { [key: string]: ModelInfo[] };
  embeddingModelProviders: { [key: string]: ModelInfo[] };
  openaiApiKey?: string;
  ollamaApiUrl?: string;
  anthropicApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
}

const router = express.Router();

router.get('/', async (_, res) => {
  try {
    const config: Config = {
      chatModelProviders: {},
      embeddingModelProviders: {},
    };

    const [chatModelProviders, embeddingModelProviders]: [ModelProviders, ModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    for (const provider in chatModelProviders) {
      config.chatModelProviders[provider] = Object.keys(
        chatModelProviders[provider],
      ).map((model) => {
        return {
          name: model,
          displayName: chatModelProviders[provider][model].displayName,
        };
      });
    }

    for (const provider in embeddingModelProviders) {
      config.embeddingModelProviders[provider] = Object.keys(
        embeddingModelProviders[provider],
      ).map((model) => {
        return {
          name: model,
          displayName: embeddingModelProviders[provider][model].displayName,
        };
      });
    }

    config.openaiApiKey = getOpenaiApiKey();
    config.ollamaApiUrl = getOllamaApiEndpoint();
    config.anthropicApiKey = getAnthropicApiKey();
    config.groqApiKey = getGroqApiKey();
    config.geminiApiKey = getGeminiApiKey();

    res.json(config);
  } catch (err) {
    logger.error(`Error getting config: ${err instanceof Error ? err.message : String(err)}`);
    res.status(500).json({ error: 'Failed to get config' });
  }
});

router.post('/', async (req, res) => {
  const config = req.body;

  const updatedConfig = {
    API_KEYS: {
      OPENAI: config.openaiApiKey,
      GROQ: config.groqApiKey,
      ANTHROPIC: config.anthropicApiKey,
      GEMINI: config.geminiApiKey,
    },
    API_ENDPOINTS: {
      OLLAMA: config.ollamaApiUrl,
    },
  };

  updateConfig(updatedConfig);

  res.status(200).json({ message: 'Config updated' });
});

export default router;

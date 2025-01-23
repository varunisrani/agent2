import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { getKeepAlive, getOllamaApiEndpoint } from '../../config';
import logger from '../../utils/logger';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import axios from 'axios';
import { ModelProvider } from './types';

interface OllamaModel {
  name: string;
  parameters: Record<string, unknown>;
}

export class OllamaProvider implements ModelProvider {
  private models: OllamaModel[] = [];

  getAvailableModels(acc: OllamaModel[], model: OllamaModel): OllamaModel[] {
    // Type-safe implementation
    return [...acc, model];
  }

  async loadModels(): Promise<void> {
    // Implementation
  }
}

export const loadOllamaChatModels = async () => {
  const ollamaEndpoint = getOllamaApiEndpoint();
  const keepAlive = getKeepAlive();

  if (!ollamaEndpoint) return {};

  try {
    const response = await axios.get(`${ollamaEndpoint}/api/tags`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { models: ollamaModels } = response.data;

    const chatModels = ollamaModels.reduce((acc, model) => {
      acc[model.model] = {
        displayName: model.name,
        model: new ChatOllama({
          baseUrl: ollamaEndpoint,
          model: model.model,
          temperature: 0.7,
          keepAlive: keepAlive,
        }),
      };

      return acc;
    }, {});

    return chatModels;
  } catch (err) {
    logger.error(`Error loading Ollama models: ${err}`);
    return {};
  }
};

export const loadOllamaEmbeddingsModels = async () => {
  const ollamaEndpoint = getOllamaApiEndpoint();

  if (!ollamaEndpoint) return {};

  try {
    const response = await axios.get(`${ollamaEndpoint}/api/tags`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { models: ollamaModels } = response.data;

    const embeddingsModels = ollamaModels.reduce((acc, model) => {
      acc[model.model] = {
        displayName: model.name,
        model: new OllamaEmbeddings({
          baseUrl: ollamaEndpoint,
          model: model.model,
        }),
      };

      return acc;
    }, {});

    return embeddingsModels;
  } catch (err) {
    logger.error(`Error loading Ollama embeddings model: ${err}`);
    return {};
  }
};

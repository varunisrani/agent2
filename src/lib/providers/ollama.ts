import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { getKeepAlive, getOllamaApiEndpoint } from '../../config';
import logger from '../../utils/logger';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import axios from 'axios';
import { ModelProvider } from './types';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';

interface OllamaModel {
  name: string;
  parameters: Record<string, unknown>;
}

interface OllamaModelResponse {
  model: string;
  name: string;
}

interface ChatModelMap {
  [key: string]: {
    displayName: string;
    model: ChatOllama;
  };
}

interface EmbeddingsModelMap {
  [key: string]: {
    displayName: string;
    model: OllamaEmbeddings;
  };
}

export class OllamaProvider implements ModelProvider {
  private models: OllamaModel[] = [];
  private chatModels: BaseChatModel[] = [];
  private embeddingModels: Embeddings[] = [];

  getAvailableModels<T>(acc: T[], model: T): T[] {
    return [...acc, model];
  }

  getChatModels(): BaseChatModel[] {
    return this.chatModels;
  }

  getEmbeddingModels(): Embeddings[] {
    return this.embeddingModels;
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

    const chatModels = ollamaModels.reduce((acc: ChatModelMap, model: OllamaModelResponse) => {
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
    logger.error(`Error loading Ollama models: ${err instanceof Error ? err.message : String(err)}`);
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

    const embeddingsModels = ollamaModels.reduce((acc: EmbeddingsModelMap, model: OllamaModelResponse) => {
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
    logger.error(`Error loading Ollama embeddings model: ${err instanceof Error ? err.message : String(err)}`);
    return {};
  }
};

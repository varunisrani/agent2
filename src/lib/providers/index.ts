import { loadGroqChatModels } from './groq';
import { loadOllamaChatModels, loadOllamaEmbeddingsModels } from './ollama';
import { loadOpenAIChatModels, loadOpenAIEmbeddingsModels } from './openai';
import { loadAnthropicChatModels } from './anthropic';
import { loadTransformersEmbeddingsModels } from './transformers';
import { loadGeminiChatModels, loadGeminiEmbeddingsModels } from './gemini';
import { Embeddings } from '@langchain/core/embeddings';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

interface ModelProvider<T> {
  [key: string]: {
    model: T;
    displayName: string;
    [key: string]: any;
  };
}

interface ChatModelProviders {
  [key: string]: () => Promise<ModelProvider<BaseChatModel>>;
}

interface EmbeddingModelProviders {
  [key: string]: () => Promise<ModelProvider<Embeddings>>;
}

const chatModelProviders: ChatModelProviders = {
  openai: loadOpenAIChatModels,
  groq: loadGroqChatModels,
  ollama: loadOllamaChatModels,
  anthropic: loadAnthropicChatModels,
  gemini: loadGeminiChatModels,
};

const embeddingModelProviders: EmbeddingModelProviders = {
  openai: loadOpenAIEmbeddingsModels,
  local: loadTransformersEmbeddingsModels,
  ollama: loadOllamaEmbeddingsModels,
  gemini: loadGeminiEmbeddingsModels,
};

export const getAvailableChatModelProviders = async () => {
  const models: { [key: string]: ModelProvider<BaseChatModel> } = {};

  for (const provider in chatModelProviders) {
    const providerModels = await chatModelProviders[provider]();
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  models['custom_openai'] = {};

  return models;
};

export const getAvailableEmbeddingModelProviders = async () => {
  const models: { [key: string]: ModelProvider<Embeddings> } = {};

  for (const provider in embeddingModelProviders) {
    const providerModels = await embeddingModelProviders[provider]();
    if (Object.keys(providerModels).length > 0) {
      models[provider] = providerModels;
    }
  }

  return models;
};

export const getEmbeddingModel = async (provider: string, model: string): Promise<Embeddings> => {
  if (!embeddingModelProviders[provider]) {
    throw new Error(`Invalid embedding model provider: ${provider}`);
  }

  const providerModels = await embeddingModelProviders[provider]();
  const embeddingModel = providerModels[model];

  if (!embeddingModel) {
    throw new Error(`Invalid embedding model: ${model}`);
  }

  return embeddingModel.model;
};
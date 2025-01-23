import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';

export interface ModelProvider {
  loadModels(): Promise<void>;
  getAvailableModels<T>(acc: T[], model: T): T[];
  getChatModels(): BaseChatModel[];
  getEmbeddingModels(): Embeddings[];
} 
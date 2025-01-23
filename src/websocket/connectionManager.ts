import { WebSocket } from 'ws';
import { handleMessage } from './messageHandler';
import {
  getAvailableEmbeddingModelProviders,
  getAvailableChatModelProviders,
} from '../lib/providers';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import type { IncomingMessage } from 'http';
import logger from '../utils/logger';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessageChunk } from '@langchain/core/messages';

interface ChatModelProviders {
  [key: string]: {
    [key: string]: {
      model: BaseChatModel;
      [key: string]: any;
    };
  };
}

interface EmbeddingModelProviders {
  [key: string]: {
    [key: string]: {
      model: Embeddings;
      [key: string]: any;
    };
  };
}

export const handleConnection = async (
  ws: WebSocket,
  request: IncomingMessage,
): Promise<void> => {
  try {
    const searchParams = new URL(request.url || '', `http://${request.headers.host}`)
      .searchParams;

    const [chatModelProviders, embeddingModelProviders]: [ChatModelProviders, EmbeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider: string =
      searchParams.get('chatModelProvider') ||
      Object.keys(chatModelProviders)[0];
    const chatModel: string =
      searchParams.get('chatModel') ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    const embeddingModelProvider: string =
      searchParams.get('embeddingModelProvider') ||
      Object.keys(embeddingModelProviders)[0];
    const embeddingModel: string =
      searchParams.get('embeddingModel') ||
      Object.keys(embeddingModelProviders[embeddingModelProvider])[0];

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel] &&
      chatModelProvider !== 'custom_openai'
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel].model;
    } else if (chatModelProvider === 'custom_openai') {
      const openAIApiKey = searchParams.get('openAIApiKey');
      const openAIBaseURL = searchParams.get('openAIBaseURL');
      
      if (!openAIApiKey || !openAIBaseURL) {
        throw new Error('Missing OpenAI API key or base URL');
      }

      llm = new ChatOpenAI({
        modelName: chatModel,
        openAIApiKey,
        temperature: 0.7,
        configuration: {
          baseURL: openAIBaseURL,
        },
      }) as unknown as BaseChatModel;
    }

    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][embeddingModel].model;
    }

    if (!llm || !embeddings) {
      ws.send(
        JSON.stringify({
          type: 'error',
          data: 'Invalid LLM or embeddings model selected, please refresh the page and try again.',
          key: 'INVALID_MODEL_SELECTED',
        }),
      );
      ws.close();
      return;
    }

    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'signal',
            data: 'open',
          }),
        );
        clearInterval(interval);
      }
    }, 5);

    ws.on('message', async (message: Buffer | ArrayBuffer | Buffer[]) => {
      await handleMessage(message.toString(), ws, llm, embeddings);
    });

    ws.on('close', () => logger.debug('Connection closed'));
  } catch (error) {
    logger.error('Error in connection handler:', error);
    ws.close();
  }
};

export class ConnectionManager {
  private model?: BaseChatModel;
  private ws: WebSocket;

  constructor(url: string) {
    this.ws = new WebSocket(url);
  }

  async setModel(model: BaseChatModel): Promise<void> {
    this.model = model;
  }

  async processMessage(message: BaseMessageChunk): Promise<void> {
    if (!this.model) {
      throw new Error('Model not set');
    }
    if (this.ws.readyState !== this.ws.OPEN) {
      throw new Error('WebSocket not connected');
    }
    // Process message implementation
  }
}

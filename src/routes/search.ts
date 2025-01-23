import express from 'express';
import logger from '../utils/logger';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { ChatOpenAI } from '@langchain/openai';
import {
  getAvailableChatModelProviders,
  getAvailableEmbeddingModelProviders,
} from '../lib/providers';
import { searchHandlers } from '../websocket/messageHandler';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { MetaSearchAgentType } from '../search/metaSearchAgent';
import { getErrorMessage } from '../utils/errors';
import { BaseRetriever } from '@langchain/core/retrievers';

const router = express.Router();

interface SearchHandlers {
  [key: string]: MetaSearchAgentType;
}

interface ChatModel {
  provider: string;
  model: string;
  customOpenAIBaseURL?: string;
  customOpenAIKey?: string;
}

interface EmbeddingModel {
  provider: string;
  model: string;
}

interface ChatRequestBody {
  optimizationMode: 'speed' | 'balanced';
  focusMode: string;
  chatModel?: ChatModel;
  embeddingModel?: EmbeddingModel;
  query: string;
  history: Array<[string, string]>;
}

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

router.post('/', async (req, res) => {
  try {
    const body: ChatRequestBody = req.body;

    if (!body.focusMode || !body.query) {
      return res.status(400).json({ message: 'Missing focus mode or query' });
    }

    body.history = body.history || [];
    body.optimizationMode = body.optimizationMode || 'balanced';

    const history: BaseMessage[] = body.history.map((msg: [string, string]) => {
      if (msg[0] === 'human') {
        return new HumanMessage({
          content: msg[1],
        });
      } else {
        return new AIMessage({
          content: msg[1],
        });
      }
    });

    const [chatModelProviders, embeddingModelProviders]: [ChatModelProviders, EmbeddingModelProviders] = await Promise.all([
      getAvailableChatModelProviders(),
      getAvailableEmbeddingModelProviders(),
    ]);

    const chatModelProvider: string =
      body.chatModel?.provider || Object.keys(chatModelProviders)[0];
    const chatModel: string =
      body.chatModel?.model ||
      Object.keys(chatModelProviders[chatModelProvider])[0];

    const embeddingModelProvider: string =
      body.embeddingModel?.provider || Object.keys(embeddingModelProviders)[0];
    const embeddingModel: string =
      body.embeddingModel?.model ||
      Object.keys(embeddingModelProviders[embeddingModelProvider])[0];

    let llm: BaseChatModel | undefined;
    let embeddings: Embeddings | undefined;

    if (body.chatModel?.provider === 'custom_openai') {
      if (
        !body.chatModel?.customOpenAIBaseURL ||
        !body.chatModel?.customOpenAIKey
      ) {
        return res
          .status(400)
          .json({ message: 'Missing custom OpenAI base URL or key' });
      }

      llm = new ChatOpenAI({
        modelName: body.chatModel.model,
        openAIApiKey: body.chatModel.customOpenAIKey,
        temperature: 0.7,
        configuration: {
          baseURL: body.chatModel.customOpenAIBaseURL,
        },
      }) as unknown as BaseChatModel;
    } else if (
      chatModelProviders[chatModelProvider] &&
      chatModelProviders[chatModelProvider][chatModel]
    ) {
      llm = chatModelProviders[chatModelProvider][chatModel]
        .model as unknown as BaseChatModel | undefined;
    }

    if (
      embeddingModelProviders[embeddingModelProvider] &&
      embeddingModelProviders[embeddingModelProvider][embeddingModel]
    ) {
      embeddings = embeddingModelProviders[embeddingModelProvider][
        embeddingModel
      ].model as Embeddings | undefined;
    }

    if (!llm || !embeddings) {
      return res.status(400).json({ message: 'Invalid model selected' });
    }

    const typedSearchHandlers = searchHandlers as SearchHandlers;
    const searchHandler: MetaSearchAgentType = typedSearchHandlers[body.focusMode];
    if (!searchHandler) {
      return res.status(400).json({ message: 'Invalid focus mode' });
    }

    const emitter = await searchHandler.searchAndAnswer(
      body.query,
      history,
      llm,
      embeddings,
      body.optimizationMode,
      [],
    );

    res.status(200).json({ emitter });
  } catch (err: unknown) {
    const errorMessage = getErrorMessage(err);
    res.status(500).json({ message: 'An error has occurred.' });
    logger.error(`Error in search: ${errorMessage}`);
  }
});

export default router;

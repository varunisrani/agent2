import { MetaSearchAgentType } from '../search/metaSearchAgent';

export interface ConfigType {
  chatModelProviders: Record<string, any>;
  embeddingModelProviders: Record<string, any>;
  openaiApiKey?: string;
  ollamaApiUrl?: string;
  anthropicApiKey?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
}

export interface SearchAgents {
  webSearch: MetaSearchAgentType;
  academicSearch: MetaSearchAgentType;
  writingAssistant: MetaSearchAgentType;
  wolframAlphaSearch: MetaSearchAgentType;
  youtubeSearch: MetaSearchAgentType;
  redditSearch: MetaSearchAgentType;
  [key: string]: MetaSearchAgentType;  // Add index signature
} 
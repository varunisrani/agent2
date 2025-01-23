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
  webSearch: MetaSearchAgent;
  academicSearch: MetaSearchAgent;
  writingAssistant: MetaSearchAgent;
  wolframAlphaSearch: MetaSearchAgent;
  youtubeSearch: MetaSearchAgent;
  redditSearch: MetaSearchAgent;
  [key: string]: MetaSearchAgent;  // Add index signature
} 
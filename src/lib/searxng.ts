import axios from 'axios';
import { getSearxngApiEndpoint } from '../config';

interface SearxngSearchOptions {
  [key: string]: any;  // Add index signature
  engines?: string[];
  language?: string;
  time_range?: string;
  safesearch?: number;
}

interface SearxngSearchResult {
  title: string;
  url: string;
  img_src?: string;
  thumbnail_src?: string;
  thumbnail?: string;
  content?: string;
  author?: string;
  iframe_src?: string;
}

export const searchSearxng = async (
  query: string,
  opts?: SearxngSearchOptions,
) => {
  const searxngURL = getSearxngApiEndpoint();

  const url = new URL(`${searxngURL}/search?format=json`);
  url.searchParams.append('q', query);

  if (opts) {
    Object.keys(opts).forEach((key) => {
      if (Array.isArray(opts[key])) {
        url.searchParams.append(key, opts[key].join(','));
        return;
      }
      url.searchParams.append(key, opts[key]);
    });
  }

  const res = await axios.get(url.toString());

  const results: SearxngSearchResult[] = res.data.results;
  const suggestions: string[] = res.data.suggestions;

  return { results, suggestions };
};

export class SearxngSearch {
  private options: SearxngSearchOptions;
  
  constructor(options: SearxngSearchOptions = {}) {
    this.options = options;
  }

  // ... rest of the code with type-safe access
  async search(query: string, options: Partial<SearxngSearchOptions> = {}): Promise<{ results: SearxngSearchResult[], suggestions: string[] }> {
    const searchOptions: SearxngSearchOptions = {
      ...this.options,
      ...options
    };
    
    return searchSearxng(query, searchOptions);
  }
}

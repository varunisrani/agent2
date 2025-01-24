import { BaseOutputParser } from "@langchain/core/output_parsers";
import { RunnableConfig } from "@langchain/core/runnables";
import { BaseMessageChunk, MessageContent, MessageContentText } from "@langchain/core/messages";

export class ListLineOutputParser extends BaseOutputParser<string[]> {
  lc_namespace = ["local", "list_line"];
  private key: string;

  constructor(options?: { key?: string }) {
    super();
    this.key = options?.key ?? 'suggestions';
  }

  static lc_name(): string {
    return "ListLineOutputParser";
  }

  async invoke(input: BaseMessageChunk | string, options?: RunnableConfig): Promise<string[]> {
    const text = typeof input === 'string' ? input : this.extractText(input);
    return this.parse(text, options?.callbacks);
  }

  private isTextContent(content: MessageContent): content is string | MessageContentText {
    return typeof content === 'string' || 
           (typeof content === 'object' && 'type' in content && content.type === 'text');
  }

  private extractText(message: BaseMessageChunk): string {
    if (typeof message.content === 'string') {
      return message.content;
    }
    // Handle complex message content by concatenating all text parts
    if (Array.isArray(message.content)) {
      return message.content
        .filter(this.isTextContent)
        .map(content => typeof content === 'string' ? content : content.text)
        .join('\n');
    }
    // Handle single complex content
    if (this.isTextContent(message.content)) {
      return typeof message.content === 'string' ? message.content : message.content.text;
    }
    return '';
  }

  async parse(text: string, callbacks?: RunnableConfig['callbacks']): Promise<string[]> {
    const startKeyIndex = text.indexOf(`<${this.key}>`);
    const endKeyIndex = text.indexOf(`</${this.key}>`);

    if (startKeyIndex === -1 || endKeyIndex === -1) {
      // If no tags found, split by newlines
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }

    const contentStartIndex = startKeyIndex + `<${this.key}>`.length;
    const content = text.slice(contentStartIndex, endKeyIndex).trim();

    return content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  getFormatInstructions(): string {
    return `Return your response as a list, with each item on a new line, wrapped in <${this.key}> tags.`;
  }
}
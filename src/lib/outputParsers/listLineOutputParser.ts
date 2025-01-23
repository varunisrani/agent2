import { BaseOutputParser } from "langchain/schema/output_parser";
import { Callbacks } from "langchain/callbacks";

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

  async parse(text: string, callbacks?: Callbacks): Promise<string[]> {
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
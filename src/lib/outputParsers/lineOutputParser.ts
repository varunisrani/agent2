import { BaseOutputParser } from "langchain/schema/output_parser";

interface LineOutputParserArgs {
  key?: string;
}

export class LineOutputParser extends BaseOutputParser<string[]> {
  private key = 'questions';

  constructor(args?: LineOutputParserArgs) {
    super();
    if (args?.key !== undefined) {
      this.key = args.key;
    }
  }

  static lc_name() {
    return 'LineOutputParser';
  }

  lc_namespace = ['langchain', 'output_parsers', 'line_output_parser'];

  async parse(text: string, args?: any): Promise<string[]> {
    if (!args) {
      return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    const startKeyIndex = text.indexOf(`<${this.key}>`);
    const endKeyIndex = text.indexOf(`</${this.key}>`);

    if (startKeyIndex === -1 || endKeyIndex === -1) {
      // If no tags found, split by newlines
      return text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    }

    const contentStartIndex = startKeyIndex + `<${this.key}>`.length;
    const content = text.slice(contentStartIndex, endKeyIndex).trim();

    return content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  }

  getFormatInstructions(): string {
    return `Return your response as a list, with each item on a new line, wrapped in <${this.key}> tags.`;
  }
}

// Export the class directly instead of as default
export { LineOutputParser as default };
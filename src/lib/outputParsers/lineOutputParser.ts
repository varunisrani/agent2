import { BaseOutputParser } from "langchain/schema/output_parser";

interface LineOutputParserArgs {
  key?: string;
}

export class LineOutputParser extends BaseOutputParser<string> {
  private key = 'questions';

  constructor(args?: LineOutputParserArgs) {
    super();
    this.key = args.key ?? this.key;
  }

  static lc_name() {
    return 'LineOutputParser';
  }

  lc_namespace = ['langchain', 'output_parsers', 'line_output_parser'];

  async parse(text: string): Promise<string> {
    return text.trim();
  }

  getFormatInstructions(): string {
    return "Return your response as a single line of text.";
  }
}

// Export the class directly instead of as default
export { LineOutputParser as default };
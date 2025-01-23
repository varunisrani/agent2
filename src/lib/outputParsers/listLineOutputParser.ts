import { BaseOutputParser } from "langchain/schema/output_parser";

export class ListLineOutputParser extends BaseOutputParser<string[]> {
  lc_namespace = ["local", "list_line"];

  static lc_name(): string {
    return "ListLineOutputParser";
  }

  async parse(text: string): Promise<string[]> {
    // Split by newlines and filter out empty lines
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }

  getFormatInstructions(): string {
    return "Return your response as a list, with each item on a new line.";
  }
}
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import pdfParse from 'pdf-parse';

class AIService {
  private anthropic: Anthropic | null = null;

  constructor() {
    // If key exists, use it. Otherwise, we mock.
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  async extractText(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    try {
      // Basic PDF parsing
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (e) {
      // Fallback for non-PDFs (assume txt)
      return dataBuffer.toString('utf-8');
    }
  }

  async generateInsights(text: string) {
    if (!this.anthropic) {
      console.log("⚠️ No API Key. Using Mock Response.");
      await new Promise(r => setTimeout(r, 1500)); // Fake latency
      return {
        summary: "This is a mock summary. The AI processed the file successfully.",
        markdown: "# Mock Markdown\n\nThis content was generated without an API key."
      };
    }

    try {
      const msg = await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Return JSON only: { "summary": "...", "markdown": "..." } based on:\n\n${text.substring(0, 5000)}`
        }]
      });

      // @ts-ignore - Anthropic types are sometimes strict about content array
      const content = msg.content[0].text;
      return JSON.parse(content);
    } catch (error) {
      console.error("AI Error", error);
      return { summary: "AI Processing Failed", markdown: "" };
    }
  }
}

export const aiService = new AIService();
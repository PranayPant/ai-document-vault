import {GoogleGenAI} from '@google/genai';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { z } from "zod";

const summarySchema = z.strictObject({
  summary: z.string().min(50).max(1000).describe("A concise summary of the document's key points."),
  markdown: z.string().describe("Detailed insights in markdown format, including headings and bullet points.")
});

class AIService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    // If key exists, use it. Otherwise, we mock.
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({ apiKey: process.env.ANTHROPIC_API_KEY });
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
    if (!this.ai) {
      console.log("⚠️ No API Key. Using Mock Response.");
      await new Promise(r => setTimeout(r, 1500)); // Fake latency
      return {
        summary: "This is a mock summary. The AI processed the file successfully.",
        markdown: "# Mock Markdown\n\nThis content was generated without an API key."
      };
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
        You are an expert document analyst. Given the following document text, provide the below two things:
          1. A concise summary of the document.
          2. A markdown version of the document that cleans up the structure and formatting.

        Document Text:
        """
        ${text}
        """

        Please respond in JSON format with the following structure:
        {
          "summary": "A concise summary of the document.",
          "markdown": "A markdown version of the document that cleans up the structure and formatting."
        }
        `,
        config: {
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(summarySchema)
        },
      });

      if(!response.text) {
        throw new Error('No text in response'); 
      }

      const match = summarySchema.parse(JSON.parse(response.text));
      return match;
    } catch (error) {
      console.error("AI Error", error);
      throw new Error("Failed to generate AI insights");
    }
  }
}

export const aiService = new AIService();
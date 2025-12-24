import {GoogleGenAI} from '@google/genai';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { z } from "zod";
import { logger } from './logging/LoggingService.js';
import { AIServiceError, FileSystemError, ValidationError } from '../shared/errors.js';

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
      logger.info('AI Service initialized with API key');
    } else {
      logger.warn('AI Service running in mock mode - no API key configured');
    }
  }

  async extractText(filePath: string): Promise<string> {
    try {
      if (!filePath) {
        throw new ValidationError('File path is required');
      }

      logger.debug('Extracting text from file', { filePath });

      if (!fs.existsSync(filePath)) {
        logger.error('File not found during text extraction', { filePath });
        throw new FileSystemError('File not found');
      }

      const dataBuffer = fs.readFileSync(filePath);
      
      try {
        // Basic PDF parsing
        const data = await pdfParse(dataBuffer);
        logger.info('Text extracted from PDF', { 
          filePath, 
          textLength: data.text.length,
          pages: data.numpages
        });
        return data.text;
      } catch (e) {
        // Fallback for non-PDFs (assume txt)
        logger.debug('PDF parsing failed, treating as text file', { filePath });
        const text = dataBuffer.toString('utf-8');
        logger.info('Text extracted from file', { 
          filePath, 
          textLength: text.length 
        });
        return text;
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof FileSystemError) {
        throw error;
      }
      logger.error('Failed to extract text from file', { 
        filePath, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new FileSystemError('Failed to read file');
    }
  }

  async generateInsights(text: string) {
    try {
      if (!text || text.trim().length === 0) {
        throw new ValidationError('Text content is required for analysis');
      }

      if (!this.ai) {
        logger.info('Using mock AI response (no API key)');
        await new Promise(r => setTimeout(r, 1500)); // Fake latency
        return {
          summary: "This is a mock summary. The AI processed the file successfully.",
          markdown: "# Mock Markdown\n\nThis content was generated without an API key."
        };
      }

      logger.info('Generating AI insights', { 
        textLength: text.length,
        model: 'gemini-2.5-flash'
      });

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
        logger.error('AI API returned empty response');
        throw new AIServiceError('AI API returned empty response');
      }

      logger.debug('Parsing AI response', { responseLength: response.text.length });

      const match = summarySchema.parse(JSON.parse(response.text));
      
      logger.info('AI insights generated successfully', { 
        summaryLength: match.summary.length,
        markdownLength: match.markdown.length
      });

      return match;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AIServiceError) {
        throw error;
      }
      
      if (error instanceof z.ZodError) {
        logger.error('AI response validation failed', { 
          issues: error.issues 
        });
        throw new AIServiceError('AI response format validation failed');
      }

      logger.error('Failed to generate AI insights', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new AIServiceError('Failed to generate AI insights');
    }
  }
}

export const aiService = new AIService();
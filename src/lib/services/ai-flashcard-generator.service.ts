import type { GeneratedFlashcardDTO } from "../../types";
import { GeminiClient } from "../utils/gemini-client";

export class AiFlashcardGeneratorService {
  private geminiClient: GeminiClient;

  constructor() {
    this.geminiClient = new GeminiClient();
  }

  /**
   * Generate flashcards from text using AI
   * @param text - The source text to generate flashcards from
   * @param language - The language code (ISO 639-1)
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Array of generated flashcard drafts
   * @throws {GeminiApiError} If AI generation fails after all retries
   */
  async generate(text: string, language = "en", maxRetries = 3): Promise<GeneratedFlashcardDTO[]> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prompt = this.buildPrompt(text, language);

        const responseText = await this.geminiClient.generate({
          prompt,
          temperature: 0.7,
          maxOutputTokens: 2048,
        });

        return this.parseFlashcards(responseText);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // eslint-disable-next-line no-console
        console.warn(`AI generation attempt ${attempt}/${maxRetries} failed:`, lastError.message);

        // If not the last attempt, continue to retry
        if (attempt < maxRetries) {
          // Optional: add exponential backoff delay
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
          continue;
        }
      }
    }

    // All retries failed
    throw lastError || new Error("Failed to generate flashcards after multiple attempts");
  }

  /**
   * Build the prompt for Gemini API
   * @param text - The source text
   * @param language - The language code
   * @returns The formatted prompt
   */
  private buildPrompt(text: string, language: string): string {
    return `You are a flashcard generator. Analyze the following text and create high-quality flashcards for learning.

Instructions:
- Create clear, concise question-answer pairs
- Focus on key concepts, facts, and important details
- Front: Ask a specific, focused question
- Back: Provide a clear, complete answer
- Generate 2-5 flashcards depending on content complexity
- Questions should test understanding, not just memory

Input language: ${language}
Text to analyze:
"""
${text}
"""

Return ONLY a valid JSON array of objects with "front" and "back" properties.
Example format:
[
  {"front": "Question here?", "back": "Answer here"},
  {"front": "Another question?", "back": "Another answer"}
]`;
  }

  /**
   * Parse flashcards from AI response
   * @param responseText - The raw response from Gemini
   * @returns Array of parsed flashcards
   * @throws {Error} If parsing fails
   */
  private parseFlashcards(responseText: string): GeneratedFlashcardDTO[] {
    try {
      // Try to extract JSON from markdown code block if present
      let jsonText = responseText.trim();

      // Remove markdown code block markers if present
      const codeBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        jsonText = codeBlockMatch[1].trim();
      }

      // Fix common JSON errors from AI
      // Remove trailing commas before closing brackets/braces
      jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1");

      const flashcards = JSON.parse(jsonText);

      if (!Array.isArray(flashcards)) {
        throw new Error("Response is not an array");
      }

      // Validate flashcard structure
      const validatedFlashcards = flashcards.filter((card) => {
        return (
          card &&
          typeof card === "object" &&
          typeof card.front === "string" &&
          typeof card.back === "string" &&
          card.front.trim().length > 0 &&
          card.back.trim().length > 0
        );
      });

      if (validatedFlashcards.length === 0) {
        throw new Error("No valid flashcards found in response");
      }

      return validatedFlashcards.map((card) => ({
        front: card.front.trim(),
        back: card.back.trim(),
      }));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to parse AI response:", responseText, error);
      throw new Error(
        `Failed to parse flashcards from AI response: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

export const aiFlashcardGenerator = new AiFlashcardGeneratorService();

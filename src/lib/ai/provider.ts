import { generateBookWithModels } from "./hybrid-generator";
import type { GenerateBookInput, GeneratedBook } from "./types";

export interface BookGenerator {
  generateBook(input: GenerateBookInput): Promise<GeneratedBook>;
}

export const bookGenerator: BookGenerator = {
  generateBook: generateBookWithModels,
};

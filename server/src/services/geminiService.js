import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import { ApiError } from '../utils/apiResponse.js';

let aiClient = null;

/**
 * Get or initialize the GoogleGenAI instance.
 */
const getAIClient = () => {
  if (!aiClient) {
    if (!env.GEMINI_API_KEY) {
      throw new ApiError(
        'GEMINI_API_KEY is not configured on the server. AI features are unavailable.',
        503
      );
    }
    aiClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return aiClient;
};

/**
 * Generate multiple-choice quiz questions for a video using Google Gemini API.
 *
 * @param {string} videoTitle - Title of the video/lesson
 * @param {string} videoDescription - Description or summary of the video
 * @param {number} [count=5] - Number of questions to generate (1 to 10)
 * @returns {Promise<Array<{question: string, options: string[], correctAnswer: number, explanation: string}>>}
 */
export const generateQuizQuestions = async (
  videoTitle,
  videoDescription = '',
  count = 5
) => {
  const ai = getAIClient();

  const safeCount = Math.min(Math.max(Number(count) || 5, 1), 10);
  const truncatedDesc = (videoDescription || '').slice(0, 1500);

  const prompt = `You are an expert educational curriculum designer and instructor.
Create a high-quality ${safeCount}-question multiple-choice quiz to test student comprehension of this educational lesson.

Lesson Details:
- Title: ${videoTitle}
- Overview / Transcript Snippet: ${truncatedDesc || 'Educational video lesson'}

Requirements:
1. Generate exactly ${safeCount} questions.
2. Each question must test understanding, key concepts, or practical application from the lesson topic.
3. Provide exactly 4 distinct options per question.
4. Set "correctAnswer" to the 0-indexed number of the correct option (0, 1, 2, or 3).
5. Provide a clear, educational "explanation" of 1-3 sentences explaining why the correct answer is right and why it matters.
6. Return ONLY a valid JSON array matching this exact schema:

[
  {
    "question": "Clear and concise question text",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correctAnswer": 0,
    "explanation": "Why this option is correct."
  }
]`;

  const modelsToTry = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
  let rawText = '';
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      rawText = response.text;
      if (rawText) break;
    } catch (err) {
      lastError = err;
      console.warn(`[GeminiService] Failed with model ${model}:`, err.message || err);
      // Continue to try fallback model if available
    }
  }

  if (!rawText) {
    throw new ApiError(
      `Failed to generate quiz with AI: ${lastError?.message || 'Empty response from Gemini'}`,
      502
    );
  }

  // Parse and validate JSON
  let parsed;
  try {
    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[GeminiService] Failed to parse JSON response:', rawText);
    throw new ApiError('AI generated an invalid response format. Please try again.', 502);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new ApiError('AI did not return a valid list of questions. Please try again.', 502);
  }

  // Validate and sanitize each question
  const validatedQuestions = parsed
    .slice(0, safeCount)
    .map((item, idx) => {
      const question = typeof item.question === 'string' ? item.question.trim() : '';
      const options = Array.isArray(item.options)
        ? item.options.map((opt) => String(opt || '').trim()).filter(Boolean)
        : [];
      let correctAnswer = Number(item.correctAnswer);
      const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : '';

      if (!question) {
        throw new Error(`Question ${idx + 1} has no text.`);
      }

      if (options.length !== 4) {
        throw new Error(`Question ${idx + 1} must have exactly 4 options (found ${options.length}).`);
      }

      if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
        correctAnswer = 0;
      }

      return {
        question,
        options,
        correctAnswer,
        explanation: explanation || 'Correct answer based on the lesson content.',
      };
    });

  return validatedQuestions;
};

export default {
  generateQuizQuestions,
};

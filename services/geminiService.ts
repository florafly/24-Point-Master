import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIResponse } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelName = 'gemini-2.5-flash';

// Schema for structured output
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    solution: {
      type: Type.STRING,
      description: "A mathematical expression using the provided numbers that equals 24. e.g. '(8-4)*(3+3)'. Return null if impossible.",
    },
    hint: {
      type: Type.STRING,
      description: "A helpful hint for a child, e.g., 'Try to make a 3 and an 8 first'.",
    },
    explanation: {
      type: Type.STRING,
      description: "A friendly, step-by-step explanation for a child.",
    }
  },
  required: ["hint", "explanation"],
};

export const getGeminiAssistance = async (numbers: number[], type: 'hint' | 'solve'): Promise<AIResponse> => {
  if (!apiKey) {
    return { error: "API Key is missing." };
  }

  const prompt = type === 'solve' 
    ? `Find a solution for the 24 game using these numbers: ${numbers.join(', ')}. Provide the exact equation and a friendly explanation.`
    : `Give a hint for the 24 game using these numbers: ${numbers.join(', ')}. Do not give the full answer yet, just a nudge in the right direction.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a friendly, encouraging math tutor for children playing the '24 Game'. Your goal is to help them improve their mental math. Keep explanations simple and fun."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text);
    return {
      solution: json.solution,
      hint: json.hint,
      explanation: json.explanation
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return { error: "Thinking..." };
  }
};

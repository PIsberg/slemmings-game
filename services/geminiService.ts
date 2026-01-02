
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSlimeLordAdvice(levelName: string, gameState: any) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Slime Lord, a helpful but slimy master of the Slemmings. 
      The player is playing level "${levelName}". 
      Current stats: Released ${gameState.released}, Saved ${gameState.saved}, Dead ${gameState.dead}.
      Provide a short, 1-sentence cryptic hint in your slimy persona to help them. 
      Use words like 'squish', 'goop', 'ooze'.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini advice error:", error);
    return "The goop must flow, little squishling...";
  }
}

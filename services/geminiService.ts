import { GoogleGenAI, Type } from "@google/genai";
import { GridData } from '../types';

export const generatePixelArtFromPrompt = async (
  prompt: string, 
  size: number
): Promise<GridData | null> => {
  try {
    if (!process.env.API_KEY) {
      console.warn("API Key is missing.");
      return null;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We ask for a flattened array of hex strings or a simple 2D structure.
    // However, the Schema definitions in the new SDK are strict.
    // Let's ask for an object containing the flat list of colors and dimensions to reconstruct,
    // or a 2D array structure directly if supported. Array of Arrays is supported.

    const modelId = "gemini-2.5-flash"; // Efficient for this task

    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Generate a pixel art representation of: "${prompt}". 
      The grid size is ${size}x${size}. 
      Return a JSON object with a property 'grid' which is a 2D array (array of rows, where each row is an array of hex color strings). 
      Use valid 6-character hex codes (e.g., #FF0000). Use 'transparent' for empty space.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            grid: {
              type: Type.ARRAY,
              description: `A ${size}x${size} grid of colors.`,
              items: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                    description: "Hex color code or 'transparent'"
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text);
    
    // Validate dimensions loosely
    if (data.grid && Array.isArray(data.grid)) {
      // Ensure it matches requested size (truncate or pad if AI messed up, though schema helps)
      const rawGrid: string[][] = data.grid;
      const cleanGrid: GridData = [];

      for(let i=0; i<size; i++) {
        const row: string[] = [];
        for(let j=0; j<size; j++) {
            const val = rawGrid[i]?.[j] || 'transparent';
            row.push(val);
        }
        cleanGrid.push(row);
      }
      return cleanGrid;
    }

    return null;
  } catch (error) {
    console.error("Error generating pixel art:", error);
    throw error;
  }
};

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ParsedQualification {
  courseName: string;
  issuer: string;
  level?: string;
  issueDate: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  neverExpires: boolean;
}

export async function parseCertificate(
  base64Data: string,
  mimeType: string
): Promise<ParsedQualification> {
  const prompt = `You are a certificate parsing assistant. Extract the qualification details from this document. 
Return only structured JSON matching the requested schema. If dates are unclear, provide your best estimate in YYYY-MM-DD format.`;

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courseName: { type: Type.STRING },
          issuer: { type: Type.STRING },
          level: { type: Type.STRING },
          issueDate: { type: Type.STRING },
          expiryDate: { type: Type.STRING },
          neverExpires: { type: Type.BOOLEAN },
        },
        required: ["courseName", "issuer", "issueDate", "neverExpires"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to parse document with Gemini");
  }

  return JSON.parse(response.text) as ParsedQualification;
}

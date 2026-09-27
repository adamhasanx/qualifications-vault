import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          courseName: { type: SchemaType.STRING },
          issuer: { type: SchemaType.STRING },
          level: { type: SchemaType.STRING },
          issueDate: { type: SchemaType.STRING },
          expiryDate: { type: SchemaType.STRING },
          neverExpires: { type: SchemaType.BOOLEAN },
        },
        required: ["courseName", "issuer", "issueDate", "neverExpires"],
      },
    },
  });

  const prompt = `You are an expert certificate parser. Extract qualification details from this document.
Format all dates strictly as YYYY-MM-DD. Set neverExpires to true if there is no expiration date.`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: base64Data,
        mimeType: mimeType,
      },
    },
  ]);

  const responseText = result.response.text();
  if (!responseText) {
    throw new Error("Empty response from Gemini parser");
  }

  return JSON.parse(responseText) as ParsedQualification;
}

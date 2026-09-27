import Anthropic from "@anthropic-ai/sdk";

export type ParsedCertificate = {
  courseName: string | null;
  issuer: string | null;
  level: string | null;
  issueDate: string | null; // ISO yyyy-mm-dd
  expiryDate: string | null; // ISO yyyy-mm-dd
  neverExpires: boolean;
  confidence: "high" | "medium" | "low";
};

const SYSTEM_PROMPT = `You read certificate and qualification documents (images or PDFs) and extract structured data.
Respond with ONLY a JSON object, no prose, no markdown fences, matching exactly this shape:
{
  "courseName": string | null,
  "issuer": string | null,
  "level": string | null,
  "issueDate": string | null,
  "expiryDate": string | null,
  "neverExpires": boolean,
  "confidence": "high" | "medium" | "low"
}
Rules:
- Dates must be ISO format YYYY-MM-DD. If only a month/year is given, use the 1st of that month.
- "level" is the qualification level/grade if the certificate states one (e.g. "Level 2", "Advanced", "Pass"), else null.
- Set "neverExpires" to true only if the certificate explicitly states it does not expire, or is a type of certificate that is commonly lifetime (e.g. a degree). Otherwise false.
- If "neverExpires" is true, "expiryDate" should be null.
- If a field truly cannot be determined, use null rather than guessing.
- "confidence" reflects how legible/certain the extraction was overall.`;

export async function parseCertificate(params: {
  base64: string;
  mediaType: string; // e.g. image/png, image/jpeg, application/pdf
}): Promise<ParsedCertificate> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }
  const anthropic = new Anthropic({ apiKey });

  const isPdf = params.mediaType === "application/pdf";

  const content: Anthropic.MessageParam["content"] = [
    isPdf
      ? {
          type: "document",
          source: { type: "base64", media_type: "application/pdf", data: params.base64 },
        }
      : {
          type: "image",
          source: { type: "base64", media_type: params.mediaType as "image/png" | "image/jpeg", data: params.base64 },
        },
    {
      type: "text",
      text: "Extract the qualification details from this certificate.",
    },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("AI parsing returned no text.");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(cleaned) as ParsedCertificate;
  } catch {
    return {
      courseName: null,
      issuer: null,
      level: null,
      issueDate: null,
      expiryDate: null,
      neverExpires: false,
      confidence: "low",
    };
  }
}

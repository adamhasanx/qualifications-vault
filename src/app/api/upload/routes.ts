import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseCertificate } from "@/lib/ai-parse";
import { v4 as uuid } from "uuid";
import { uploadToWebdav, remotePathFor } from "@/lib/webdav";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only PNG, JPEG or PDF files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 15MB." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Save to the WebDAV server. This path is stored in the DB but is never
  // handed to the browser directly — /api/files/[id] fetches it on demand.
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const filename = `${uuid()}.${ext}`;
  const fileUrl = remotePathFor(userId, filename);
  try {
    await uploadToWebdav(fileUrl, buffer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not reach the WebDAV server.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  let parsed = null;
  let parseError: string | null = null;
  try {
    parsed = await parseCertificate({
      base64: buffer.toString("base64"),
      mediaType: file.type,
    });
  } catch (err) {
    parseError = err instanceof Error ? err.message : "AI parsing failed.";
  }

  return NextResponse.json({ fileUrl, fileType: file.type, parsed, parseError });
}

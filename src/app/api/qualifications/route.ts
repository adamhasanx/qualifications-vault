import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const qualifications = await prisma.qualification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ qualifications });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json();
  const { courseName, issuer, level, issueDate, expiryDate, neverExpires, fileUrl, fileType } = body;

  if (!courseName || !issuer || !issueDate || !fileUrl || !fileType) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const qualification = await prisma.qualification.create({
    data: {
      userId,
      courseName,
      issuer,
      level: level || null,
      issueDate: new Date(issueDate),
      expiryDate: neverExpires || !expiryDate ? null : new Date(expiryDate),
      neverExpires: !!neverExpires,
      fileUrl,
      fileType,
    },
  });
  return NextResponse.json({ qualification }, { status: 201 });
}

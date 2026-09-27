import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromWebdav } from "@/lib/webdav";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const existing = await prisma.qualification.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const body = await req.json();
  const { courseName, issuer, level, issueDate, expiryDate, neverExpires } = body;

  const qualification = await prisma.qualification.update({
    where: { id: params.id },
    data: {
      ...(courseName !== undefined && { courseName }),
      ...(issuer !== undefined && { issuer }),
      ...(level !== undefined && { level: level || null }),
      ...(issueDate !== undefined && { issueDate: new Date(issueDate) }),
      ...(neverExpires !== undefined && { neverExpires: !!neverExpires }),
      expiryDate: neverExpires ? null : expiryDate ? new Date(expiryDate) : existing.expiryDate,
    },
  });
  return NextResponse.json({ qualification });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const existing = await prisma.qualification.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  await prisma.qualification.delete({ where: { id: params.id } });
  await deleteFromWebdav(existing.fileUrl);
  return NextResponse.json({ ok: true });
}

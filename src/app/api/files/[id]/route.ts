import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadFromWebdav } from "@/lib/webdav";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const qualification = await prisma.qualification.findUnique({ where: { id: params.id } });
  if (!qualification || qualification.userId !== userId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const buffer = await downloadFromWebdav(qualification.fileUrl);
    return new NextResponse(new Uint8Array(buffer), {
    headers: {
        "Content-Type": qualification.fileType,
        "Cache-Control": "private, max-age=0, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't fetch this file from storage." }, { status: 502 });
  }
}

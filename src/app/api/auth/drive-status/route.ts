import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ hasDriveAccess: false });
    }

    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    });

    if (!account || !account.scope) {
      return NextResponse.json({ hasDriveAccess: false });
    }

    const hasDriveAccess = account.scope.includes("https://www.googleapis.com/auth/drive.file");
    return NextResponse.json({ hasDriveAccess });
  } catch (error) {
    console.error("[drive-status] Error checking drive status:", error);
    return NextResponse.json({ hasDriveAccess: false });
  }
}

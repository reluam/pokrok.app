import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminReq } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

// Klientský upload do Vercel Blobu (obchází 4,5MB limit serverless funkcí).
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!isAdminReq(request)) throw new Error("Unauthorized");
        return {
          allowedContentTypes: [
            "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/aac", "audio/flac",
            "image/png", "image/jpeg", "image/webp", "image/gif",
          ],
          addRandomSuffix: true,
          maximumSizeInBytes: 50 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => { /* no-op */ },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

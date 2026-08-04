import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/auth";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function sanitizeExt(original: string): string {
  const ext = original.split(".").pop()?.toLowerCase();
  if (ext && ["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return ext;
  return "bin";
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results: { url: string; filename: string }[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid type for "${file.name}". Use PNG, JPEG, WebP, or GIF.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" too large. Max 5MB.` },
          { status: 400 }
        );
      }

      const ext = sanitizeExt(file.name);
      const filename = `${nanoid(12)}.${ext}`;
      // Path di blob storage: wt-market/uploads/<filename>
      const blobPath = `uploads/${filename}`;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploaded = await put(blobPath, buffer, {
        access: "public",
        contentType: file.type,
        addRandomSuffix: false,
      });

      results.push({ url: uploaded.url, filename });
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

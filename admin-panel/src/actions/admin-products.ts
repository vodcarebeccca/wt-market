"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const productSchema = z.object({
  titleId: z.string().min(2),
  titleEn: z.string().min(2),
  descId: z.string().min(2),
  descEn: z.string().min(2),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  category: z.string().min(1),
  nation: z.string().optional(),
  priceIdr: z.coerce.number().int().positive(),
  minLevel: z.coerce.number().int().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  maxLevel: z.coerce.number().int().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  minRank: z.coerce.number().int().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  maxRank: z.coerce.number().int().optional().or(z.nan()).transform((v) => (Number.isNaN(v) ? undefined : v)),
  isActive: z.coerce.boolean().optional(),
});

type ImageEntry = {
  url: string;
  filename: string;
};

function parseImageEntries(raw: unknown): ImageEntry[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(String(raw));
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is ImageEntry =>
        typeof x === "object" && x !== null && typeof x.url === "string" && typeof x.filename === "string"
    );
  } catch {
    return [];
  }
}

function formToObject(formData: FormData) {
  return {
    titleId: String(formData.get("titleId") || ""),
    titleEn: String(formData.get("titleEn") || ""),
    descId: String(formData.get("descId") || ""),
    descEn: String(formData.get("descEn") || ""),
    slug: String(formData.get("slug") || "").toLowerCase(),
    category: String(formData.get("category") || ""),
    nation: String(formData.get("nation") || "ANY") || "ANY",
    priceIdr: formData.get("priceIdr"),
    minLevel: formData.get("minLevel") || undefined,
    maxLevel: formData.get("maxLevel") || undefined,
    minRank: formData.get("minRank") || undefined,
    maxRank: formData.get("maxRank") || undefined,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    imageUrls: formData.get("imageUrls"),
  };
}

async function upsertProductImages(productId: string, images: ImageEntry[]) {
  if (images.length === 0) return;

  // Hapus gambar lama, buat baru sesuai urutan
  await prisma.productImage.deleteMany({ where: { productId } });

  const coverUrl = images[0]?.url;

  await prisma.$transaction([
    prisma.productImage.createMany({
      data: images.map((img, i) => ({
        productId,
        url: img.url,
        sortOrder: i,
      })),
    }),
    prisma.product.update({
      where: { id: productId },
      data: { imageUrl: coverUrl },
    }),
  ]);
}

export async function createProductAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const obj = formToObject(formData);
  const parsed = productSchema.safeParse(obj);
  if (!parsed.success) {
    redirect("/products/new?error=1");
  }

  const images = parseImageEntries(obj.imageUrls);

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      nation: parsed.data.nation || "ANY",
      isActive: parsed.data.isActive ?? true,
      imageUrl: images[0]?.url ?? null,
    },
  });

  await upsertProductImages(product.id, images);

  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  const obj = formToObject(formData);
  const parsed = productSchema.safeParse(obj);
  if (!parsed.success) {
    redirect(`/products/${productId}?error=1`);
  }

  const images = parseImageEntries(obj.imageUrls);
  const data: Record<string, unknown> = {
    ...parsed.data,
    nation: parsed.data.nation || "ANY",
    isActive: parsed.data.isActive ?? true,
  };
  if (images.length > 0) {
    data.imageUrl = images[0].url;
  }

  await prisma.product.update({ where: { id: productId }, data });
  await upsertProductImages(productId, images);

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  redirect(`/products/${productId}?saved=1`);
}

export async function deleteProductAction(productId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/login");

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/products");
  redirect("/products");
}

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
  };
}

export async function createProductAction(formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    redirect("/admin/products/new?error=1");
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      nation: parsed.data.nation || "ANY",
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/id/catalog");
  revalidatePath("/en/catalog");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProductAction(productId: string, formData: FormData) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  const parsed = productSchema.safeParse(formToObject(formData));
  if (!parsed.success) {
    redirect(`/admin/products/${productId}?error=1`);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      ...parsed.data,
      nation: parsed.data.nation || "ANY",
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/id/catalog");
  revalidatePath("/en/catalog");
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function deleteProductAction(productId: string) {
  const session = await requireAdmin();
  if (!session) redirect("/admin/login");

  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

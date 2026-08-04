"use client";

import { useState } from "react";
import { ProductImage } from "@prisma/client";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
        <img
          src={images[0].url}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
        <img
          src={images[active]?.url}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setActive(i)}
            className={`relative flex-shrink-0 rounded-md border-2 overflow-hidden transition-colors duration-150 ${
              active === i
                ? "border-accent"
                : "border-transparent hover:border-border"
            }`}
            style={{ width: 72, height: 72 }}
          >
            <img
              src={img.url}
              alt={`Gambar ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

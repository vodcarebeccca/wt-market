"use client";

import { useCallback, useRef, useState } from "react";

export type ImageEntry = {
  url: string;
  filename: string;
};

type Props = {
  existing?: ImageEntry[];
  onImagesChange: (images: ImageEntry[]) => void;
};

export function ProductImageUploader({ existing = [], onImagesChange }: Props) {
  const [images, setImages] = useState<ImageEntry[]>([...existing]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const notify = useCallback(
    (next: ImageEntry[]) => {
      setImages(next);
      onImagesChange(next);
    },
    [onImagesChange]
  );

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError(null);

      const fd = new FormData();
      for (const f of Array.from(files)) {
        fd.append("files", f);
      }

      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error || "Upload failed");
        }
        const data = (await res.json()) as { files: ImageEntry[] };
        notify([...images, ...data.files]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [images, notify]
  );

  const removeImage = useCallback(
    (index: number) => {
      const next = images.filter((_, i) => i !== index);
      notify(next);
    },
    [images, notify]
  );

  const moveImage = useCallback(
    (index: number, dir: "left" | "right") => {
      const target = dir === "left" ? index - 1 : index + 1;
      if (target < 0 || target >= images.length) return;
      const next = [...images];
      [next[index], next[target]] = [next[target], next[index]];
      notify(next);
    },
    [images, notify]
  );

  const setCover = useCallback(
    (index: number) => {
      if (index === 0) return;
      const next = [...images];
      const [moved] = next.splice(index, 1);
      next.unshift(moved);
      notify(next);
    },
    [images, notify]
  );

  return (
    <div className="space-y-3">
      <div>
        <span className="block text-sm text-muted">Gambar produk</span>
        <p className="text-xs text-muted">
          Gambar pertama adalah gambar utama. Bisa upload lebih dari satu.
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((img, index) => (
            <div
              key={img.url + index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-border"
            >
              <img
                src={img.url}
                alt={`Produk gambar ${index + 1}`}
                className="h-full w-full object-cover"
              />

              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => moveImage(index, "left")}
                  disabled={index === 0}
                  title="Geser kiri"
                  className="text-white px-2 py-1 rounded disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setCover(index)}
                  disabled={index === 0}
                  title="Jadikan gambar utama"
                  className="text-white text-xs px-2 py-1 rounded disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  Utama
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, "right")}
                  disabled={index === images.length - 1}
                  title="Geser kanan"
                  className="text-white px-2 py-1 rounded disabled:opacity-30 hover:bg-white/20 transition-colors"
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  title="Hapus"
                  className="text-white px-2 py-1 rounded hover:bg-white/20 transition-colors"
                >
                  ×
                </button>
              </div>

              {index === 0 && (
                <span className="absolute top-1 left-1 bg-accent text-black text-[10px] font-semibold px-2 py-0.5 rounded">
                  Utama
                </span>
              )}
            </div>
          ))}

          {/* Drop zone */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFiles(e.dataTransfer.files);
            }}
            className="aspect-square rounded-lg border-2 border-dashed border-border/60 flex items-center justify-center cursor-pointer hover:border-accent/60 transition-colors duration-150"
          >
            <div className="text-center text-muted text-sm">
              <span className="block text-2xl mb-1">+</span>
              Tambah
            </div>
          </label>
        </div>
      )}

      {images.length === 0 && (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleFiles(e.dataTransfer.files);
          }}
          className="w-full rounded-lg border-2 border-dashed border-border/60 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent/60 transition-colors duration-150"
        >
          <span className="text-3xl mb-2">📷</span>
          <span className="text-sm text-muted text-center">
            Klik atau tarik gambar ke sini
            <br />
            PNG, JPEG, WebP, GIF — max 5MB
          </span>
        </label>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn btn-ghost btn-sm"
        >
          Pilih file
        </button>
        {uploading && (
          <span className="text-xs text-muted animate-pulse">Mengupload…</span>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Hidden input untuk kirim ke server action */}
      <input type="hidden" name="imageUrls" value={JSON.stringify(images)} />
    </div>
  );
}

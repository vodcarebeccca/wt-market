"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { formatPricePair } from "@/lib/money";
import { uploadPaymentProof } from "@/actions/payment-proof";

type Props = {
  qrisString: string;
  amountIdr: number;
  orderCode: string;
  accessToken: string;
  locale: string;
  labels: {
    qrisTitle: string;
    qrisInstruction: string;
    uploadProof: string;
    iHavePaid: string;
    proofUploaded: string;
    uploading: string;
    uploadError: string;
  };
};

export function QrisDisplay({
  qrisString,
  amountIdr,
  orderCode,
  accessToken,
  labels,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const price = formatPricePair(amountIdr);

  useEffect(() => {
    if (!canvasRef.current || !qrisString) return;
    QRCode.toCanvas(canvasRef.current, qrisString, {
      width: 280,
      margin: 2,
      color: { dark: "#000000", light: "#FFFFFF" },
    });
  }, [qrisString]);

  async function handleUpload() {
    if (!proofFile) return;
    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", proofFile);
      formData.append("orderCode", orderCode);
      formData.append("accessToken", accessToken);

      const result = await uploadPaymentProof(formData);

      if (!result.ok) {
        setUploadError(result.error || labels.uploadError);
        setUploading(false);
        return;
      }

      setUploaded(true);
    } catch {
      setUploadError(labels.uploadError);
    } finally {
      setUploading(false);
    }
  }

  if (!qrisString) {
    return (
      <div className="rounded-xl border border-border bg-black/30 p-4 text-sm text-amber-300">
        QRIS tidak tersedia. Hubungi admin untuk pembayaran.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-black/30 p-5">
        <h3 className="mb-3 text-sm font-semibold">{labels.qrisTitle}</h3>

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-xl bg-white p-3">
            <canvas ref={canvasRef} />
          </div>

          <p className="text-xl font-bold text-accent">{price.idr}</p>
          <p className="text-xs text-muted">≈ {price.usd}</p>
        </div>

        <p className="mt-3 text-center text-xs text-muted">
          {labels.qrisInstruction}
        </p>
      </div>

      {/* Upload bukti bayar */}
      <div className="rounded-xl border border-border bg-black/30 p-4">
        {uploaded ? (
          <p className="text-sm text-green-400">{labels.proofUploaded}</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">{labels.iHavePaid}</p>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent/20 file:px-3 file:py-1.5 file:text-sm file:text-accent"
            />
            {uploadError && (
              <p className="text-xs text-danger">{uploadError}</p>
            )}
            <button
              type="button"
              onClick={handleUpload}
              disabled={!proofFile || uploading}
              className="btn btn-primary w-full text-sm"
            >
              {uploading ? labels.uploading : labels.uploadProof}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
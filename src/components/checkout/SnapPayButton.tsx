"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/routing";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

type Props = {
  snapToken: string;
  orderCode: string;
  accessToken: string;
  locale: string;
  label: string;
};

export function SnapPayButton({ snapToken, orderCode, accessToken, locale, label }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const orderPath = `/order/${orderCode}?token=${accessToken}`;

  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
    const snapUrl =
      process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
      "https://app.sandbox.midtrans.com/snap/snap.js";

    // Bail out early if the script is already loaded and ready
    if (window.snap) {
      setReady(true);
      return;
    }

    // Bail out if the script tag already exists (may still be loading)
    if (document.querySelector(`script[src="${snapUrl}"]`)) {
      // Wait for it to become available
      const checkReady = window.setInterval(() => {
        if (window.snap) {
          window.clearInterval(checkReady);
          setReady(true);
        }
      }, 100);
      // Fallback timeout — give it 10s max to load
      const fallback = window.setTimeout(() => {
        window.clearInterval(checkReady);
        if (window.snap) setReady(true);
      }, 10_000);
      return () => {
        window.clearInterval(checkReady);
        window.clearTimeout(fallback);
      };
    }

    const script = document.createElement("script");
    script.src = snapUrl;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);

  function pay() {
    if (!window.snap) {
      router.push(orderPath);
      return;
    }
    window.snap.pay(snapToken, {
      onSuccess: () => router.push(orderPath),
      onPending: () => router.push(orderPath),
      onError: () => router.push(orderPath),
      onClose: () => router.push(orderPath),
    });
  }

  return (
    <button type="button" className="btn btn-primary w-full" onClick={pay} disabled={!ready}>
      {ready ? label : `... (${locale})`}
    </button>
  );
}

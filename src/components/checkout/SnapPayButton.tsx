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

    if (document.querySelector(`script[src="${snapUrl}"]`)) {
      const timer = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timer);
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

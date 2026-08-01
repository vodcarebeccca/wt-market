"use client";

import { useSyncExternalStore } from "react";
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

let snapReady = false;
let snapListeners: Array<() => void> = [];

function subscribeSnap(cb: () => void) {
  snapListeners.push(cb);
  return () => {
    snapListeners = snapListeners.filter((l) => l !== cb);
  };
}

function loadSnapScript() {
  if (typeof window === "undefined") return;
  if (window.snap || snapReady) return;

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
  const snapUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_SNAP_URL ||
    "https://app.sandbox.midtrans.com/snap/snap.js";

  if (document.querySelector(`script[src="${snapUrl}"]`)) {
    const checkReady = setInterval(() => {
      if (window.snap) {
        clearInterval(checkReady);
        snapReady = true;
        snapListeners.forEach((l) => l());
      }
    }, 100);
    setTimeout(() => {
      clearInterval(checkReady);
      if (window.snap) {
        snapReady = true;
        snapListeners.forEach((l) => l());
      }
    }, 10_000);
    return;
  }

  const script = document.createElement("script");
  script.src = snapUrl;
  script.setAttribute("data-client-key", clientKey);
  script.onload = () => {
    snapReady = true;
    snapListeners.forEach((l) => l());
  };
  document.body.appendChild(script);
}

// Start loading immediately
loadSnapScript();

function useSnapReady() {
  return useSyncExternalStore(
    subscribeSnap,
    () => snapReady || (typeof window !== "undefined" && !!window.snap),
    () => false,
  );
}

export function SnapPayButton({ snapToken, orderCode, accessToken, locale, label }: Props) {
  const router = useRouter();
  const ready = useSnapReady();
  const orderPath = `/order/${orderCode}?token=${accessToken}`;

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
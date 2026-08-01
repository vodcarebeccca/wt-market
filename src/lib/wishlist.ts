"use client";

import { useState, useCallback, useSyncExternalStore } from "react";

type WishlistState = Record<string, boolean>;

const STORAGE_KEY = "wt-market-wishlist";

let listeners: Array<() => void> = [];

function subscribe(cb: () => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

function getSnapshot(): WishlistState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setWishlistState(next: WishlistState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

export function useWishlist() {
  // Keep a client-side state for reactivity
  const [state, setState] = useState<WishlistState>({});

  // Load on first mount
  const loaded = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  // Use getSnapshot-style loading
  const [initialized, setInitialized] = useState(false);

  if (!initialized && typeof window !== "undefined") {
    setState(getSnapshot());
    setInitialized(true);
  }

  const toggle = useCallback((productId: string) => {
    setState((prev) => {
      const next = { ...prev, [productId]: !prev[productId] };
      setWishlistState(next);
      return next;
    });
  }, []);

  const isWishlisted = useCallback((productId: string) => {
    return !!state[productId];
  }, [state]);

  return { wishlist: state, isWishlisted, toggle, loaded };
}
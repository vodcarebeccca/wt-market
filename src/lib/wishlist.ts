"use client";

import { useCallback, useState } from "react";

type WishlistState = Record<string, boolean>;

const STORAGE_KEY = "wt-market-wishlist";

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
    // ignore (e.g. storage quota / private mode)
  }
}

export function useWishlist() {
  const [state, setState] = useState<WishlistState>(getSnapshot);

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

  return { wishlist: state, isWishlisted, toggle };
}

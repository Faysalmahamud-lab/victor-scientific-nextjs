"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  quantity: number;
};

const STORAGE_KEY = "vsc-cart-v1";
const EMPTY_CART: CartItem[] = [];

let snapshot: CartItem[] = EMPTY_CART;
let hydrated = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  if (typeof window !== "undefined" && !hydrated) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];

      if (Array.isArray(parsed)) {
        snapshot = parsed.filter((item): item is CartItem => {
          return (
            item &&
            typeof item === "object" &&
            typeof item.productId === "string" &&
            typeof item.slug === "string" &&
            typeof item.name === "string" &&
            typeof item.image === "string" &&
            Number.isFinite(item.price) &&
            Number.isFinite(item.stock) &&
            Number.isFinite(item.quantity)
          );
        });
      }
    } catch {
      snapshot = EMPTY_CART;
    }

    hydrated = true;
  }

  return snapshot;
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(nextItems: CartItem[]) {
  snapshot = nextItems;
  hydrated = true;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    } catch {
      // The in-memory cart remains usable if browser storage is unavailable.
    }
  }

  notify();
}

export function addCartItem(item: Omit<CartItem, "quantity">, quantity = 1) {
  const current = getSnapshot();
  const existing = current.find((entry) => entry.productId === item.productId);

  if (existing) {
    commit(
      current.map((entry) =>
        entry.productId === item.productId
          ? {
              ...entry,
              quantity: Math.min(
                Math.max(1, entry.stock),
                entry.quantity + quantity
              ),
            }
          : entry
      )
    );
    return;
  }

  commit([
    ...current,
    {
      ...item,
      quantity: Math.min(Math.max(1, item.stock), Math.max(1, quantity)),
    },
  ]);
}

export function updateCartItemQuantity(productId: string, quantity: number) {
  const current = getSnapshot();
  const next = current.map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity: Math.min(
            Math.max(1, item.stock),
            Math.max(1, Math.floor(quantity))
          ),
        }
      : item
  );

  commit(next);
}

export function removeCartItem(productId: string) {
  commit(getSnapshot().filter((item) => item.productId !== productId));
}

export function clearCart() {
  commit(EMPTY_CART);
}

export function useCart() {
  const items = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  return {
    items,
    count,
    subtotal,
    addItem: addCartItem,
    updateQuantity: updateCartItemQuantity,
    removeItem: removeCartItem,
    clear: clearCart,
  };
}

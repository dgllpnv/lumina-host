import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:3003/api").replace(/\/api\/?$/, "");

// Fotos vêm do backend como caminho relativo ("/uploads/..."); precisa do
// origin da API (não do frontend) para carregar de verdade.
export function assetUrl(path: string) {
  if (!path) return path;
  return path.startsWith("http") ? path : `${API_ORIGIN}${path}`;
}

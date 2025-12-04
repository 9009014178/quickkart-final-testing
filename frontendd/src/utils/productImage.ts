// src/utils/productImage.ts
import { Product } from '@/services/productService';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export function getProductImageUrl(product: Product | any): string {
  const raw: string =
    product.image ||
    product.imageUrl ||
    (Array.isArray(product.images) ? product.images[0] : '');

  if (!raw) return '/placeholder-product.png';
  if (raw.startsWith('http')) return raw;

  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

// src/utils/image.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

type AnyWithImage = {
  image?: string;
  imageUrl?: string;
  images?: string[];
};

export function getImageUrl(obj: AnyWithImage | null | undefined): string {
  if (!obj) return '/placeholder-product.png';

  const raw =
    obj.image ||
    obj.imageUrl ||
    (Array.isArray(obj.images) ? obj.images[0] : '');

  if (!raw) return '/placeholder-product.png';
  if (raw.startsWith('http')) return raw;

  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

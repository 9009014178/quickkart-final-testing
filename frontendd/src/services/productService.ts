import api from "./api";

// ================== TYPES ==================

export interface Review {
  _id: string;
  user: string;
  comment: string;
  rating: number;
  createdAt: string;
}

export interface Product {
  _id: string;
  user: string;

  name: string;
  description: string;
  price: number;

  category: string;
  brand?: string;

  stock: number; // MAIN stock from backend
  isAvailable: boolean;

  image: string;
  imageUrl: string;
  imagePublicId: string;

  salePrice?: number;
  saleEndDate?: string;

  unavailablePincodes: string[];

  inventory?: { // optional, har store ka stock
    store: string;
    stock: number;
  }[];

  reviews: Review[];
  rating: number;
  numReviews: number;

  createdAt?: string;
  updatedAt?: string;
}

// ================== FILTERS ==================

export interface ProductFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

// ================== API FUNCTIONS ==================

/** Get public products (filters allowed) */
async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  try {
    const { data } = await api.get("/api/products", { params: filters });
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error("Failed to fetch products:", msg);
    return [];
  }
}

/** Get single product detail */
async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error(`Failed to fetch product ${id}:`, msg);
    return null;
  }
}

/** Create product (form-data) */
async function createProduct(formData: FormData): Promise<Product | null> {
  try {
    const { data } = await api.post("/api/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error("Failed to create product:", msg);
    return null;
  }
}

/** Update product (form-data) */
async function updateProduct(id: string, formData: FormData): Promise<Product | null> {
  try {
    const { data } = await api.put(`/api/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error(`Failed to update product ${id}:`, msg);
    return null;
  }
}

/** Delete product */
async function deleteProduct(id: string): Promise<{ message: string } | null> {
  try {
    const { data } = await api.delete(`/api/products/${id}`);
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error(`Failed to delete product ${id}:`, msg);
    return null;
  }
}

/** Get ALL products (admin only) */
async function getAllProductsForAdmin(): Promise<Product[]> {
  try {
    const { data } = await api.get("/api/products/all");
    return data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message;
    console.error("Failed to fetch all products for admin:", msg);
    return [];
  }
}

// ================== EXPORT ==================

export const productService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsForAdmin,
};
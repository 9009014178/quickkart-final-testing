// src/services/cartService.ts
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true, // if you use cookies / auth
});

export interface CartItem {
  _id: string;
  product: string; // or a Product object depending on your backend
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export const cartService = {
  // ✅ Send productId + quantity as JSON
  addToCart: async (productId: string, quantity: number = 1): Promise<Cart> => {
    try {
      const res = await api.post("/cart", {
        productId,  // 👈 adjust name if backend uses `product` instead
        quantity,
      });

      return res.data as Cart; // assuming backend returns the updated cart
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.error("Add to cart API error:", {
          status: err.response?.status,
          data: err.response?.data,
        });

        const message =
          (err.response?.data as any)?.message ||
          "Failed to add item to cart";

        throw new Error(message);
      }

      console.error("Add to cart unknown error:", err);
      throw new Error("Failed to add item to cart");
    }
  },

  // ... other cart methods (getCart, removeFromCart, etc.)
};

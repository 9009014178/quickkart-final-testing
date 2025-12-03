import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Product {
  _id: string;
  name?: string;
  price?: number;
  image?: string;
  // add other fields if you like
}

export interface CartItem {
  // compatibility fields for your Cart UI:
  _id: string;          // product ID (alias)
  name?: string;        // product name (alias)
  price?: number;       // product price (alias)
  image?: string;       // product image (alias)
  qty: number;          // quantity alias

  // “source of truth” fields:
  product: Product;
  quantity: number;
}

interface CartContextType {
  // main state
  items: CartItem[];
  cartItems: CartItem[]; // alias for compatibility

  // actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void; // product _id
  clearCart: () => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;

  // derived values
  totalItems: number;
  cartCount: number; // alias for compatibility
  subtotal: number;
  cartTotal: number; // alias for compatibility

  // extra helpers for your Cart.tsx
  getTotalItems: () => number;
  getTotalPrice: () => number;

  // loading state (for compatibility with Cart.tsx)
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};

interface CartProviderProps {
  children: ReactNode;
}

// helper to build a CartItem from product + quantity
const makeCartItem = (product: Product, quantity: number): CartItem => ({
  _id: product._id,
  name: product.name,
  price: product.price,
  image: product.image,
  qty: quantity,
  product,
  quantity,
});

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load from localStorage on mount (if available)
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const stored = window.localStorage.getItem("quickkart_cart");
      if (stored) {
        const parsed = JSON.parse(stored) as any[];

        if (Array.isArray(parsed)) {
          // Normalize whatever is in localStorage into our CartItem shape
          const normalized = parsed.map((raw) => {
            // If it already looks like a CartItem:
            if (raw.product) {
              const product: Product = {
                _id: raw.product._id ?? raw._id,
                name: raw.product.name ?? raw.name,
                price: raw.product.price ?? raw.price,
                image: raw.product.image ?? raw.image,
              };
              const quantity = raw.quantity ?? raw.qty ?? 1;
              return makeCartItem(product, quantity);
            }

            // Fallback: treat raw as product-like
            const product: Product = {
              _id: raw._id,
              name: raw.name,
              price: raw.price,
              image: raw.image,
            };
            const quantity = raw.quantity ?? raw.qty ?? 1;
            return makeCartItem(product, quantity);
          });

          setItems(normalized);
        }
      }
    } catch (err) {
      console.error("Failed to load cart from localStorage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem("quickkart_cart", JSON.stringify(items));
    } catch (err) {
      console.error("Failed to save cart to localStorage:", err);
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    if (!product || !product._id) {
      console.error("addToCart called without a valid product._id");
      return;
    }

    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item._id === product._id);

      if (existingIndex !== -1) {
        // increase quantity
        const updated = [...prev];
        const existing = updated[existingIndex];
        const newQty = existing.quantity + quantity;

        updated[existingIndex] = {
          ...existing,
          quantity: newQty,
          qty: newQty,
        };

        return updated;
      }

      // new item
      return [...prev, makeCartItem(product, quantity)];
    });
  };

  const updateCartItemQuantity = (productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item._id !== productId);
      }

      return prev.map((item) =>
        item._id === productId
          ? { ...item, quantity, qty: quantity }
          : item
      );
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item._id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    const price = item.price ?? item.product.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const getTotalItems = () => totalItems;
  const getTotalPrice = () => subtotal;

  const value: CartContextType = {
    items,
    cartItems: items, // alias

    addToCart,
    removeFromCart,
    clearCart,
    updateCartItemQuantity,

    totalItems,
    cartCount: totalItems, // alias
    subtotal,
    cartTotal: subtotal, // alias

    getTotalItems,
    getTotalPrice,

    loading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

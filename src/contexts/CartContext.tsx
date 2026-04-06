import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

export interface CartProduct {
  id: string;
  title: string;
  description: string;
  benefits?: string[];
  price: number;
  duration?: string;
  origin?: string; // page origin label
}

export interface CartItem {
  product: CartProduct;
  qty: number;
}

interface CartContextType {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: CartProduct) => void;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  isInCart: (id: string) => boolean;
  totalItems: number;
  subtotal: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  const addToCart = useCallback((product: CartProduct) => {
    if (product.price === 0) {
      toast({ title: "Programa gratuito!", description: "Entre em contato para se cadastrar." });
      return;
    }
    setCart((prev) => {
      const exists = prev.find((i) => i.product.id === product.id);
      if (exists) return prev.map((i) => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { product, qty: 1 }];
    });
    toast({ title: "Adicionado ao carrinho", description: product.title });
  }, []);

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  }, []);

  const isInCart = (id: string) => cart.some((i) => i.product.id === id);

  const clearCart = useCallback(() => setCart([]), []);

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, updateQty, removeFromCart, isInCart, totalItems, subtotal, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

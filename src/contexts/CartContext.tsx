'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Dish } from '@/types/database.types';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  is_available: boolean;
  quantity: number;
}

interface RawCartData {
  quantity: number;
  dish: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    is_available: boolean;
  };
}

interface CartContextType {
  items: CartItem[];
  cart: CartItem[];
  total: number;
  addToCart: (dish: Dish) => void;
  removeFromCart: (dishId: string) => void;
  updateQuantity: (dishId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load cart items from local storage or database
  useEffect(() => {
    const loadCart = async () => {
      setIsLoading(true);
      try {
        if (user) {
          console.log('Loading cart for user:', user.id);
          
          // Load cart from Supabase for authenticated users
          const { data, error } = await supabase
            .from('cart_items')
            .select(`
              quantity,
              dish:dishes (
                id,
                name,
                description,
                price,
                image_url,
                category,
                is_available
              )
            `)
            .eq('user_id', user.id);

          if (error) {
            console.error('Error loading cart:', error);
            throw error;
          }

          if (!data) {
            console.log('No cart data found');
            setItems([]);
            return;
          }

          console.log('Raw cart data:', data);

          // Transform and validate the cart items
          const cartItems: CartItem[] = (data as unknown as RawCartData[])
            .filter((item): item is RawCartData => !!item.dish)
            .map(item => ({
              ...item.dish,
              quantity: item.quantity || 1
            }));

          console.log('Processed cart items:', cartItems);
          setItems(cartItems);
        } else {
          // Load from localStorage for non-authenticated users
          const savedCart = localStorage.getItem('cart');
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart);
              if (Array.isArray(parsedCart)) {
                setItems(parsedCart);
              } else {
                console.warn('Invalid cart data in localStorage:', parsedCart);
                setItems([]);
              }
            } catch (e) {
              console.error('Error parsing cart from localStorage:', e);
              setItems([]);
            }
          }
        }
      } catch (error: any) {
        console.error('Error loading cart:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        setItems([]); // Reset to empty cart on error
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user]);

  // Save cart items whenever they change
  useEffect(() => {
    const saveCart = async () => {
      try {
        if (user) {
          console.log('Saving cart for user:', user.id);
          
          // First, delete existing cart items
          const { error: deleteError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

          if (deleteError) {
            console.error('Error deleting existing cart items:', deleteError);
            throw deleteError;
          }

          // Then insert new cart items
          if (items.length > 0) {
            // Validate and prepare cart data
            const cartData = items.map(item => {
              if (!item.id) {
                throw new Error(`Missing dish ID for item: ${JSON.stringify(item)}`);
              }
              
              return {
                user_id: user.id,
                dish_id: item.id,
                quantity: item.quantity || 1
              };
            });

            console.log('Prepared cart data:', cartData);

            // Insert items one by one to better handle errors
            for (const item of cartData) {
              const { error: insertError } = await supabase
                .from('cart_items')
                .insert(item)
                .select();

              if (insertError) {
                console.error('Error inserting cart item:', {
                  error: insertError,
                  item: item
                });
                throw insertError;
              }
            }

            console.log('Cart saved successfully');
          }
        } else {
          // Save to localStorage for non-authenticated users
          localStorage.setItem('cart', JSON.stringify(items));
        }
      } catch (error: any) {
        console.error('Error saving cart:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }
    };

    // Only save cart if we're not loading and there are items to save
    if (!isLoading) {
      saveCart();
    }
  }, [items, user, isLoading]);

  const addToCart = (dish: Dish) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === dish.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === dish.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Convert Dish to CartItem
      const cartItem: CartItem = {
        id: dish.id,
        name: dish.name,
        description: dish.description || '',
        price: dish.price,
        image_url: dish.image_url || '',
        category: dish.category_id || 'default',
        is_available: dish.is_available,
        quantity: 1
      };
      return [...currentItems, cartItem];
    });
  };

  const removeFromCart = (dishId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== dishId));
  };

  const updateQuantity = (dishId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(dishId);
      return;
    }

    setItems(currentItems =>
      currentItems.map(item =>
        item.id === dishId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        cart: items,
        total: totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 
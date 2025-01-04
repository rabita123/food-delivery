'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';

export default function OrderPreview() {
  const router = useRouter();
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!user) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (!session) {
            const redirect = encodeURIComponent('/order-preview');
            router.push(`/login?redirect=${redirect}`);
            return;
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (!session) {
        const redirect = encodeURIComponent('/order-preview');
        router.push(`/login?redirect=${redirect}`);
        return;
      }

      // Validate cart is not empty
      if (!cart || cart.length === 0) {
        throw new Error('Your cart is empty');
      }

      // Validate required fields
      if (!deliveryAddress.trim()) {
        throw new Error('Delivery address is required');
      }
      if (!contactNumber.trim()) {
        throw new Error('Contact number is required');
      }

      // First, create the order in the database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          status: 'pending',
          total_amount: total,
          delivery_address: deliveryAddress.trim(),
          contact_number: contactNumber.trim(),
          special_instructions: specialInstructions.trim() || null,
        })
        .select('*')
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order: ' + orderError.message);
      }
      if (!orderData || !orderData.id) {
        console.error('No order data or ID returned:', orderData);
        throw new Error('Failed to create order: No order ID returned');
      }

      // Then, create order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        dish_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        // If order items creation fails, delete the order
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw new Error('Failed to create order items: ' + itemsError.message);
      }

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          orderId: orderData.id,
          amount: total,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        // If payment intent creation fails, delete the order
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      if (data.error) {
        // If there's an error in the response, delete the order
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw new Error(data.error);
      }

      // Clear the cart after successful order creation
      clearCart();

      // Redirect to payment page
      router.push(`/payment?client_secret=${data.clientSecret}&orderId=${orderData.id}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      setError(error.message || 'Failed to create order');
      setIsProcessing(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-6 border-b border-gray-200 sm:px-6">
            <h1 className="text-2xl font-bold text-gray-900">Order Preview</h1>
          </div>

          <div className="px-4 py-6 sm:px-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Order Items */}
            <div className="mb-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="relative h-16 w-16 rounded-md overflow-hidden">
                        <Image
                          src={item.image_url || '/default-dish.jpg'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Information Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Delivery Address
                </label>
                <input
                  type="text"
                  id="address"
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your delivery address"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Enter your contact number"
                />
              </div>

              <div>
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">
                  Special Instructions (Optional)
                </label>
                <textarea
                  id="instructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  placeholder="Add any special instructions for your order"
                />
              </div>

              {/* Order Summary */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Total</p>
                  <p>${total.toFixed(2)}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-500">Delivery fee included</p>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 
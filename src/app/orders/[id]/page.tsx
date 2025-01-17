'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Loader2, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import StripePayment from '@/components/StripePayment';
import OrderInvoice from '@/components/OrderInvoice';

interface OrderItem {
  id: string;
  dish_id: string;
  quantity: number;
  price_at_time: number;
  dish: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  contact_number: string;
  special_instructions: string | null;
  items: OrderItem[];
  payment_method?: 'cash' | 'card';
}

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showStripePayment, setShowStripePayment] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkOrderAndPayment = async () => {
      // Check if we're returning from a payment
      const searchParams = new URLSearchParams(window.location.search);
      const isFromPayment = searchParams.get('payment') === 'stripe';
      const paymentIntentStatus = searchParams.get('payment_intent');

      if (isFromPayment && paymentIntentStatus) {
        // Update order status to paid for successful Stripe payment
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            payment_method: 'card',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id);

        if (updateError) {
          console.error('Error updating order status:', updateError);
          setError('Failed to update order status');
        }
      }
      
      // Load order after potential status update
      await loadOrder();
      
      if (order?.status === 'paid' || (isFromPayment && paymentIntentStatus)) {
        setShowSuccess(true);
      }
    };

    checkOrderAndPayment();
  }, [user, params.id]);

  const loadOrder = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            id,
            dish_id,
            quantity,
            price_at_time,
            dish:dishes(
              name,
              image_url
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Order not found');

      if (orderData.user_id !== user?.id) {
        throw new Error('Unauthorized');
      }

      setOrder(orderData);
    } catch (error: any) {
      console.error('Error loading order:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    setError(null);

    if (selectedPaymentMethod === 'card') {
      setShowStripePayment(true);
      return;
    }

    // Handle cash payment
    setIsProcessingPayment(true);
    try {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'pending', // Cash payments start as pending
          payment_method: 'cash',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (updateError) throw updateError;
      
      // Reload order to confirm update
      const { data: updatedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;
      
      if (updatedOrder.status !== 'pending') {
        throw new Error('Failed to update order status');
      }

      await loadOrder(); // Reload the order first
      setShowSuccess(true); // Then show success state
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to confirm order. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleStripeSuccess = async () => {
    try {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'paid',
          payment_method: 'card',
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // Verify the update
      const { data: updatedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', params.id)
        .single();

      if (fetchError) throw fetchError;
      
      if (updatedOrder.status !== 'paid') {
        throw new Error('Failed to update order status');
      }

      await loadOrder(); // Reload the order first
      setShowStripePayment(false);
      setShowSuccess(true); // Then show success state
    } catch (error: any) {
      console.error('Error updating order:', error);
      setError('Failed to update order status. Please contact support.');
      setShowStripePayment(false);
    }
  };

  const handleStripeError = (errorMessage: string) => {
    setError(errorMessage);
    setShowStripePayment(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          {error || 'Order not found'}
        </h1>
        <Button onClick={() => router.push('/menu')}>Return to Menu</Button>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-center mb-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                {order.payment_method === 'cash' ? 'Order Confirmed!' : 'Payment Successful!'}
              </h1>
              <p className="text-gray-600">
                {order.payment_method === 'cash' 
                  ? 'Your order has been confirmed. Payment will be collected upon delivery.'
                  : 'Your order has been placed and will be delivered soon.'}
              </p>
              {order.payment_method === 'cash' && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-yellow-800">
                    Please have the exact amount of ${order.total_amount.toFixed(2)} ready for the delivery person.
                  </p>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="border-t border-b border-gray-200 py-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {order.status === 'pending' ? 'Payment Pending' : 'Paid'}
                </div>
              </div>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative w-20 h-20">
                      <Image
                        src={item.dish.image_url || '/default-dish.jpg'}
                        alt={item.dish.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.dish.name}</h3>
                      <p className="text-gray-500">Quantity: {item.quantity}</p>
                      <p className="text-gray-700">${(item.price_at_time * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Total */}
              <div className="mt-6 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-xl font-semibold text-gray-900">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium">Address:</span> {order.delivery_address}</p>
                <p><span className="font-medium">Contact:</span> {order.contact_number}</p>
                {order.special_instructions && (
                  <p><span className="font-medium">Special Instructions:</span> {order.special_instructions}</p>
                )}
              </div>
            </div>

            {/* Invoice Download */}
            <div className="mb-8">
              <OrderInvoice order={order} />
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={() => router.push('/orders')} className="w-full">
                View All Orders
              </Button>
              <Button onClick={() => router.push('/menu')} variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showStripePayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-semibold text-gray-900">Card Payment</h1>
              <p className="mt-2 text-sm text-gray-600">
                Order #{order?.id}
              </p>
              <p className="text-sm text-gray-600">
                Amount: ${order?.total_amount.toFixed(2)}
              </p>
            </div>
            <div className="p-6">
              <StripePayment
                amount={order?.total_amount || 0}
                orderId={order?.id || ''}
                onSuccess={handleStripeSuccess}
                onError={handleStripeError}
              />
              <Button
                onClick={() => setShowStripePayment(false)}
                variant="outline"
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Order Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Order Confirmation</h1>
            <p className="mt-2 text-sm text-gray-600">
              Order #{order.id}
            </p>
            <p className="text-sm text-gray-600">
              Placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
            <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-gray-100 text-gray-800'}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
          </div>

          {/* Order Items */}
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative w-20 h-20">
                    <Image
                      src={item.dish.image_url || '/default-dish.jpg'}
                      alt={item.dish.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.dish.name}</h3>
                    <p className="text-gray-500">Quantity: {item.quantity}</p>
                    <p className="text-gray-700">${(item.price_at_time * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="px-6 py-4 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h2>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Address:</span> {order.delivery_address}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Contact:</span> {order.contact_number}
              </p>
              {order.special_instructions && (
                <p className="text-gray-600">
                  <span className="font-medium">Special Instructions:</span> {order.special_instructions}
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Total</h2>
              <p className="text-xl font-semibold text-gray-900">
                ${order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Payment Section */}
          {order.status === 'pending' && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h2>
              
              {error && (
                <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setSelectedPaymentMethod('cash')}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors
                    ${selectedPaymentMethod === 'cash' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 hover:border-orange-500'}`}
                >
                  <Banknote className="h-6 w-6" />
                  <span className="font-medium">Cash on Delivery</span>
                </button>

                <button
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-4 border rounded-lg flex flex-col items-center justify-center space-y-2 transition-colors
                    ${selectedPaymentMethod === 'card' 
                      ? 'border-orange-500 bg-orange-50 text-orange-700' 
                      : 'border-gray-200 hover:border-orange-500'}`}
                >
                  <CreditCard className="h-6 w-6" />
                  <span className="font-medium">Card Payment</span>
                </button>
              </div>

              <Button
                onClick={handlePayment}
                className="w-full"
                disabled={isProcessingPayment || !selectedPaymentMethod}
              >
                {isProcessingPayment ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing Payment...
                  </div>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </div>
          )}

          {/* Back Button */}
          <div className="px-6 py-4 border-t border-gray-200">
            <Button
              onClick={() => router.push('/orders')}
              variant="outline"
              className="w-full"
            >
              View All Orders
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 
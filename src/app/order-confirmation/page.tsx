'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStripe } from '@stripe/react-stripe-js';
import { supabase } from '@/lib/supabase';

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  contact_number: string;
  created_at: string;
  items: Array<{
    dish_name: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const stripe = useStripe();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!stripe) return;

        const clientSecret = searchParams.get('payment_intent_client_secret');
        if (!clientSecret) {
          throw new Error('No payment intent client secret found');
        }

        // Retrieve payment intent
        const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
        if (!paymentIntent) {
          throw new Error('Payment intent not found');
        }

        // Fetch order details from Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              quantity,
              price_at_time,
              dishes (
                name
              )
            )
          `)
          .eq('payment_intent_id', paymentIntent.id)
          .single();

        if (orderError) throw orderError;

        // Format order details
        const formattedOrder: OrderDetails = {
          id: orderData.id,
          status: orderData.status,
          total_amount: orderData.total_amount,
          delivery_address: orderData.delivery_address,
          contact_number: orderData.contact_number,
          created_at: orderData.created_at,
          items: orderData.order_items.map((item: any) => ({
            dish_name: item.dishes.name,
            quantity: item.quantity,
            price: item.price_at_time,
          })),
        };

        setOrder(formattedOrder);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [stripe, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error || 'Order not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-4 py-6 bg-green-500 sm:px-6">
            <div className="flex items-center justify-center">
              <svg
                className="h-12 w-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="mt-4 text-center text-2xl font-bold text-white">
              Order Confirmed!
            </h1>
            <p className="mt-2 text-center text-white">
              Thank you for your order. Your food is being prepared.
            </p>
          </div>

          <div className="px-4 py-6 sm:px-6">
            <div className="text-gray-700">
              <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Order ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.delivery_address}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.contact_number}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900">Order Summary</h3>
              <ul className="mt-4 divide-y divide-gray-200">
                {order.items.map((item, index) => (
                  <li key={index} className="py-4 flex">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.dish_name}</p>
                      <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-gray-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between">
                  <p className="text-lg font-medium text-gray-900">Total</p>
                  <p className="text-lg font-medium text-gray-900">
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
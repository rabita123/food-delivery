'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { UserResponse } from '@supabase/supabase-js';
import OrderInvoice from '@/components/OrderInvoice';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface OrderDetails {
  id: string;
  status: string;
  total_amount: number;
  delivery_address: string;
  contact_number: string;
  special_instructions: string | null;
  created_at: string;
  estimated_delivery_time: string;
  payment_method?: 'cash' | 'card';
  items: Array<{
    dish_id: string;
    dish_name: string;
    quantity: number;
    price: number;
    image_url: string;
  }>;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const generateInvoice = async () => {
    if (!order) return;
    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Add logo or header
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text('HomelyEats', pageWidth / 2, 20, { align: 'center' });

      // Add invoice details
      doc.setFontSize(12);
      doc.text(`Invoice for Order #${order.id}`, 20, 40);
      doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 50);
      doc.text(`Time: ${new Date(order.created_at).toLocaleTimeString()}`, 20, 60);

      // Add customer details
      doc.text('Delivery Details:', 20, 80);
      doc.setFontSize(10);
      doc.text(`Address: ${order.delivery_address}`, 20, 90);
      doc.text(`Contact: ${order.contact_number}`, 20, 100);
      if (order.special_instructions) {
        doc.text(`Special Instructions: ${order.special_instructions}`, 20, 110);
      }

      // Add order items table
      const tableData = order.items.map(item => [
        item.dish_name,
        item.quantity.toString(),
        `$${item.price.toFixed(2)}`,
        `$${(item.price * item.quantity).toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 130,
        head: [['Item', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
      });

      // Add total amount
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Amount: $${order.total_amount.toFixed(2)}`, pageWidth - 60, finalY + 20);

      // Add estimated delivery time
      doc.setFont('helvetica', 'normal');
      doc.text(`Estimated Delivery: ${order.estimated_delivery_time}`, 20, finalY + 40);

      // Add footer
      doc.setFontSize(10);
      doc.text('Thank you for ordering with HomelyEats!', pageWidth / 2, finalY + 60, { align: 'center' });

      // Save the PDF
      doc.save(`order-${order.id}-invoice.pdf`);
    } catch (error) {
      console.error('Error generating invoice:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Wait for user session to be established
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Authentication error');
        }

        if (!session?.user) {
          throw new Error('Please sign in to view order details');
        }

        console.log('Fetching order details for ID:', orderId);

        // Fetch order details from Supabase
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_amount,
            delivery_address,
            contact_number,
            special_instructions,
            created_at,
            payment_method,
            order_items (
              quantity,
              price_at_time,
              dishes (
                id,
                name,
                image_url
              )
            )
          `)
          .eq('id', orderId)
          .eq('user_id', session.user.id)
          .single();

        if (orderError) {
          console.error('Error fetching order:', orderError);
          throw orderError;
        }

        if (!orderData) {
          console.error('No order data found for ID:', orderId);
          throw new Error('Order not found');
        }

        console.log('Order data received:', orderData);

        // Calculate estimated delivery time (45-60 minutes from order time)
        const orderDate = new Date(orderData.created_at);
        const minDeliveryTime = new Date(orderDate.getTime() + 45 * 60000);
        const maxDeliveryTime = new Date(orderDate.getTime() + 60 * 60000);
        const estimatedDeliveryTime = `${minDeliveryTime.toLocaleTimeString()} - ${maxDeliveryTime.toLocaleTimeString()}`;

        // Format order details
        const formattedOrder: OrderDetails = {
          id: orderData.id,
          status: orderData.status,
          total_amount: orderData.total_amount,
          delivery_address: orderData.delivery_address,
          contact_number: orderData.contact_number,
          special_instructions: orderData.special_instructions,
          created_at: orderData.created_at,
          payment_method: orderData.payment_method,
          estimated_delivery_time: estimatedDeliveryTime,
          items: orderData.order_items.map((item: any) => ({
            dish_id: item.dishes.id,
            dish_name: item.dishes.name,
            quantity: item.quantity,
            price: item.price_at_time,
            image_url: item.dishes.image_url,
          })),
        };

        setOrder(formattedOrder);
      } catch (error: any) {
        console.error('Error fetching order:', error);
        setError(error.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/menu"
            className="text-orange-500 hover:text-orange-600"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <Link
            href="/menu"
            className="text-orange-500 hover:text-orange-600"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Success Banner */}
          <div className="bg-green-100 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Order Successfully Placed!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your order has been confirmed and will be delivered soon.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Invoice */}
          <div className="p-6">
            <OrderInvoice order={{
              id: order.id,
              created_at: order.created_at,
              status: order.status,
              total_amount: order.total_amount,
              delivery_address: order.delivery_address,
              contact_number: order.contact_number,
              special_instructions: order.special_instructions,
              payment_method: order.payment_method,
              items: order.items.map(item => ({
                id: item.dish_id,
                dish_id: item.dish_id,
                quantity: item.quantity,
                price_at_time: item.price,
                dish: {
                  name: item.dish_name,
                  image_url: item.image_url
                }
              }))
            }} />
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6 space-y-3">
              <Link
              href="/orders"
                className="block w-full bg-orange-500 text-white text-center py-3 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
              View All Orders
              </Link>
              <Link
              href="/menu"
                className="block w-full bg-white text-orange-500 text-center py-3 px-4 rounded-md border border-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
              Continue Shopping
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
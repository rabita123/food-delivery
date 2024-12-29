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
  items: Array<{
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
          estimated_delivery_time: estimatedDeliveryTime,
          items: orderData.order_items.map((item: any) => ({
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
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

          {/* Header */}
          <div className="px-4 py-6 border-b border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Confirmation</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Order #{order.id}
                </p>
                <p className="text-sm text-gray-500">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize 
                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    order.status === 'preparing' ? 'bg-blue-100 text-blue-800' : 
                    order.status === 'delivering' ? 'bg-purple-100 text-purple-800' : 
                    'bg-green-100 text-green-800'}`}>
                  {order.status}
                </span>
                <button
                  onClick={generateInvoice}
                  disabled={isDownloading}
                  className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isDownloading ? 'Generating...' : 'Download Invoice'}
                </button>
              </div>
            </div>
          </div>

          {/* Estimated Delivery Time */}
          <div className="px-4 py-4 sm:px-6 bg-orange-50">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-orange-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-900">Estimated Delivery Time</h3>
                <p className="text-sm text-gray-700">{order.estimated_delivery_time}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="px-4 py-6 sm:px-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900">Delivery Information</h2>
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Delivery Address</p>
                    <p className="mt-1 text-sm text-gray-900">{order.delivery_address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact Number</p>
                    <p className="mt-1 text-sm text-gray-900">{order.contact_number}</p>
                  </div>
                  {order.special_instructions && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-500">Special Instructions</p>
                      <p className="mt-1 text-sm text-gray-900">{order.special_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
              <div className="mt-4 bg-gray-50 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 relative">
                                <Image
                                  src={item.image_url || '/default-dish.jpg'}
                                  alt={item.dish_name}
                                  fill
                                  className="rounded-full object-cover"
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{item.dish_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.price.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-base font-medium text-gray-900">
                  <p>Total</p>
                  <p>${order.total_amount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col space-y-4">
              <Link
                href="/menu"
                className="block w-full bg-orange-500 text-white text-center py-3 px-4 rounded-md hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Order More Food
              </Link>
              <Link
                href="/orders"
                className="block w-full bg-white text-orange-500 text-center py-3 px-4 rounded-md border border-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                View All Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
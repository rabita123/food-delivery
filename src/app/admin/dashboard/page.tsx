"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalChefs: number;
}

interface RecentOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer: {
    name: string;
  };
}

interface OrderQueryResult {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  customer: {
    name: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
      return;
    }

    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch total orders and revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

      // Fetch total customers
      const { count: totalCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (customersError) throw customersError;

      // Fetch total chefs
      const { count: totalChefs, error: chefsError } = await supabase
        .from('chefs')
        .select('*', { count: 'exact', head: true });

      if (chefsError) throw chefsError;

      setStats({
        totalOrders,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        totalChefs: totalChefs || 0,
      });

      // Fetch recent orders with customer information
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          customer:customers!inner(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<OrderQueryResult[]>();

      if (recentOrdersError) throw recentOrdersError;

      if (recentOrdersData) {
        setRecentOrders(recentOrdersData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-gray-600 text-sm">Total Orders</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalOrders}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-gray-600 text-sm">Total Revenue</h2>
          <p className="text-3xl font-bold mt-2">
            ${stats?.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-gray-600 text-sm">Total Customers</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalCustomers}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-gray-600 text-sm">Total Chefs</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalChefs}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>

        {recentOrders.length === 0 ? (
          <p className="text-gray-500">No recent orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b">
                    <td className="py-3 px-4">{order.id}</td>
                    <td className="py-3 px-4">{order.customer.name}</td>
                    <td className="py-3 px-4">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 
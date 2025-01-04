"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalDishes: number;
  recentOrders: Array<{
    id: string;
    created_at: string;
    total_amount: number;
    status: string;
    user: {
      full_name: string;
      email: string;
    };
  }>;
}

interface OrderResponse {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  user: {
    full_name: string;
    email: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          status,
          user:profiles!inner(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<OrderResponse[]>();

      if (ordersError) throw ordersError;

      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      const { count: totalCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalDishes } = await supabase
        .from('dishes')
        .select('*', { count: 'exact', head: true });

      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = revenueData?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

      setDashboardData({
        totalOrders: totalOrders || 0,
        totalRevenue,
        totalCustomers: totalCustomers || 0,
        totalDishes: totalDishes || 0,
        recentOrders: ordersData || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/admin/login');
      return;
    }
    fetchDashboardData();
  }, [user, router, fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">Total Orders</h2>
          <p className="text-3xl font-semibold">{dashboardData?.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">Total Revenue</h2>
          <p className="text-3xl font-semibold">
            ${((dashboardData?.totalRevenue || 0) / 100).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">Total Customers</h2>
          <p className="text-3xl font-semibold">{dashboardData?.totalCustomers}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">Total Dishes</h2>
          <p className="text-3xl font-semibold">{dashboardData?.totalDishes}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
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
              {dashboardData?.recentOrders.map((order) => (
                <tr key={order.id} className="border-b">
                  <td className="py-3 px-4">{order.id}</td>
                  <td className="py-3 px-4">{order.user?.full_name}</td>
                  <td className="py-3 px-4">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    ${(order.total_amount / 100).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
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
      </div>
    </div>
  );
} 
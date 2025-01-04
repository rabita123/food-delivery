"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
}

interface ChefStats {
  totalChefs: number
  activeChefs: number
  topChefs: Array<{
    name: string
    orders: number
    revenue: number
  }>
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomers: number
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null)
  const [chefStats, setChefStats] = useState<ChefStats | null>(null)
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/admin/login')
      return
    }

    const fetchAnalytics = async () => {
      try {
        // Fetch order statistics
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')

        if (ordersError) throw ordersError

        const totalOrders = orders.length
        const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
        const averageOrderValue = totalRevenue / totalOrders

        setOrderStats({
          totalOrders,
          totalRevenue,
          averageOrderValue,
        })

        // Fetch chef statistics
        const { data: chefs, error: chefsError } = await supabase
          .from('chefs')
          .select('*')

        if (chefsError) throw chefsError

        const activeChefs = chefs.filter((chef) => chef.status === 'active').length

        setChefStats({
          totalChefs: chefs.length,
          activeChefs,
          topChefs: [
            { name: 'Chef A', orders: 150, revenue: 4500 },
            { name: 'Chef B', orders: 120, revenue: 3600 },
            { name: 'Chef C', orders: 100, revenue: 3000 },
          ],
        })

        // Fetch customer statistics
        const { data: customers, error: customersError } = await supabase
          .from('customers')
          .select('*')

        if (customersError) throw customersError

        const activeCustomers = customers.filter(
          (customer) => customer.last_order_date > Date.now() - 30 * 24 * 60 * 60 * 1000
        ).length

        const newCustomers = customers.filter(
          (customer) =>
            customer.created_at > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ).length

        setCustomerStats({
          totalCustomers: customers.length,
          activeCustomers,
          newCustomers,
        })
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Order Statistics</h2>
          {orderStats && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{orderStats.totalOrders}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${orderStats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold">
                  ${orderStats.averageOrderValue.toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Chef Statistics</h2>
          {chefStats && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Total Chefs</p>
                <p className="text-2xl font-bold">{chefStats.totalChefs}</p>
              </div>
              <div>
                <p className="text-gray-600">Active Chefs</p>
                <p className="text-2xl font-bold">{chefStats.activeChefs}</p>
              </div>
              <div>
                <p className="text-gray-600">Top Performing Chefs</p>
                <div className="mt-2 space-y-2">
                  {chefStats.topChefs.map((chef, index) => (
                    <div key={index} className="text-sm">
                      {chef.name}: {chef.orders} orders, ${chef.revenue}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Statistics</h2>
          {customerStats && (
            <div className="space-y-4">
              <div>
                <p className="text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{customerStats.totalCustomers}</p>
              </div>
              <div>
                <p className="text-gray-600">Active Customers (30 days)</p>
                <p className="text-2xl font-bold">
                  {customerStats.activeCustomers}
                </p>
              </div>
              <div>
                <p className="text-gray-600">New Customers (7 days)</p>
                <p className="text-2xl font-bold">{customerStats.newCustomers}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <p className="text-gray-600">
          This section will display recent orders, chef registrations, and customer activities.
        </p>
      </div>
    </div>
  )
} 
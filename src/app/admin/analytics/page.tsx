"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface AnalyticsData {
  dailyRevenue: Array<{
    date: string
    revenue: number
  }>
  topDishes: Array<{
    id: string
    name: string
    total_orders: number
    revenue: number
  }>
  customerStats: {
    total: number
    new_this_month: number
    active: number
  }
}

export default function AdminAnalytics() {
  const router = useRouter()
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalyticsData = useCallback(async () => {
    try {
      // Fetch daily revenue for the past 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: revenueData } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'completed')

      // Process daily revenue
      const dailyRevenue = revenueData?.reduce((acc: any[], order) => {
        const date = new Date(order.created_at).toLocaleDateString()
        const existingDate = acc.find((item) => item.date === date)
        
        if (existingDate) {
          existingDate.revenue += order.total_amount || 0
        } else {
          acc.push({ date, revenue: order.total_amount || 0 })
        }
        
        return acc
      }, []) || []

      // Fetch top dishes
      const { data: dishesData } = await supabase
        .from('order_items')
        .select(`
          dish_id,
          dish:dishes(name),
          quantity,
          price
        `)
        .order('quantity', { ascending: false })
        .limit(5)

      // Process top dishes
      const topDishes = dishesData?.reduce((acc: any[], item) => {
        const existingDish = acc.find((dish) => dish.id === item.dish_id)
        
        if (existingDish) {
          existingDish.total_orders += item.quantity
          existingDish.revenue += item.price * item.quantity
        } else {
          acc.push({
            id: item.dish_id,
            name: item.dish?.name || 'Unknown Dish',
            total_orders: item.quantity,
            revenue: item.price * item.quantity,
          })
        }
        
        return acc
      }, []) || []

      // Fetch customer stats
      const { count: totalCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      const thisMonth = new Date()
      thisMonth.setDate(1)
      
      const { count: newCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString())

      const { count: activeCustomers } = await supabase
        .from('orders')
        .select('user_id', { count: 'exact', head: true, distinct: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      setAnalyticsData({
        dailyRevenue,
        topDishes,
        customerStats: {
          total: totalCustomers || 0,
          new_this_month: newCustomers || 0,
          active: activeCustomers || 0,
        },
      })
    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/admin/login')
      return
    }
    fetchAnalyticsData()
  }, [user, router, fetchAnalyticsData])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">Total Customers</h2>
          <p className="text-3xl font-semibold">{analyticsData?.customerStats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">New Customers This Month</h2>
          <p className="text-3xl font-semibold">
            {analyticsData?.customerStats.new_this_month}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-gray-500 text-sm">Active Customers (30 days)</h2>
          <p className="text-3xl font-semibold">{analyticsData?.customerStats.active}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Revenue Trend (Last 30 Days)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData?.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                tickFormatter={(value) => `$${(value / 100).toFixed(2)}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, 'Revenue']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4f46e5"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Top Performing Dishes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Dish Name</th>
                <th className="text-left py-3 px-4">Total Orders</th>
                <th className="text-left py-3 px-4">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData?.topDishes.map((dish) => (
                <tr key={dish.id} className="border-b">
                  <td className="py-3 px-4">{dish.name}</td>
                  <td className="py-3 px-4">{dish.total_orders}</td>
                  <td className="py-3 px-4">
                    ${(dish.revenue / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 
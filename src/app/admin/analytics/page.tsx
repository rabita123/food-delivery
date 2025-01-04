"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, TrendingUp, ChefHat, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RevenueData {
  date: string
  amount: number
}

interface TopDish {
  id: string
  name: string
  total_orders: number
  total_revenue: number
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [topDishes, setTopDishes] = useState<TopDish[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [revenueGrowth, setRevenueGrowth] = useState(0)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Get the date range for the last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      // Fetch orders for revenue data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')

      if (ordersError) throw ordersError

      // Process revenue data by date
      const revenueByDate = orders?.reduce((acc: { [key: string]: number }, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + (order.total_amount || 0)
        return acc
      }, {}) || {}

      // Convert to array and sort by date
      const revenueArray = Object.entries(revenueByDate).map(([date, amount]) => ({
        date,
        amount,
      })).sort((a, b) => a.date.localeCompare(b.date))

      setRevenueData(revenueArray)

      // Calculate total revenue and growth
      const totalRev = revenueArray.reduce((sum, item) => sum + item.amount, 0)
      setTotalRevenue(totalRev)

      // Calculate revenue growth (comparing last 15 days with previous 15 days)
      const midPoint = Math.floor(revenueArray.length / 2)
      const recentRevenue = revenueArray.slice(midPoint).reduce((sum, item) => sum + item.amount, 0)
      const previousRevenue = revenueArray.slice(0, midPoint).reduce((sum, item) => sum + item.amount, 0)
      const growth = previousRevenue === 0 ? 100 : ((recentRevenue - previousRevenue) / previousRevenue) * 100
      setRevenueGrowth(growth)

      // Fetch top dishes
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          dishes (
            id,
            name,
            price
          )
        `)
        .not('dishes', 'is', null)

      if (itemsError) throw itemsError

      // Process top dishes data
      const dishStats: Record<string, TopDish> = {}
      orderItems?.forEach(item => {
        const dish = item.dishes as unknown as { id: string; name: string; price: number }
        if (dish && 'id' in dish && 'name' in dish && 'price' in dish) {
          if (!dishStats[dish.id]) {
            dishStats[dish.id] = {
              id: dish.id,
              name: dish.name,
              total_orders: 0,
              total_revenue: 0
            }
          }
          dishStats[dish.id].total_orders += item.quantity || 0
          dishStats[dish.id].total_revenue += (dish.price * (item.quantity || 0))
        }
      })

      setTopDishes(Object.values(dishStats).sort((a, b) => b.total_orders - a.total_orders))

    } catch (error) {
      console.error('Error fetching analytics data:', error)
      setError('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <Button
          variant="primary"
          onClick={fetchAnalyticsData}
          leftIcon={<RefreshCcw />}
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Track your business performance</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnalyticsData}
          leftIcon={<RefreshCcw />}
          isLoading={isLoading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-6 mb-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
              <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
              <div className="flex items-center text-sm mt-1 justify-end">
                <TrendingUp className={`h-4 w-4 ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'} mr-1`} />
                <span className={`${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'} font-medium`}>
                  {Math.abs(revenueGrowth).toFixed(1)}% {revenueGrowth >= 0 ? 'increase' : 'decrease'}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="h-72 mt-6">
            <div className="flex h-full items-end space-x-2">
              {revenueData.map((data) => {
                const height = totalRevenue ? (data.amount / totalRevenue) * 100 : 0
                return (
                  <div
                    key={data.date}
                    className="flex-1 group relative"
                  >
                    <div
                      className="bg-blue-500 hover:bg-blue-600 transition-all rounded-t"
                      style={{ height: `${Math.max(height, 1)}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        ${data.amount.toFixed(2)}
                        <br />
                        {new Date(data.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top Dishes */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center mb-6">
            <ChefHat className="h-6 w-6 text-orange-500 mr-2" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Most Ordered Dishes</h2>
              <p className="text-sm text-gray-500 mt-1">Top performing menu items</p>
            </div>
          </div>

          <div className="space-y-6">
            {topDishes.slice(0, 5).map((dish, index) => (
              <div key={dish.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    <span className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-medium text-gray-900">{dish.name}</h3>
                      <p className="text-sm text-gray-500">
                        {dish.total_orders} orders · ${dish.total_revenue.toFixed(2)} revenue
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {((dish.total_orders / topDishes[0].total_orders) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 rounded-full h-2 transition-all duration-500"
                    style={{
                      width: `${(dish.total_orders / topDishes[0].total_orders) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 
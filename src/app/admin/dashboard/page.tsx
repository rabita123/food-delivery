"use client"

import React from "react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ShoppingBag, DollarSign, ChefHat, CheckCircle, Clock, XCircle } from "lucide-react"

interface DashboardStats {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  canceledOrders: number
  totalRevenue: number
  totalDishes: number
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    completedOrders: 0,
    pendingOrders: 0,
    canceledOrders: 0,
    totalRevenue: 0,
    totalDishes: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch orders with status counts
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('id, total_amount, status')

      if (orderError) throw orderError

      // Calculate order statistics
      const orderStats = orders?.reduce(
        (acc, order) => {
          acc.totalOrders++
          acc.totalRevenue += order.total_amount || 0

          switch (order.status) {
            case 'completed':
              acc.completedOrders++
              break
            case 'pending':
              acc.pendingOrders++
              break
            case 'canceled':
              acc.canceledOrders++
              break
          }
          return acc
        },
        {
          totalOrders: 0,
          completedOrders: 0,
          pendingOrders: 0,
          canceledOrders: 0,
          totalRevenue: 0
        }
      ) || {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        canceledOrders: 0,
        totalRevenue: 0
      }

      // Fetch total dishes
      const { count: dishCount, error: dishError } = await supabase
        .from('dishes')
        .select('id', { count: 'exact' })
        .eq('is_available', true)

      if (dishError) throw dishError

      setStats({
        ...orderStats,
        totalDishes: dishCount || 0
      })

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
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
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Orders Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-2xl font-bold mt-1">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span>{stats.completedOrders}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
              <span>{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-red-500 mr-1" />
              <span>{stats.canceledOrders}</span>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold mt-1">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Dishes Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Available Dishes</h3>
              <p className="text-2xl font-bold mt-1">{stats.totalDishes}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <ChefHat className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Active menu items ready to order
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 
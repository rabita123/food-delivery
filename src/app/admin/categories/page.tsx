'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
  dish_count: number
}

export default function AdminCategories() {
  const router = useRouter()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')

      if (categoriesError) throw categoriesError

      // Get dish count for each category
      const categoriesWithCount = await Promise.all(
        categoriesData.map(async (category) => {
          const { count } = await supabase
            .from('dishes')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)

          return {
            ...category,
            dish_count: count || 0,
          }
        })
      )

      setCategories(categoriesWithCount)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/admin/login')
      return
    }
    fetchCategories()
  }, [user, router, fetchCategories])

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategory.name,
            description: newCategory.description || null,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setCategories([...categories, { ...data, dish_count: 0 }])
      setNewCategory({ name: '', description: '' })
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          description: editingCategory.description,
        })
        .eq('id', editingCategory.id)

      if (error) throw error

      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? editingCategory : cat
        )
      )
      setEditingCategory(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCategories(categories.filter((cat) => cat.id !== id))
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <button
          onClick={() => {
            setEditingCategory(null)
            setNewCategory({ name: '', description: '' })
            setIsModalOpen(true)
          }}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
        >
          Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {category.description || 'No description'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingCategory(category)
                    setIsModalOpen(true)
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{category.dish_count} dishes</span>
              <span>
                Created: {new Date(category.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h2>
            <form
              onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      : setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={
                    editingCategory
                      ? editingCategory.description || ''
                      : newCategory.description
                  }
                  onChange={(e) =>
                    editingCategory
                      ? setEditingCategory({
                          ...editingCategory,
                          description: e.target.value,
                        })
                      : setNewCategory({
                          ...newCategory,
                          description: e.target.value,
                        })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 
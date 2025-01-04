"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

interface Dish {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  is_available: boolean
  category: {
    id: string
    name: string
  }
  created_at: string
}

interface Category {
  id: string
  name: string
}

export default function AdminDishes() {
  const router = useRouter()
  const { user } = useAuth()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newDish, setNewDish] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true,
  })
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  const fetchDishes = useCallback(async () => {
    try {
      const { data: dishesData, error: dishesError } = await supabase
        .from("dishes")
        .select(`
          *,
          category:categories (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (dishesError) throw dishesError

      setDishes(dishesData || [])

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (categoriesError) throw categoriesError

      setCategories(categoriesData || [])
    } catch (error) {
      console.error("Error fetching dishes:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push("/admin/login")
      return
    }
    fetchDishes()
  }, [user, router, fetchDishes])

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `dish-images/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from("images")
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error("Error uploading image:", error)
      throw error
    }
  }

  const handleCreateDish = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let imageUrl = newDish.image_url

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      const { data, error } = await supabase
        .from("dishes")
        .insert([
          {
            name: newDish.name,
            description: newDish.description,
            price: parseFloat(newDish.price) * 100, // Convert to cents
            category_id: newDish.category_id,
            image_url: imageUrl,
            is_available: newDish.is_available,
          },
        ])
        .select(`
          *,
          category:categories (
            id,
            name
          )
        `)
        .single()

      if (error) throw error

      setDishes([data, ...dishes])
      setNewDish({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        is_available: true,
      })
      setSelectedImage(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error creating dish:", error)
    }
  }

  const handleUpdateDish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDish) return

    try {
      let imageUrl = editingDish.image_url

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      const { error } = await supabase
        .from("dishes")
        .update({
          name: editingDish.name,
          description: editingDish.description,
          price: editingDish.price,
          category_id: editingDish.category.id,
          image_url: imageUrl,
          is_available: editingDish.is_available,
        })
        .eq("id", editingDish.id)

      if (error) throw error

      setDishes(
        dishes.map((dish) =>
          dish.id === editingDish.id
            ? {
                ...editingDish,
                image_url: imageUrl,
              }
            : dish
        )
      )
      setEditingDish(null)
      setSelectedImage(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error updating dish:", error)
    }
  }

  const handleDeleteDish = async (id: string) => {
    if (!confirm("Are you sure you want to delete this dish?")) return

    try {
      const { error } = await supabase.from("dishes").delete().eq("id", id)

      if (error) throw error

      setDishes(dishes.filter((dish) => dish.id !== id))
    } catch (error) {
      console.error("Error deleting dish:", error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0])
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
        <h1 className="text-2xl font-semibold">Dishes</h1>
        <button
          onClick={() => {
            setEditingDish(null)
            setNewDish({
              name: "",
              description: "",
              price: "",
              category_id: "",
              image_url: "",
              is_available: true,
            })
            setIsModalOpen(true)
          }}
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark"
        >
          Add Dish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map((dish) => (
          <div key={dish.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-48">
              <Image
                src={dish.image_url || "/placeholder-dish.jpg"}
                alt={dish.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-semibold">{dish.name}</h2>
                  <p className="text-sm text-gray-500">{dish.category.name}</p>
                </div>
                <span className="text-lg font-semibold">
                  ${(dish.price / 100).toFixed(2)}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">{dish.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditingDish(dish)
                      setIsModalOpen(true)
                    }}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDish(dish.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    dish.is_available
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {dish.is_available ? "Available" : "Unavailable"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingDish ? "Edit Dish" : "Add Dish"}
            </h2>
            <form
              onSubmit={editingDish ? handleUpdateDish : handleCreateDish}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editingDish ? editingDish.name : newDish.name}
                  onChange={(e) =>
                    editingDish
                      ? setEditingDish({ ...editingDish, name: e.target.value })
                      : setNewDish({ ...newDish, name: e.target.value })
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
                  value={editingDish ? editingDish.description : newDish.description}
                  onChange={(e) =>
                    editingDish
                      ? setEditingDish({
                          ...editingDish,
                          description: e.target.value,
                        })
                      : setNewDish({ ...newDish, description: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={
                    editingDish
                      ? (editingDish.price / 100).toFixed(2)
                      : newDish.price
                  }
                  onChange={(e) =>
                    editingDish
                      ? setEditingDish({
                          ...editingDish,
                          price: parseFloat(e.target.value) * 100,
                        })
                      : setNewDish({ ...newDish, price: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={editingDish ? editingDish.category.id : newDish.category_id}
                  onChange={(e) =>
                    editingDish
                      ? setEditingDish({
                          ...editingDish,
                          category: {
                            id: e.target.value,
                            name:
                              categories.find((c) => c.id === e.target.value)
                                ?.name || "",
                          },
                        })
                      : setNewDish({ ...newDish, category_id: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingDish ? editingDish.is_available : newDish.is_available}
                  onChange={(e) =>
                    editingDish
                      ? setEditingDish({
                          ...editingDish,
                          is_available: e.target.checked,
                        })
                      : setNewDish({ ...newDish, is_available: e.target.checked })
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Available</label>
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
                  {editingDish ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 
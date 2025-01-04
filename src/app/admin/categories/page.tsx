'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Category {
  id: string
  name: string
  description: string | null
}

interface FormData {
  name: string
  description: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    checkUser()
    fetchCategories()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log("Auth check:", { session, error })
      
      if (error) {
        console.error("Auth error:", error)
        router.push('/admin/login')
        return
      }
      
      if (!session) {
        console.log("No session found")
        router.push('/admin/login')
        return
      }

      // Get user role
      const { data: userRole, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      console.log("User role check:", { userRole, roleError })

      if (roleError || !userRole || userRole.role !== 'admin') {
        console.log("User is not an admin")
        router.push('/admin/login')
        return
      }
    } catch (error) {
      console.error("Error checking session:", error)
      router.push('/admin/login')
    }
  }

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name")

      if (error) {
        console.error("Fetch error details:", error)
        throw error
      }

      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setError("Failed to fetch categories")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError("Category name is required")
      return
    }

    setError(null)
    
    try {
      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setError("You must be logged in to perform this action")
        router.push('/admin/login')
        return
      }

      // Check admin role
      const { data: userRole } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (!userRole || userRole.role !== 'admin') {
        setError("You must be an admin to perform this action")
        return
      }

      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null
      }

      let result;
      
      if (selectedCategory) {
        result = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", selectedCategory.id)
          .select()
          .single()
      } else {
        result = await supabase
          .from("categories")
          .insert([categoryData])
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      await fetchCategories()
      setIsDialogOpen(false)
      setFormData({ name: "", description: "" })
      setSelectedCategory(null)
      
    } catch (error: any) {
      console.error("Error saving category:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      let errorMessage = "Failed to save category. "
      if (error.message.includes("permission denied") || error.message.includes("policy")) {
        errorMessage = "You don't have permission to perform this action. Please ensure you are logged in as an admin."
      } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
        errorMessage = "A category with this name already exists."
      } else {
        errorMessage += error.message
      }
      
      setError(errorMessage)
      
      if (error.message?.includes("auth") || error.message?.includes("JWT")) {
        router.push('/admin/login')
      }
    }
  }

  const handleEdit = (category: Category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Delete error details:", error)
        throw error
      }

      // Fetch updated categories list
      await fetchCategories()
    } catch (error) {
      console.error("Error deleting category:", error)
      setError("Failed to delete category")
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            fetchCategories()
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <button
          onClick={() => {
            setSelectedCategory(null)
            setFormData({
              name: "",
              description: "",
            })
            setIsDialogOpen(true)
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Category
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  <button
                    onClick={() => handleEdit(category)}
                    className="text-blue-500 hover:text-blue-700 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {selectedCategory ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
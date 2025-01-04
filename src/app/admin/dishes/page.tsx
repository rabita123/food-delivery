"use client"

import { useState, useEffect, useRef } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Dish {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
  is_available: boolean
  categories?: {
    id: string
    name: string
  }
}

interface FormData {
  name: string
  description: string
  price: string
  category_id: string
  image_url: string
  is_available: boolean
}

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCategories()
    fetchDishes()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name")

      if (error) throw error

      setCategories(data || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      setError("Failed to fetch categories")
    }
  }

  const fetchDishes = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("dishes")
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .order("name")

      if (error) throw error

      setDishes(data || [])
    } catch (error) {
      console.error("Error fetching dishes:", error)
      setError("Failed to fetch dishes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('You must be logged in to upload images');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload a JPG, PNG, or GIF image.');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size too large. Please upload an image smaller than 5MB.');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const uniqueId = Math.random().toString(36).substring(2);
      const fileName = `${session.user.id}/dish_${uniqueId}_${Date.now()}.${fileExt}`;
      const bucketName = 'dishes';

      console.log('Starting image upload process...', {
        userId: session.user.id,
        fileName: fileName,
        fileType: file.type,
        fileSize: file.size
      });

      // Upload the file directly to the dishes bucket
      const { error: uploadError, data } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (uploadError.message.includes('policy')) {
          throw new Error('Permission denied. Please make sure you have the right access level.');
        }
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', data);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      if (!urlData.publicUrl) {
        console.error('Error: No public URL generated');
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('Public URL generated:', urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error: any) {
      console.error('Error in uploadImage:', {
        message: error.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack
      });
      throw new Error(error.message || 'Failed to upload image. Please try again.');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError("Dish name is required")
      return
    }

    if (!formData.price || isNaN(parseFloat(formData.price))) {
      setError("Valid price is required")
      return
    }

    if (!formData.category_id) {
      setError("Category is required")
      return
    }

    if (!imageFile && !formData.image_url) {
      setError("Image is required")
      return
    }

    setError(null)
    
    try {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("You must be logged in to perform this action")
        return
      }

      let imageUrl = formData.image_url
      
      // Upload new image if selected
      if (imageFile) {
        try {
          console.log('Uploading image...')
          imageUrl = await uploadImage(imageFile)
          console.log('Image uploaded successfully:', imageUrl)
        } catch (uploadError) {
          console.error('Image upload error:', uploadError)
          setError("Failed to upload image. Please try again.")
          return
        }
      }

      const dishData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category_id: formData.category_id,
        image_url: imageUrl,
        is_available: formData.is_available
      }

      console.log('Saving dish with data:', dishData)

      if (selectedDish) {
        console.log('Updating existing dish:', selectedDish.id)
        const { data, error } = await supabase
          .from("dishes")
          .update(dishData)
          .eq("id", selectedDish.id)
          .select()

        if (error) throw error
        console.log('Dish updated successfully:', data)
      } else {
        console.log('Creating new dish')
        const { data, error } = await supabase
          .from("dishes")
          .insert([dishData])
          .select()

        if (error) throw error
        console.log('Dish created successfully:', data)
      }

      await fetchDishes()
      setIsDialogOpen(false)
      setFormData({
        name: "",
        description: "",
        price: "",
        category_id: "",
        image_url: "",
        is_available: true
      })
      setImageFile(null)
      setImagePreview("")
      setSelectedDish(null)
    } catch (error: any) {
      console.error("Error saving dish:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      let errorMessage = "Failed to save dish. "
      if (error.message.includes("permission denied") || error.message.includes("policy")) {
        errorMessage += "You don't have permission to perform this action."
      } else if (error.message.includes("duplicate key") || error.message.includes("unique constraint")) {
        errorMessage += "A dish with this name already exists."
      } else if (error.message.includes("violates foreign key constraint")) {
        errorMessage += "Invalid category selected."
      } else {
        errorMessage += error.message
      }
      
      setError(errorMessage)
    }
  }

  const handleEdit = (dish: Dish) => {
    setSelectedDish(dish)
    setFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price.toString(),
      category_id: dish.category_id,
      image_url: dish.image_url,
      is_available: dish.is_available
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", id)

      if (error) throw error

      fetchDishes()
    } catch (error) {
      console.error("Error deleting dish:", error)
      setError("Failed to delete dish")
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
            fetchDishes()
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
        <h1 className="text-2xl font-bold">Manage Dishes</h1>
        <button
          onClick={() => {
            setSelectedDish(null)
            setFormData({
              name: "",
              description: "",
              price: "",
              category_id: "",
              image_url: "",
              is_available: true
            })
            setIsDialogOpen(true)
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add New Dish
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Price</th>
              <th className="px-6 py-3 text-left">Category</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dishes.map((dish) => (
              <tr key={dish.id} className="border-t">
                <td className="px-6 py-4">{dish.name}</td>
                <td className="px-6 py-4">${dish.price.toFixed(2)}</td>
                <td className="px-6 py-4">{dish.categories?.name || 'Unknown'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-sm ${dish.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {dish.is_available ? "Available" : "Unavailable"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleEdit(dish)}
                    className="text-blue-500 hover:text-blue-700 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dish.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedDish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
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
            <div>
              <label className="block text-sm font-medium mb-1">Price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <div className="flex flex-col items-center gap-4">
                {(imagePreview || formData.image_url) && (
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_available"
                checked={formData.is_available}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Available</label>
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
                {selectedDish ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
} 
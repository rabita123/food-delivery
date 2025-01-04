"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Save, User, Phone, MapPin, Mail, Lock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"

interface Profile {
  id: string
  full_name: string
  email: string
  phone_number: string
  address: string
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user found")

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setProfile(profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profile) return

    try {
      setUpdating(true)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          address: profile.address,
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })
        if (passwordError) throw passwordError
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      setNewPassword("")
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <Toast />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
          <p className="text-sm text-gray-500 mt-1">Update your personal details and contact information</p>
        </div>

        <form onSubmit={updateProfile} className="p-6">
          <div className="grid gap-6">
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                <Mail className="h-4 w-4 mr-2 text-gray-400" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500">Your email address cannot be changed</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="full_name" className="flex items-center text-sm font-medium text-gray-700">
                <User className="h-4 w-4 mr-2 text-gray-400" />
                Full Name
              </label>
              <input
                id="full_name"
                value={profile?.full_name || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setProfile(prev => prev ? { ...prev, full_name: e.target.value } : null)
                }
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700">
                <Phone className="h-4 w-4 mr-2 text-gray-400" />
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={profile?.phone_number || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setProfile(prev => prev ? { ...prev, phone_number: e.target.value } : null)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="flex items-center text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                Address
              </label>
              <input
                id="address"
                value={profile?.address || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  setProfile(prev => prev ? { ...prev, address: e.target.value } : null)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new_password" className="flex items-center text-sm font-medium text-gray-700">
                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                New Password
              </label>
              <input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button
              type="submit"
              variant="primary"
              isLoading={updating}
              leftIcon={<Save />}
              className="w-full sm:w-auto"
            >
              {updating ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 
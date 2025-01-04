'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database.types';
import Image from 'next/image';
import Link from 'next/link';

interface ValidationErrors {
  full_name?: string;
  phone_number?: string;
  address?: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile/edit');
      return;
    }
    loadProfile();
  }, [user, router]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Validate full name
    if (!profile.full_name?.trim()) {
      errors.full_name = 'Full name is required';
      isValid = false;
    } else if (profile.full_name.length < 2) {
      errors.full_name = 'Full name must be at least 2 characters long';
      isValid = false;
    }

    // Validate phone number
    if (profile.phone_number) {
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      if (!phoneRegex.test(profile.phone_number.trim())) {
        errors.phone_number = 'Please enter a valid phone number';
        isValid = false;
      }
    }

    // Validate address
    if (profile.address?.trim() && profile.address.length < 10) {
      errors.address = 'Please enter a complete address';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatar) return null;

    const fileExt = avatar.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;

    try {
      // Delete old avatar if exists
      if (profile.avatar_url) {
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([oldFileName]);
        }
      }

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatar);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      let avatarUrl = profile.avatar_url;
      if (avatar) {
        avatarUrl = await uploadAvatar(user.id);
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profile,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      setMessage('Profile updated successfully!');
      
      // Redirect to profile page after successful update
      setTimeout(() => {
        router.push('/profile');
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
            <Link
              href="/profile"
              className="text-orange-500 hover:text-orange-600"
            >
              Back to Profile
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-200">
            {error && (
              <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {message && (
              <div className="m-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}

            <div className="px-4 py-5 space-y-6 sm:px-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative h-24 w-24 rounded-full overflow-hidden">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-2xl">
                        {profile.full_name?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-orange-50 file:text-orange-700
                      hover:file:bg-orange-100"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                  </p>
                </div>
              </div>

              {/* Profile Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, full_name: e.target.value });
                      if (validationErrors.full_name) {
                        setValidationErrors({ ...validationErrors, full_name: undefined });
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500
                      ${validationErrors.full_name ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {validationErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone_number || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, phone_number: e.target.value });
                      if (validationErrors.phone_number) {
                        setValidationErrors({ ...validationErrors, phone_number: undefined });
                      }
                    }}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500
                      ${validationErrors.phone_number ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {validationErrors.phone_number && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone_number}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a valid phone number (e.g., +1234567890 or 123-456-7890)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    value={profile.address || ''}
                    onChange={(e) => {
                      setProfile({ ...profile, address: e.target.value });
                      if (validationErrors.address) {
                        setValidationErrors({ ...validationErrors, address: undefined });
                      }
                    }}
                    rows={3}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500
                      ${validationErrors.address ? 'border-red-300' : 'border-gray-300'}`}
                  />
                  {validationErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your complete delivery address
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
              <Link
                href="/profile"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
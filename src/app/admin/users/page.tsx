'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    phone_number: string | null;
    address: string | null;
    role: 'user' | 'admin';
  } | null;
  orders_count: number;
  total_spent: number;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('auth.users')
        .select(`
          *,
          profile:profiles(
            id,
            full_name,
            phone_number,
            address,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('profile.role', roleFilter);
      }

      const { data: usersData, error: usersError } = await query.returns<Omit<User, 'orders_count' | 'total_spent'>[]>();

      if (usersError) throw usersError;

      // Get orders count and total spent for each user
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', user.id);

          if (ordersError) throw ordersError;

          const total_spent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

          return {
            ...user,
            orders_count: orders?.length || 0,
            total_spent,
          };
        })
      );

      setUsers(usersWithStats);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.profile?.full_name.toLowerCase().includes(searchLower) ||
      user.profile?.phone_number?.toLowerCase().includes(searchLower) ||
      user.profile?.address?.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2B5B4F]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-[#2B5B4F] text-white rounded-lg hover:bg-[#234a40] transition-colors"
        >
          Refresh Users
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5B4F] focus:border-transparent"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5B4F] focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value="user">Users</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.profile?.full_name || 'No Name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.profile?.phone_number || 'No Phone'}</div>
                    <div className="text-sm text-gray-500">{user.profile?.address || 'No Address'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.profile?.role || 'user'}
                      onChange={(e) => updateUserRole(user.id, e.target.value as 'user' | 'admin')}
                      className="text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2B5B4F] focus:border-transparent"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.orders_count} orders
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${user.total_spent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setIsModalOpen(true);
                      }}
                      className="text-[#2B5B4F] hover:text-[#234a40]"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-lg max-w-lg w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">User Details</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Personal Information</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Name:</span> {selectedUser.profile?.full_name || 'No Name'}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Email:</span> {selectedUser.email}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Phone:</span> {selectedUser.profile?.phone_number || 'No Phone'}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Address:</span> {selectedUser.profile?.address || 'No Address'}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Account Information</h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Role:</span> {selectedUser.profile?.role}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Joined:</span> {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Total Orders:</span> {selectedUser.orders_count}
                    </p>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Total Spent:</span> ${selectedUser.total_spent.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#2B5B4F] text-white rounded-lg hover:bg-[#234a40] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
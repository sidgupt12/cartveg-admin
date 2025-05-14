'use client';
import { useState, useEffect, useRef } from 'react';
import { userService } from '@/services/superservice';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, Clock, Mail, Phone, MapPin, Package, User, CreditCard, ExternalLink } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "react-hot-toast";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
  const [isOrdersDialogOpen, setIsOrdersDialogOpen] = useState(false);
  const [selectedUserOrders, setSelectedUserOrders] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const addPopupRef = useRef(null);
  const updatePopupRef = useRef(null);
  const router = useRouter();
  const limit = 15;

  // Handle outside click to close popups
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isAddPopupOpen && addPopupRef.current && !addPopupRef.current.contains(event.target)) {
        setIsAddPopupOpen(false);
      }
      if (isUpdatePopupOpen && updatePopupRef.current && !updatePopupRef.current.contains(event.target)) {
        setIsUpdatePopupOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAddPopupOpen, isUpdatePopupOpen]);

  // Fetch users on mount and page change
  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchUsers = async (page) => {
    setLoading(true);
    try {
      const response = await userService.getUsers({ page, limit });
      setUsers(response.data || []);
      setCurrentPage(response.currentPage || 1);
      setTotalPages(response.totalPages || 1);
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        Cookies.remove('token');
        router.push('/login');
      } else {
        setError('Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user deletion
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setDeleteLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await userService.deleteUser({ id });
      setUsers(users.filter((user) => user._id !== id));
      if (filteredUsers.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchUsers(currentPage);
      }
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        Cookies.remove('token');
        router.push('/login');
      } else {
        setError('Failed to delete user');
      }
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Handle form submission for adding user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await userService.createUser(formData);
      setIsAddPopupOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
      });
      fetchUsers(currentPage);
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        Cookies.remove('token');
        router.push('/login');
      } else {
        setError('Failed to add user');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Handle form submission for updating user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await userService.updateUser({
        id: selectedUser._id,
        data: {
          name: formData.name,
          phone: formData.phone,
        },
      });
      setIsUpdatePopupOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
      });
      fetchUsers(currentPage);
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        Cookies.remove('token');
        router.push('/login');
      } else {
        setError('Failed to update user');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Open update popup with pre-filled data
  const openUpdatePopup = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
    setIsUpdatePopupOpen(true);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Add this new function
  const handleViewAllOrders = (orders) => {
    setSelectedUserOrders(orders);
    setIsOrdersDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage and monitor user accounts</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[300px]"
              />
            </div>
            <Button
              onClick={() => setIsAddPopupOpen(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-5 w-5 mr-2" /> Add User
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* User List */}
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <Card 
              key={user._id} 
              className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}
            >
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl font-semibold text-gray-900 truncate">{user.name}</h2>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {user.orders?.length || 0} Orders
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4 shrink-0" />
                          <span className="truncate">{user.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info("Credit functionality coming soon!");
                        }}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Add Credit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openUpdatePopup(user);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(user._id);
                        }}
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteLoading[user._id]}
                      >
                        {deleteLoading[user._id] ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </>
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedUser(expandedUser === user._id ? null : user._id);
                        }}
                      >
                        {expandedUser === user._id ? (
                          <ChevronUp className="h-5 w-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {expandedUser === user._id && (
                    <div className="mt-6 border-t border-gray-100 pt-6 animate-slide-down">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">User Details</h3>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600 break-all">ID: {user._id}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                                <span className="text-gray-600">Joined: {formatDate(user.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Recent Orders</h3>
                            {user.orders && user.orders.length > 0 ? (
                              <div className="space-y-2">
                                {user.orders.slice(0, 3).map((order, index) => (
                                  <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg">
                                    <span className="text-gray-600 truncate">Order #{order}</span>
                                    <Button variant="ghost" size="sm" className="h-6 px-2 shrink-0">
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                                {user.orders.length > 3 && (
                                  <Button 
                                    variant="link" 
                                    className="text-sm text-green-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewAllOrders(user.orders);
                                    }}
                                  >
                                    View all {user.orders.length} orders
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No orders yet</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Addresses</h3>
                            {user.addresses && user.addresses.length > 0 ? (
                              <div className="space-y-2">
                                {user.addresses.map((addr, index) => (
                                  <div key={index} className="text-sm bg-gray-50 p-2 rounded-lg">
                                    <p className="text-gray-600 break-words">{addr.flatno}, {addr.street}</p>
                                    <p className="text-gray-500 text-xs break-words">{addr.city}, {addr.state} - {addr.pincode}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No addresses available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className={currentPage === page ? "bg-green-600" : ""}
                >
                  {page}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Add User Dialog */}
        <Dialog open={isAddPopupOpen} onOpenChange={setIsAddPopupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  pattern="\d{10}"
                  title="Phone number must be 10 digits"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddPopupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Add User'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Update User Dialog */}
        <Dialog open={isUpdatePopupOpen} onOpenChange={setIsUpdatePopupOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="text"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUpdatePopupOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Update User'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Orders Dialog */}
        <Dialog open={isOrdersDialogOpen} onOpenChange={setIsOrdersDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>All Orders</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {selectedUserOrders.map((order, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">Order #{order}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserManagement;
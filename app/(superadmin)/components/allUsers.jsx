'use client';
import { useState, useEffect, useRef } from 'react';
import { userService } from '@/services/superservice';
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Search, Clock, Mail, Phone, MapPin, Package, User, X } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    addresses: [{ flatno: '', street: '', city: '', state: '', pincode: '' }],
    isActivate: true,
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
  const limit = 15; // Set limit to 15 users per page

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
      // Refetch if the page might be empty
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
        addresses: [{ flatno: '', street: '', city: '', state: '', pincode: '' }],
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
          isActivate: formData.isActivate,
          addresses: formData.addresses,
        },
      });
      setIsUpdatePopupOpen(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        addresses: [{ flatno: '', street: '', city: '', state: '', pincode: '' }],
        isActivate: true,
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
      addresses: user.addresses.length
        ? user.addresses
        : [{ flatno: '', street: '', city: '', state: '', pincode: '' }],
      isActivate: user.isActivate ?? true,
    });
    setIsUpdatePopupOpen(true);
  };

  // Add a new address field
  const addAddress = () => {
    setFormData({
      ...formData,
      addresses: [
        ...formData.addresses,
        { flatno: '', street: '', city: '', state: '', pincode: '' },
      ],
    });
  };

  // Remove an address field
  const removeAddress = (index) => {
    if (formData.addresses.length === 1) {
      setError('At least one address is required');
      return;
    }
    setFormData({
      ...formData,
      addresses: formData.addresses.filter((_, i) => i !== index),
    });
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

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-green-600 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => setIsAddPopupOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-md"
            >
              <Plus className="h-5 w-5" /> Add User
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* User List */}
        <div className="grid gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 transition-transform hover:scale-[1.01]"
            >
              {/* Collapsed View */}
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setExpandedUser(expandedUser === user._id ? null : user._id)
                }
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600 text-sm">{user.email}</p>
                  <p className="text-gray-600 text-sm">{user.phone}</p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openUpdatePopup(user);
                    }}
                    className="text-green-600 hover:text-green-800 transition"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(user._id);
                    }}
                    className="text-red-600 hover:text-red-800 transition"
                    disabled={deleteLoading[user._id]}
                  >
                    {deleteLoading[user._id] ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                  {expandedUser === user._id ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              </div>

              {/* Expanded View */}
              {expandedUser === user._id && (
                <div className="mt-6 border-t border-gray-200 pt-6 animate-slide-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">ID</p>
                        <p>{user._id}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Email</p>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Phone</p>
                        <p>{user.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Created At</p>
                        <p>{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Updated At</p>
                        <p>{formatDate(user.updatedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Orders</p>
                        <p>{user.orders.length > 0 ? user.orders.join(', ') : 'None'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">FCM Tokens</p>
                        <p>{user.fcmTokens.length > 0 ? user.fcmTokens.join(', ') : 'None'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">Active</p>
                        <p>
                          {user.isActivate ? (
                            <span className="text-green-600 font-medium">Yes</span>
                          ) : (
                            <span className="text-red-600 font-medium">No</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="font-medium text-gray-900">Addresses</p>
                    {user.addresses.length > 0 ? (
                      user.addresses.map((addr, index) => (
                        <div
                          key={index}
                          className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <p className="font-medium">Address {index + 1}</p>
                          <p>{addr.flatno}, {addr.street}</p>
                          <p>
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 mt-2">No addresses available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } transition`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add User Popup */}
        {isAddPopupOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div
              ref={addPopupRef}
              className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 max-h-[80vh] overflow-y-auto animate-scale-in"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New User</h2>
              <form onSubmit={handleAddUser}>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                  required
                />
                <input
                  type="text"
                  placeholder="Phone (10 digits)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                  required
                  pattern="\d{10}"
                  title="Phone number must be 10 digits"
                />
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">Addresses</h3>
                  <button
                    type="button"
                    onClick={addAddress}
                    className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm transition"
                  >
                    <Plus className="h-4 w-4" /> Add Address
                  </button>
                </div>
                {formData.addresses.map((addr, index) => (
                  <div
                    key={index}
                    className="mb-3 p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="font-medium text-sm mb-2 text-gray-800">Address {index + 1}</p>
                    <input
                      type="text"
                      placeholder="Flat No"
                      value={addr.flatno}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].flatno = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Street"
                      value={addr.street}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].street = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={addr.city}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].city = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addr.state}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].state = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={addr.pincode}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].pincode = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                      required
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddPopupOpen(false)}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 transition text-sm font-medium flex items-center gap-2"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Add User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Update User Popup */}
        {isUpdatePopupOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div
              ref={updatePopupRef}
              className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 max-h-[80vh] overflow-y-auto animate-scale-in"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Update User</h2>
              <form onSubmit={handleUpdateUser}>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                />
                <label className="flex items-center mb-3 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.isActivate}
                    onChange={(e) =>
                      setFormData({ ...formData, isActivate: e.target.checked })
                    }
                    className="mr-2 accent-green-600"
                  />
                  Active
                </label>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium text-gray-900 text-sm">Addresses</h3>
                  <button
                    type="button"
                    onClick={addAddress}
                    className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm transition"
                  >
                    <Plus className="h-4 w-4" /> Add Address
                  </button>
                </div>
                {formData.addresses.map((addr, index) => (
                  <div
                    key={index}
                    className="mb-3 p-3 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition relative"
                  >
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="font-medium text-sm mb-2 text-gray-800">Address {index + 1}</p>
                    <input
                      type="text"
                      placeholder="Flat No"
                      value={addr.flatno}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].flatno = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Street"
                      value={addr.street}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].street = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={addr.city}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].city = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={addr.state}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].state = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={addr.pincode}
                      onChange={(e) => {
                        const newAddresses = [...formData.addresses];
                        newAddresses[index].pincode = e.target.value;
                        setFormData({ ...formData, addresses: newAddresses });
                      }}
                      className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsUpdatePopupOpen(false)}
                    className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 transition text-sm font-medium flex items-center gap-2"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Update User'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Animation Styles */}
        <style jsx>{`
          @keyframes slide-down {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default UserManagement;
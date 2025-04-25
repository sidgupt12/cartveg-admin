'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { storeService } from '@/services/superservice';
import { Plus, Search } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import CreateAdminForm from './CreateAdminForm';
import AssignManagerForm from './AssignManagerForm';
import StoreCard from './StoreCard';

// Dynamically import StoreForm with SSR disabled
const StoreForm = dynamic(() => import('./StoreForm'), { ssr: false });

const StoreAdminManagement = () => {
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateAdminPopupOpen, setIsCreateAdminPopupOpen] = useState(false);
  const [isCreateStorePopupOpen, setIsCreateStorePopupOpen] = useState(false);
  const [isEditStorePopupOpen, setIsEditStorePopupOpen] = useState(false);
  const [isAssignManagerPopupOpen, setIsAssignManagerPopupOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const router = useRouter();

  // Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      try {
        const response = await storeService.getStores({ page: currentPage, limit });
        setStores(response.data.stores || []);
        setCurrentPage(response.data.pagination.currentPage || 1);
        setTotalPages(response.data.pagination.totalPages || 1);
      } catch (err) {
        if (err.message.includes('Unauthorized')) {
          setError('Session expired. Please log in again.');
          Cookies.remove('token');
          router.push('/login');
        } else {
          setError('Failed to fetch stores');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, [currentPage, router]);

  // Filter stores by search query
  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Store & Admin Management</h1>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-green-600 h-5 w-5" />
              <input
                type="text"
                placeholder="Search stores by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => setIsCreateAdminPopupOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-md"
            >
              <Plus className="h-5 w-5" /> Create Admin
            </button>
            <button
              onClick={() => setIsCreateStorePopupOpen(true)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-md"
            >
              <Plus className="h-5 w-5" /> Create Store
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

        {/* Store List */}
        <div className="grid gap-6">
          {filteredStores.map((store) => (
            <StoreCard
              key={store._id}
              store={store}
              onEdit={() => {
                setSelectedStore(store);
                setIsEditStorePopupOpen(true);
              }}
              onAssignManager={() => {
                setSelectedStore(store);
                setIsAssignManagerPopupOpen(true);
              }}
            />
          ))}
        </div>

        {/* Pagination */}
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

        {/* Popups */}
        {isCreateAdminPopupOpen && (
          <CreateAdminForm
            onClose={() => setIsCreateAdminPopupOpen(false)}
            onSuccess={() => setIsCreateAdminPopupOpen(false)}
            setError={setError}
          />
        )}
        {isCreateStorePopupOpen && (
          <StoreForm
            onClose={() => setIsCreateStorePopupOpen(false)}
            onSuccess={() => {
              setIsCreateStorePopupOpen(false);
              handlePageChange(currentPage);
            }}
            setError={setError}
          />
        )}
        {isEditStorePopupOpen && selectedStore && (
          <StoreForm
            store={selectedStore}
            onClose={() => setIsEditStorePopupOpen(false)}
            onSuccess={() => {
              setIsEditStorePopupOpen(false);
              handlePageChange(currentPage);
            }}
            setError={setError}
          />
        )}
        {isAssignManagerPopupOpen && selectedStore && (
          <AssignManagerForm
            storeId={selectedStore._id}
            onClose={() => setIsAssignManagerPopupOpen(false)}
            onSuccess={() => setIsAssignManagerPopupOpen(false)}
            setError={setError}
          />
        )}

        {/* Custom Animation Styles */}
        <style jsx>{`
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
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
};

export default StoreAdminManagement;
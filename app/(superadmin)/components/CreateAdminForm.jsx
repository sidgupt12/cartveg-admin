import { useState, useRef, useEffect } from 'react';
import { storeService } from '@/services/superservice';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

const CreateAdminForm = ({ onClose, onSuccess, setError }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'superadmin',
    storeId: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const popupRef = useRef(null);
  const router = useRouter();

  // Handle outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await storeService.createAdmin(formData);
      setFormData({ name: '', email: '', password: '', role: 'superadmin', storeId: '' });
      onSuccess();
    } catch (err) {
      if (err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        Cookies.remove('token');
        router.push('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/50">
      <div
        ref={popupRef}
        className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-5 max-h-[80vh] overflow-y-auto animate-scale-in"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Admin</h2>
        <form onSubmit={handleSubmit}>
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
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
            required
          />
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value, storeId: '' })}
            className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
            required
          >
            <option value="superadmin">Superadmin</option>
            <option value="storemanager">Store Manager</option>
          </select>
          {formData.role === 'storemanager' && (
            <input
              type="text"
              placeholder="Store ID"
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              className="w-full p-2.5 mb-2 border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all"
              required
            />
          )}
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
              disabled={formLoading}
            >
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Admin'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAdminForm;
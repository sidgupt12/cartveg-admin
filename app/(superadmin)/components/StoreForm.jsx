'use client';
import { useState, useRef, useEffect } from 'react';
import { storeService } from '@/services/superservice';
import { MapPin, Search, Home, Map, Phone, Mail, Circle } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

// Custom marker icon (using CDN for reliability)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const StoreForm = ({ store, onClose, onSuccess, setError }) => {
  const isEdit = !!store;
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: {
      flatno: store?.address?.flatno || '',
      street: store?.address?.street || '',
      city: store?.address?.city || '',
      state: store?.address?.state || '',
      pincode: store?.address?.pincode || '',
    },
    phone: store?.phone || '',
    email: store?.email || '',
    latitude: store?.latitude || 20.5937, // Default to India
    longitude: store?.longitude || 78.9629,
    radius: store?.radius || '',
  });
  const [originalData] = useState(formData); // For edit mode to track changes
  const [mapCenter, setMapCenter] = useState([formData.latitude, formData.longitude]);
  const [markerPosition, setMarkerPosition] = useState([formData.latitude, formData.longitude]);
  const [isMapExpanded, setIsMapExpanded] = useState(false); // Map expansion state
  const [searchQuery, setSearchQuery] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const popupRef = useRef(null);
  const mapRef = useRef(null); // Reference to Leaflet map
  const router = useRouter();

  // Handle outside click to close popup
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose]);

  // Invalidate map size after popup animation
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 300); // Match popup animation duration
    }
  }, [isMapExpanded]);

  // Reset map state when popup opens
  useEffect(() => {
    setMapCenter([formData.latitude, formData.longitude]);
    setMarkerPosition([formData.latitude, formData.longitude]);
    setIsMapExpanded(false);
  }, [formData.latitude, formData.longitude]);

  // Map events component
  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        setMarkerPosition([e.latlng.lat, e.latlng.lng]);
        setFormData((prev) => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }));
        setIsMapExpanded(true); // Expand map on click
      },
    });
    mapRef.current = map; // Store map instance
    useEffect(() => {
      map.setView(mapCenter, map.getZoom());
    }, [mapCenter, map]);
    return null;
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQuery,
          format: 'json',
          limit: 1,
        },
        headers: { 'User-Agent': 'StoreAdminApp/1.0' },
      });
      if (response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        setMarkerPosition([parseFloat(lat), parseFloat(lon)]);
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }));
        setIsMapExpanded(true); // Expand map after search
      } else {
        setError('Address not found');
      }
    } catch (err) {
      setError('Failed to search address');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (isEdit) {
        // Only send changed fields
        const updatedData = {};
        if (formData.name !== originalData.name) updatedData.name = formData.name;
        if (
          formData.address.flatno !== originalData.address.flatno ||
          formData.address.street !== originalData.address.street ||
          formData.address.city !== originalData.address.city ||
          formData.address.state !== originalData.address.state ||
          formData.address.pincode !== originalData.address.pincode
        ) {
          updatedData.address = formData.address;
        }
        if (formData.phone !== originalData.phone) updatedData.phone = formData.phone;
        if (formData.email !== originalData.email) updatedData.email = formData.email;
        if (formData.latitude !== originalData.latitude) updatedData.latitude = formData.latitude;
        if (formData.longitude !== originalData.longitude) updatedData.longitude = formData.longitude;
        if (formData.radius !== originalData.radius) updatedData.radius = formData.radius;

        if (Object.keys(updatedData).length > 0) {
          await storeService.updateStore({ storeId: store._id, data: updatedData });
        }
      } else {
        await storeService.createStore(formData);
      }
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
    <div className="fixed inset-0 flex items-center justify-center p-6 bg-black/70 z-50">
      <div
        ref={popupRef}
        className="w-full max-w-3xl bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-h-[95vh] overflow-y-auto animate-scale-in"
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Home className="h-6 w-6 text-green-600" />
          {isEdit ? 'Edit Store' : 'Create Store'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Store Details Section */}
          <div className="space-y-6 bg-white/50 p-6 rounded-2xl shadow-inner">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Circle className="h-4 w-4 text-green-600" />
              Store Information
            </h3>
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                Store Name
              </label>
              <input
                type="text"
                placeholder="Enter store name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                required={!isEdit}
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-6 bg-white/50 p-6 rounded-2xl shadow-inner">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Flat No
                </label>
                <input
                  type="text"
                  placeholder="Enter flat number"
                  value={formData.address.flatno}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, flatno: e.target.value },
                    })
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Street
                </label>
                <input
                  type="text"
                  placeholder="Enter street"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  State
                </label>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={formData.address.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, state: e.target.value },
                    })
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Pincode
                </label>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={formData.address.pincode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, pincode: e.target.value },
                    })
                  }
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                  pattern="\d{6}"
                  title="Pincode must be 6 digits"
                />
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="space-y-6 bg-white/50 p-6 rounded-2xl shadow-inner">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Phone
                </label>
                <input
                  type="text"
                  placeholder="Enter 10-digit phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                  pattern="\d{10}"
                  title="Phone number must be 10 digits"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required={!isEdit}
                />
              </div>
            </div>
            <div className="relative">
              <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                Radius (meters)
              </label>
              <input
                type="number"
                placeholder="Enter radius"
                value={formData.radius}
                onChange={(e) => setFormData({ ...formData, radius: parseFloat(e.target.value) || '' })}
                className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                required={!isEdit}
                min="0"
                step="0.1"
              />
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-6 bg-white/50 p-6 rounded-2xl shadow-inner">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Map className="h-4 w-4 text-green-600" />
              Store Location
            </h3>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-green-600 h-5 w-5" />
              <input
                type="text"
                placeholder="Search location to center map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <div className={`transition-all duration-300 ${isMapExpanded ? 'h-[400px]' : 'h-[200px]'}`}>
              <MapContainer
                center={mapCenter}
                zoom={isMapExpanded ? 12 : 4}
                style={{ height: '100%', width: '100%' }}
                className="rounded-xl border border-gray-200 shadow-sm"
                zoomControl={isMapExpanded}
                scrollWheelZoom={isMapExpanded}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Geocoding by Nominatim'
                />
                {markerPosition[0] !== 0 && markerPosition[1] !== 0 && (
                  <Marker
                    position={markerPosition}
                    draggable={isMapExpanded}
                    icon={DefaultIcon}
                    eventHandlers={{
                      dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        setMarkerPosition([lat, lng]);
                        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                      },
                    }}
                  />
                )}
                <MapEvents />
              </MapContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Latitude
                </label>
                <input
                  type="number"
                  placeholder="Enter latitude"
                  value={formData.latitude}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({ ...prev, latitude: lat }));
                    setMarkerPosition([lat, markerPosition[1]]);
                    setMapCenter([lat, markerPosition[1]]);
                  }}
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required
                  step="0.0001"
                />
              </div>
              <div className="relative">
                <label className="absolute -top-2 left-3 bg-white/90 px-2 text-sm font-medium text-gray-600">
                  Longitude
                </label>
                <input
                  type="number"
                  placeholder="Enter longitude"
                  value={formData.longitude}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({ ...prev, longitude: lng }));
                    setMarkerPosition([markerPosition[0], lng]);
                    setMapCenter([markerPosition[0], lng]);
                  }}
                  className="w-full p-4 border border-gray-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-green-600 text-sm transition-all shadow-sm hover:shadow-md"
                  required
                  step="0.0001"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition text-sm font-medium shadow-sm hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-lg"
              disabled={formLoading}
            >
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isEdit ? 'Update Store' : 'Create Store'}
                  <Circle className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreForm;
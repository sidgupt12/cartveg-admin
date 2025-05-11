'use client';
import { useState, useRef, useEffect } from 'react';
import { storeService } from '@/services/superservice'; // Ensure this path is correct
import { MapPin, Search, Home, Map, Phone, Mail, Circle, Maximize2, Minimize2, Navigation } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
// Make sure react-leaflet and leaflet are installed
// yarn add react-leaflet leaflet
// yarn add -D @types/leaflet (if using TypeScript)
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';

// Default Leaflet marker icon setup (ensure assets are available or use CDN)
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
  shadowSize: [41, 41]
});

// --- StoreForm Component ---
const StoreForm = ({ store, onClose, onSuccess, setError }) => {
  const isEdit = !!store;
  const router = useRouter();

  // Initial form state setup
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
    latitude: store?.latitude || 20.5937, // Default initial center (e.g., India)
    longitude: store?.longitude || 78.9629,
    radius: store?.radius || '',
  });
  const [originalData] = useState(formData); // For tracking changes in edit mode

  // Map related state
  // `initialMapCenter` is used ONLY for the initial map view, not for controlling it later
  const [initialMapCenter] = useState([formData.latitude, formData.longitude]);
  const [markerPosition, setMarkerPosition] = useState([formData.latitude, formData.longitude]);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null); // To store the Leaflet map instance

  // Other state
  const [formLoading, setFormLoading] = useState(false);
  const popupRef = useRef(null);

  // Handle click outside the form to close it (only when not expanded)
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isMapExpanded) return; // Don't close if map is expanded
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [onClose, isMapExpanded]);

  // Invalidate map size after expanding/collapsing to ensure it renders correctly
   useEffect(() => {
    if (mapRef.current) {
      // Delay slightly to allow CSS transitions to finish
      const timer = setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 310); // Adjust timing if needed (e.g., slightly longer than animation duration)
      return () => clearTimeout(timer);
    }
  }, [isMapExpanded]);

  // Reset form and marker state if the `store` prop changes (e.g., opening edit for a different store)
  useEffect(() => {
    const lat = store?.latitude || 20.5937;
    const lng = store?.longitude || 78.9629;
    setFormData({
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
      latitude: lat,
      longitude: lng,
      radius: store?.radius || '',
    });
    setMarkerPosition([lat, lng]);
    // We don't forcefully reset the map's view here;
    // it might be better to pan to the new location if the map instance exists
    if (mapRef.current) {
        mapRef.current.panTo([lat, lng]);
    }
    // Reset map expansion state if needed
    // setIsMapExpanded(false);
  }, [store]); // Dependency array includes store


  // --- Leaflet Map Event Handling Component ---
  const MapEvents = () => {
    const map = useMap(); // Hook to get the map instance from MapContainer context

    // Store the map instance in our ref when it's ready
    useEffect(() => {
        mapRef.current = map;
    }, [map]);

    useMapEvents({
      click(e) {
        // When map is clicked:
        // 1. Update the marker's position
        setMarkerPosition([e.latlng.lat, e.latlng.lng]);
        // 2. Update the latitude/longitude in the form data
        setFormData((prev) => ({
          ...prev,
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        }));
        // **Important:** Do NOT change the map's view (center/zoom) here.
        // Let the user pan/zoom independently after placing the marker.
      },
      // Optional: Handle map dragging if needed
      // dragend() {
      //   // console.log('Map drag ended:', map.getCenter(), map.getZoom());
      // },
      // Optional: Handle zoom changes if needed
      // zoomend() {
      //   // console.log('Map zoom ended:', map.getZoom());
      // }
    });

    // No need for useEffect to force setView based on state changes
    return null; // This component doesn't render anything itself
  };


  // --- Handle Address Search using Nominatim ---
  const handleSearch = async () => {
    if (!searchQuery) {
        setError("Please enter an address to search.");
        return;
    }
    // Ensure map instance is available before trying to change its view
    if (!mapRef.current) {
        setError("Map is not initialized yet.");
        return;
    }

    setError(''); // Clear previous errors

    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: searchQuery,
          format: 'json',
          limit: 1, // Get the best match
          addressdetails: 1, // Request address details (optional)
        },
        headers: {
            // Nominatim requires a User-Agent header
            'User-Agent': `StoreAdminApp/1.0 (${window.location.href})`
        },
      });

      if (response.data && response.data.length > 0) {
        const { lat, lon, address } = response.data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);

        // --- This is the crucial part for moving the map ---
        // Use the map instance directly to fly or set the view.
        // setView instantly changes the view (keeps current zoom).
        // flyTo provides a smooth animation (might change zoom if needed).
        mapRef.current.flyTo([newLat, newLng], mapRef.current.getZoom() > 14 ? mapRef.current.getZoom() : 14); // Fly to location, zoom in if needed

        // Update the marker position
        setMarkerPosition([newLat, newLng]);

        // Update form data (including address fields if desired)
        setFormData((prev) => ({
          ...prev,
          latitude: newLat,
          longitude: newLng,
          // Optionally auto-fill address fields from Nominatim response
          // address: {
          //   ...prev.address,
          //   street: address?.road || prev.address.street,
          //   city: address?.city || address?.town || address?.village || prev.address.city,
          //   state: address?.state || prev.address.state,
          //   pincode: address?.postcode || prev.address.pincode,
          // },
        }));

      } else {
        setError(`Address not found for: "${searchQuery}"`);
      }
    } catch (err) {
      console.error("Nominatim search error:", err);
      setError('Failed to search address. Check network connection or try again.');
    }
  };


  // --- Handle Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(''); // Clear previous errors

    try {
      if (isEdit) {
        // --- Edit Logic: Only send changed fields ---
        const updatedData = {};
        if (formData.name !== originalData.name) updatedData.name = formData.name;
        if (JSON.stringify(formData.address) !== JSON.stringify(originalData.address)) {
          updatedData.address = formData.address;
        }
        if (formData.phone !== originalData.phone) updatedData.phone = formData.phone;
        if (formData.email !== originalData.email) updatedData.email = formData.email;
        if (formData.latitude !== originalData.latitude) updatedData.latitude = formData.latitude;
        if (formData.longitude !== originalData.longitude) updatedData.longitude = formData.longitude;
        // Ensure radius is sent as a number
        const newRadius = parseFloat(formData.radius);
        if (newRadius !== parseFloat(originalData.radius)) {
            updatedData.radius = isNaN(newRadius) ? 0 : newRadius; // Handle potential NaN
        }


        if (Object.keys(updatedData).length > 0) {
          console.log("Updating store with:", updatedData);
          await storeService.updateStore({ storeId: store._id, data: updatedData });
          onSuccess('Store updated successfully!'); // Pass success message
        } else {
          onSuccess('No changes detected.'); // Inform user if nothing changed
          onClose(); // Close form if no changes
        }
      } else {
        // --- Create Logic: Send all data ---
        console.log("Creating store with:", formData);
        // Ensure radius is a number before sending
        const dataToSend = {
            ...formData,
            radius: parseFloat(formData.radius) || 0
        };
        await storeService.createStore(dataToSend);
        onSuccess('Store created successfully!'); // Pass success message
      }
      // onSuccess callback might handle closing the form
    } catch (err) {
      console.error("Form submission error:", err);
      // Handle specific errors like Unauthorized
      if (err.message && err.message.includes('Unauthorized')) {
        setError('Session expired. Please log in again.');
        Cookies.remove('token'); // Assuming you use cookies for token
        router.push('/login'); // Redirect to login
      } else {
        // Use a more user-friendly message from the error if available
        setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Prevent Enter key press in input fields from submitting the form accidentally
  const preventEnterSubmit = (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
      e.preventDefault();
      // Optional: Move focus to the next input or trigger search if in search field
      // if (e.target.placeholder === 'Search location...') {
      //     handleSearch();
      // }
    }
  };

  // Add getCurrentLocation function
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setError(''); // Clear any previous errors
    
    // Force a new location request by setting enableHighAccuracy to true
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0 // Force a new location request
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Update marker position
        setMarkerPosition([latitude, longitude]);
        // Update form data
        setFormData(prev => ({
          ...prev,
          latitude,
          longitude
        }));
        // Pan map to location
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 14);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError('Unable to retrieve your location. Please check your location permissions.');
      },
      options // Add the options to force a new location request
    );
  };

  // --- JSX Rendering ---
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/70 z-50 backdrop-blur-sm">

      {/* --- Full-Screen Map Modal --- */}
      {isMapExpanded && (
        <div className="fixed inset-0 z-60 bg-white"> {/* Use white or a map-friendly bg */}
          <MapContainer
            // No 'key' prop needed here to prevent remounts
            center={markerPosition} // Center on current marker when opened
            zoom={mapRef.current?.getZoom() || 14} // Use current zoom or default
            style={{ height: '100vh', width: '100vw' }}
            zoomControl={true}
            scrollWheelZoom={true}
            touchZoom={true}
            dragging={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Geocoding by Nominatim'
            />
            {/* Marker is draggable in full-screen mode */}
            {markerPosition[0] !== 0 && markerPosition[1] !== 0 && (
              <Marker
                position={markerPosition}
                draggable={true}
                icon={DefaultIcon}
                eventHandlers={{
                  dragend: (e) => { // Update state when marker dragging stops
                    const { lat, lng } = e.target.getLatLng();
                    setMarkerPosition([lat, lng]);
                    setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                  },
                }}
              />
            )}
            {/* MapEvents handles clicks and gives access to map instance */}
            <MapEvents />
          </MapContainer>

          {/* Controls Overlay for Full-Screen Map */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-[1000]"> {/* Ensure controls are above map tiles */}
            {/* Search Bar */}
            <div className="relative flex items-center w-full max-w-md bg-white/90 rounded-xl shadow-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 h-5 w-5" />
              <input
                type="text"
                placeholder="Search location to center map..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(); // Trigger search on Enter
                  }
                }}
                className="w-full pl-12 pr-16 py-3 border border-transparent rounded-xl bg-transparent focus:outline-none focus:ring-2 focus:ring-green-600 text-sm"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition"
                aria-label="Search location"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            {/* Location and Minimize Buttons */}
            <div className="flex gap-2 ml-4">
              <button
                type="button"
                onClick={getCurrentLocation}
                className="bg-green-600 text-white px-4 py-3 rounded-xl hover:bg-green-700 transition shadow-lg flex items-center gap-2"
                aria-label="Get current location"
              >
                <Navigation className="h-5 w-5" />
                <span className="text-sm font-medium">Current Location</span>
              </button>
              <button
                type="button"
                onClick={() => setIsMapExpanded(false)}
                className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 transition shadow-lg"
                aria-label="Minimize map"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Form Popup --- */}
      {/* Hidden when map is expanded using CSS class toggle */}
      <div
        ref={popupRef}
        className={`w-full max-w-3xl bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[95vh] overflow-y-auto transition-opacity duration-300 ease-in-out ${
          isMapExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        // This style ensures smooth hide/show without using 'hidden' which breaks animations
        style={{ transform: isMapExpanded ? 'scale(0.95)' : 'scale(1)' }}
      >
        {/* Form Header */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 flex items-center gap-3">
          <Home className="h-6 w-6 text-green-600" />
          {isEdit ? 'Edit Store Details' : 'Create New Store'}
        </h2>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

          {/* Store Information Section */}
          <div className="space-y-5 bg-gray-50/50 p-4 sm:p-6 rounded-2xl shadow-inner border border-gray-200/80">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-4 border-gray-200">
              <Circle className="h-4 w-4 text-green-500" />
              Store Information
            </h3>
            <div className="relative">
              <label htmlFor="storeName" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Store Name</label>
              <input
                id="storeName"
                type="text"
                placeholder="Enter store name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyPress={preventEnterSubmit}
                className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md"
                required={!isEdit} // Required only when creating
              />
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-5 bg-gray-50/50 p-4 sm:p-6 rounded-2xl shadow-inner border border-gray-200/80">
             <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-4 border-gray-200">
               <MapPin className="h-4 w-4 text-green-500" />
               Address
             </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              {/* Flat No */}
              <div className="relative">
                <label htmlFor="flatNo" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Flat No / Building</label>
                <input id="flatNo" type="text" placeholder="e.g., 12B, Ashoka Tower" value={formData.address.flatno} onChange={(e) => setFormData({...formData, address: {...formData.address, flatno: e.target.value}})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit}/>
              </div>
              {/* Street */}
              <div className="relative">
                 <label htmlFor="street" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Street / Area</label>
                 <input id="street" type="text" placeholder="e.g., MG Road, Sector 5" value={formData.address.street} onChange={(e) => setFormData({...formData, address: {...formData.address, street: e.target.value}})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit}/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
               {/* City */}
              <div className="relative">
                 <label htmlFor="city" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">City</label>
                 <input id="city" type="text" placeholder="e.g., Mumbai" value={formData.address.city} onChange={(e) => setFormData({...formData, address: {...formData.address, city: e.target.value}})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit}/>
              </div>
              {/* State */}
              <div className="relative">
                 <label htmlFor="state" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">State</label>
                 <input id="state" type="text" placeholder="e.g., Maharashtra" value={formData.address.state} onChange={(e) => setFormData({...formData, address: {...formData.address, state: e.target.value}})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit}/>
              </div>
              {/* Pincode */}
              <div className="relative">
                 <label htmlFor="pincode" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Pincode</label>
                 <input id="pincode" type="text" placeholder="e.g., 400001" value={formData.address.pincode} onChange={(e) => setFormData({...formData, address: {...formData.address, pincode: e.target.value}})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit} pattern="\d{6}" title="Pincode must be 6 digits"/>
              </div>
            </div>
          </div>

          {/* Contact & Radius Section */}
          <div className="space-y-5 bg-gray-50/50 p-4 sm:p-6 rounded-2xl shadow-inner border border-gray-200/80">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-4 border-gray-200">
              <Phone className="h-4 w-4 text-green-500" />
              Contact & Radius
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
               {/* Phone */}
               <div className="relative">
                 <label htmlFor="phone" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Phone Number</label>
                 <input id="phone" type="tel" placeholder="Enter 10-digit phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit} pattern="\d{10}" title="Phone number must be 10 digits"/>
               </div>
               {/* Email */}
               <div className="relative">
                 <label htmlFor="email" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Email Address</label>
                 <input id="email" type="email" placeholder="Enter email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit}/>
               </div>
            </div>
            {/* Radius */}
            <div className="relative">
               <label htmlFor="radius" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Service Radius (Kilometers)</label>
               <input id="radius" type="number" placeholder="Enter radius in Kilometers" value={formData.radius} onChange={(e) => setFormData({...formData, radius: e.target.value})} onKeyPress={preventEnterSubmit} className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md" required={!isEdit} min="0" step="1"/>
             </div>
          </div>

          {/* Map Location Section */}
          <div className="space-y-5 bg-gray-50/50 p-4 sm:p-6 rounded-2xl shadow-inner border border-gray-200/80">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2 border-b pb-2 mb-4 border-gray-200">
              <Map className="h-4 w-4 text-green-500" />
              Store Location (Pin on Map)
            </h3>
            <div className="space-y-4">
              {/* Search and Expand Button Row */}
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Search Input */}
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 h-5 w-5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search address to locate on map..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                    className="w-full pl-12 pr-16 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md"
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition"
                    aria-label="Search location"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                {/* Expand Button */}
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(true)}
                  className="w-full sm:w-auto bg-green-600 text-white px-5 py-3 rounded-xl hover:bg-green-700 transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm font-medium"
                  aria-label="Expand map"
                >
                  <Maximize2 className="h-4 w-4" />
                  Expand Map
                </button>
              </div>

              {/* Small Embedded Map */}
              <div className="h-[250px] rounded-xl overflow-hidden border border-gray-300 shadow-sm relative">
                <MapContainer
                  // No 'key' prop needed
                  center={initialMapCenter} // Initial center
                  zoom={5} // Default zoom for small map
                  style={{ height: '100%', width: '100%' }}
                  zoomControl={false} // Keep controls minimal on small map
                  scrollWheelZoom={true} // Allow interaction
                  touchZoom={true}
                  dragging={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {/* Marker is NOT draggable in small view */}
                  {markerPosition[0] !== 0 && markerPosition[1] !== 0 && (
                    <Marker
                      position={markerPosition}
                      draggable={false} // Usually false for preview
                      icon={DefaultIcon}
                    />
                  )}
                  {/* Attach event handlers */}
                  <MapEvents />
                </MapContainer>
                {/* Location Button for Small Map */}
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="absolute bottom-4 right-4 bg-green-600 text-white px-3 py-2 rounded-xl hover:bg-green-700 transition shadow-lg z-[1000] flex items-center gap-2"
                  aria-label="Get current location"
                >
                  <Navigation className="h-4 w-4" />
                  <span className="text-sm font-medium">Current Location</span>
                </button>
              </div>
            </div>

            {/* Latitude/Longitude Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
              {/* Latitude */}
              <div className="relative">
                <label htmlFor="latitude" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Latitude</label>
                <input
                  id="latitude"
                  type="number"
                  placeholder="Click map or enter manually"
                  value={formData.latitude}
                  onChange={(e) => {
                    const lat = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({ ...prev, latitude: lat }));
                    setMarkerPosition([lat, formData.longitude]); // Update marker
                    if (mapRef.current) { mapRef.current.panTo([lat, formData.longitude]); } // Pan map
                  }}
                  onKeyPress={preventEnterSubmit}
                  className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md"
                  required // Lat/Lng are essential
                  step="any" // Allow precise decimal input
                />
              </div>
              {/* Longitude */}
              <div className="relative">
                 <label htmlFor="longitude" className="absolute -top-2.5 left-3 bg-gray-50/90 px-1 text-xs font-medium text-gray-600">Longitude</label>
                 <input
                  id="longitude"
                  type="number"
                  placeholder="Click map or enter manually"
                  value={formData.longitude}
                  onChange={(e) => {
                    const lng = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({ ...prev, longitude: lng }));
                    setMarkerPosition([formData.latitude, lng]); // Update marker
                    if (mapRef.current) { mapRef.current.panTo([formData.latitude, lng]); } // Pan map
                  }}
                  onKeyPress={preventEnterSubmit}
                  className="w-full p-3.5 pt-4 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md"
                  required
                  step="any"
                 />
              </div>
            </div>
             <p className="text-xs text-gray-500 text-center mt-1">Click on the map to set the pin, or enter coordinates manually.</p>
          </div>

          {/* Form Actions: Cancel & Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 sm:px-8 py-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300/80 transition text-sm font-medium shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 sm:px-8 py-3 rounded-xl text-white transition text-sm font-medium flex items-center justify-center gap-2 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                formLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:ring-green-600'
              }`}
              disabled={formLoading}
            >
              {formLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {isEdit ? 'Update Store' : 'Create Store'}
                  {/* Using Circle as an example icon, change if needed */}
                  <Circle className="h-4 w-4 opacity-80" />
                </>
              )}
            </button>
          </div>
        </form>
      </div> {/* End Form Popup */}
    </div> // End Backdrop
  );
};

export default StoreForm;
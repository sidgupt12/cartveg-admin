import { Edit, User, ExternalLink } from 'lucide-react';

const StoreCard = ({ store, onEdit, onAssignManager, onRedirect }) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-100 transition-transform hover:scale-[1.01]">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{store.name}</h2>
          <p className="text-gray-600 text-sm">
            {store.address.flatno}, {store.address.street}, {store.address.city}, {store.address.state} - {store.address.pincode}
          </p>
          <p className="text-gray-600 text-sm">{store.phone}</p>
          <p className="text-gray-600 text-sm">{store.email}</p>
          <p className="text-gray-600 text-sm">Lat: {store.latitude}, Long: {store.longitude}</p>
          <p className="text-gray-600 text-sm">Radius: {store.radius} Km</p>
          <p className="text-gray-600 text-sm">Manager: {store.manager?.name || 'None'}</p>
          <p className="text-gray-600 text-sm">Store Id: {store._id || 'None'}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onEdit}
            className="text-green-600 hover:text-green-800 transition"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={onAssignManager}
            className="text-blue-600 hover:text-blue-800 transition"
          >
            <User className="h-5 w-5" />
          </button>
          <button
            onClick={() => onRedirect(store)}
            className="text-purple-600 hover:text-purple-800 transition"
          >
            <ExternalLink className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreCard;
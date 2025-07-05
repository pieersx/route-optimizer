import React, { useState } from 'react';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import { Location } from '../types/route';

interface LocationFormProps {
  locations: Location[];
  onAddLocation: (location: Location) => void;
  onRemoveLocation: (id: string) => void;
  onOptimizeRoute: () => void;
  isOptimizing: boolean;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  locations,
  onAddLocation,
  onRemoveLocation,
  onOptimizeRoute,
  isOptimizing
}) => {
  const [newAddress, setNewAddress] = useState('');
  const [isBase, setIsBase] = useState(false);

  const handleAddLocation = () => {
    if (!newAddress.trim()) return;

    const location: Location = {
      id: Date.now().toString(),
      address: newAddress.trim(),
      isBase
    };

    onAddLocation(location);
    setNewAddress('');
    setIsBase(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddLocation();
    }
  };

  const baseLocation = locations.find(l => l.isBase);
  const deliveryLocations = locations.filter(l => !l.isBase);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-800">Gestión de Ubicaciones</h2>
      </div>

      {/* Add Location Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva Dirección
          </label>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ej. Av. Universitaria 1800, Lima"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isBase"
            checked={isBase}
            onChange={(e) => setIsBase(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isBase" className="text-sm text-gray-700">
            Marcar como base de operaciones
          </label>
        </div>

        <button
          onClick={handleAddLocation}
          disabled={!newAddress.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Ubicación
        </button>
      </div>

      {/* Locations List */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-800">Ubicaciones ({locations.length})</h3>
        
        {baseLocation && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">BASE:</span>
                <span className="text-sm text-gray-700">{baseLocation.address}</span>
              </div>
              <button
                onClick={() => onRemoveLocation(baseLocation.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {deliveryLocations.map((location, index) => (
          <div key={location.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{location.address}</span>
              </div>
              <button
                onClick={() => onRemoveLocation(location.id)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Optimize Button */}
      {locations.length >= 3 && baseLocation && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={onOptimizeRoute}
            disabled={isOptimizing}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
          >
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Optimizando Ruta...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Optimizar Ruta de Reparto
              </>
            )}
          </button>
        </div>
      )}

      {locations.length < 3 && (
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            Agrega al menos 3 ubicaciones (1 base + 2 entregas) para optimizar la ruta.
          </p>
        </div>
      )}
    </div>
  );
};
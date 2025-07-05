import { AlertCircle, CheckCircle, Clock, RefreshCw, Route, Table } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GoogleMapsService } from '../services/googleMapsService';
import { DistanceMatrix as DistanceMatrixType, Location } from '../types/route';

interface DistanceMatrixProps {
  locations: Location[];
  distanceMatrix: DistanceMatrixType;
}

export const DistanceMatrix: React.FC<DistanceMatrixProps> = ({ locations, distanceMatrix }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [localMatrix, setLocalMatrix] = useState<DistanceMatrixType>(distanceMatrix);

  // Update local matrix when prop changes
  useEffect(() => {
    setLocalMatrix(distanceMatrix);
    if (Object.keys(distanceMatrix).length > 0) {
      setLastUpdated(new Date());
    }
  }, [distanceMatrix]);

  const handleRefreshMatrix = async () => {
    if (locations.length < 2) return;

    setIsLoading(true);
    setError(null);

    try {
      const newMatrix = await GoogleMapsService.getDistanceMatrix(locations);
      setLocalMatrix(newMatrix);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing distance matrix:', err);
      setError('Error al actualizar la matriz de distancias. Verifica tu conexión y la API key.');
    } finally {
      setIsLoading(false);
    }
  };

  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Table className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Matriz de Distancias y Tiempos</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          <Table className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Agrega ubicaciones para ver la matriz de distancias</p>
        </div>
      </div>
    );
  }

  const getLocationName = (id: string) => {
    const location = locations.find(l => l.id === id);
    if (!location) return 'Desconocido';

    if (location.isBase) return 'BASE';

    const index = locations.filter(l => !l.isBase).findIndex(l => l.id === id);
    return `P${index + 1}`;
  };

  const getLocationAddress = (id: string) => {
    const location = locations.find(l => l.id === id);
    return location ? location.address : 'Desconocido';
  };

  const hasValidMatrix = Object.keys(localMatrix).length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Table className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Matriz de Distancias y Tiempos</h3>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <CheckCircle className="w-3 h-3" />
              <span>Actualizado {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {locations.length >= 2 && (
          <button
            onClick={handleRefreshMatrix}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Actualizando...' : 'Actualizar'}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Obteniendo datos en tiempo real de Google Maps...</span>
          </div>
        </div>
      )}

      {!hasValidMatrix && !isLoading ? (
        <div className="text-center text-gray-500 py-8">
          <Table className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">Optimiza la ruta para ver la matriz de distancias</p>
          <button
            onClick={handleRefreshMatrix}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Calcular Matriz de Distancias
          </button>
        </div>
      ) : hasValidMatrix && (
        <>
          {/* Legend */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Route className="w-4 h-4" />
              Leyenda de Ubicaciones:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {locations.map(location => (
                <div key={location.id} className="flex items-center gap-3 p-2 bg-white rounded border">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    location.isBase ? 'bg-green-600' : 'bg-blue-600'
                  }`}>
                    {getLocationName(location.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">
                      {location.isBase ? 'Base de Operaciones' : `Punto de Entrega ${getLocationName(location.id)}`}
                    </div>
                    <div className="text-gray-600 truncate text-xs">
                      {getLocationAddress(location.id)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Distance Matrix Table */}
          <div className="overflow-x-auto mb-6">
            <div className="min-w-full">
              <table className="w-full border-collapse border border-gray-300 bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <th className="border border-gray-300 p-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4" />
                        Desde / Hacia
                      </div>
                    </th>
                    {locations.map(location => (
                      <th key={location.id} className="border border-gray-300 p-3 text-center font-semibold text-gray-700 min-w-32">
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            location.isBase ? 'bg-green-600' : 'bg-blue-600'
                          }`}>
                            {getLocationName(location.id)}
                          </div>
                          <span className="text-xs">{getLocationName(location.id)}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {locations.map((fromLocation, rowIndex) => (
                    <tr key={fromLocation.id} className={`hover:bg-blue-50 transition-colors ${
                      rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}>
                      <td className="border border-gray-300 p-3 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            fromLocation.isBase ? 'bg-green-600' : 'bg-blue-600'
                          }`}>
                            {getLocationName(fromLocation.id)}
                          </div>
                          <span>{getLocationName(fromLocation.id)}</span>
                        </div>
                      </td>
                      {locations.map(toLocation => {
                        const element = localMatrix[fromLocation.id]?.[toLocation.id];
                        const isOrigin = fromLocation.id === toLocation.id;

                        return (
                          <td key={toLocation.id} className={`border border-gray-300 p-3 text-center text-sm ${
                            isOrigin ? 'bg-gray-200' : ''
                          }`}>
                            {isOrigin ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-gray-500 font-medium">ORIGEN</span>
                                <span className="text-xs text-gray-400">0 km • 0 min</span>
                              </div>
                            ) : element && element.status === 'OK' ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-center gap-1 text-blue-700">
                                  <Route className="w-3 h-3" />
                                  <span className="font-semibold">{element.distance.text}</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 text-green-700">
                                  <Clock className="w-3 h-3" />
                                  <span className="font-medium">{element.duration.text}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {((element.distance.value / 1000) / (element.duration.value / 3600)).toFixed(1)} km/h
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-red-500 font-medium">Error</span>
                                <span className="text-xs text-red-400">No disponible</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Enhanced Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <Route className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Distancia Promedio</span>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {calculateAverageDistance(localMatrix, locations).toFixed(1)} km
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Entre todas las ubicaciones
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-green-800">Tiempo Promedio</span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {calculateAverageTime(localMatrix, locations).toFixed(0)} min
              </div>
              <div className="text-xs text-green-600 mt-1">
                Considerando tráfico actual
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3 mb-2">
                <Table className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">Conexiones</span>
              </div>
              <div className="text-2xl font-bold text-orange-700">
                {locations.length * (locations.length - 1)}
              </div>
              <div className="text-xs text-orange-600 mt-1">
                Rutas calculadas
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">Velocidad Promedio</span>
              </div>
              <div className="text-2xl font-bold text-purple-700">
                {calculateAverageSpeed(localMatrix, locations).toFixed(1)} km/h
              </div>
              <div className="text-xs text-purple-600 mt-1">
                En condiciones de Lima
              </div>
            </div>
          </div>

          {/* Data Source Info */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-600 text-xs">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>
                Datos obtenidos de Google Maps Distance Matrix API •
                Incluye tráfico en tiempo real •
                Actualizado: {lastUpdated?.toLocaleString() || 'No disponible'}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper functions for calculations
function calculateAverageDistance(matrix: DistanceMatrixType, locations: Location[]): number {
  let total = 0;
  let count = 0;

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK') {
          total += element.distance.value / 1000;
          count++;
        }
      }
    });
  });

  return count > 0 ? total / count : 0;
}

function calculateAverageTime(matrix: DistanceMatrixType, locations: Location[]): number {
  let total = 0;
  let count = 0;

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK') {
          total += element.duration.value / 60;
          count++;
        }
      }
    });
  });

  return count > 0 ? total / count : 0;
}

function calculateAverageSpeed(matrix: DistanceMatrixType, locations: Location[]): number {
  let totalSpeed = 0;
  let count = 0;

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK') {
          const distance = element.distance.value / 1000; // km
          const time = element.duration.value / 3600; // hours
          if (time > 0) {
            totalSpeed += distance / time;
            count++;
          }
        }
      }
    });
  });

  return count > 0 ? totalSpeed / count : 0;
}

function getFastestRoute(matrix: DistanceMatrixType, locations: Location[]): string {
  let minTime = Infinity;
  let fastestRoute = 'N/A';

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK' && element.duration.value < minTime) {
          minTime = element.duration.value;
          const fromName = from.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === from.id) + 1}`;
          const toName = to.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === to.id) + 1}`;
          fastestRoute = `${fromName} → ${toName} (${element.duration.text})`;
        }
      }
    });
  });

  return fastestRoute;
}

function getSlowestRoute(matrix: DistanceMatrixType, locations: Location[]): string {
  let maxTime = 0;
  let slowestRoute = 'N/A';

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK' && element.duration.value > maxTime) {
          maxTime = element.duration.value;
          const fromName = from.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === from.id) + 1}`;
          const toName = to.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === to.id) + 1}`;
          slowestRoute = `${fromName} → ${toName} (${element.duration.text})`;
        }
      }
    });
  });

  return slowestRoute;
}

function getMaxTimeDifference(matrix: DistanceMatrixType, locations: Location[]): number {
  let minTime = Infinity;
  let maxTime = 0;

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK') {
          minTime = Math.min(minTime, element.duration.value);
          maxTime = Math.max(maxTime, element.duration.value);
        }
      }
    });
  });

  return minTime !== Infinity ? Math.round((maxTime - minTime) / 60) : 0;
}

function getShortestRoute(matrix: DistanceMatrixType, locations: Location[]): string {
  let minDistance = Infinity;
  let shortestRoute = 'N/A';

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK' && element.distance.value < minDistance) {
          minDistance = element.distance.value;
          const fromName = from.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === from.id) + 1}`;
          const toName = to.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === to.id) + 1}`;
          shortestRoute = `${fromName} → ${toName} (${element.distance.text})`;
        }
      }
    });
  });

  return shortestRoute;
}

function getLongestRoute(matrix: DistanceMatrixType, locations: Location[]): string {
  let maxDistance = 0;
  let longestRoute = 'N/A';

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK' && element.distance.value > maxDistance) {
          maxDistance = element.distance.value;
          const fromName = from.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === from.id) + 1}`;
          const toName = to.isBase ? 'BASE' : `P${locations.filter(l => !l.isBase).findIndex(l => l.id === to.id) + 1}`;
          longestRoute = `${fromName} → ${toName} (${element.distance.text})`;
        }
      }
    });
  });

  return longestRoute;
}

function getMaxDistanceDifference(matrix: DistanceMatrixType, locations: Location[]): number {
  let minDistance = Infinity;
  let maxDistance = 0;

  locations.forEach(from => {
    locations.forEach(to => {
      if (from.id !== to.id) {
        const element = matrix[from.id]?.[to.id];
        if (element && element.status === 'OK') {
          minDistance = Math.min(minDistance, element.distance.value);
          maxDistance = Math.max(maxDistance, element.distance.value);
        }
      }
    });
  });

  return minDistance !== Infinity ? Math.round((maxDistance - minDistance) / 1000 * 10) / 10 : 0;
}

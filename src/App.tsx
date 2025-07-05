import { Clock, MapPin, TrendingUp, Truck } from 'lucide-react';
import { useCallback, useState } from 'react';
import { DistanceMatrix } from './components/DistanceMatrix';
import { LocationForm } from './components/LocationForm';
import { OptimizationResults } from './components/OptimizationResults';
import { RouteMap } from './components/RouteMap';
import { GoogleMapsService } from './services/googleMapsService';
import { DistanceMatrix as DistanceMatrixType, Location, OptimizedRoute } from './types/route';

function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [distanceMatrix, setDistanceMatrix] = useState<DistanceMatrixType>({});
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleAddLocation = useCallback((location: Location) => {
    // If marking as base, remove existing base first
    if (location.isBase) {
      setLocations(prev => prev.filter(l => !l.isBase).concat(location));
    } else {
      setLocations(prev => [...prev, location]);
    }
  }, []);

  const handleRemoveLocation = useCallback((id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
    // Clear optimization results when locations change
    setOptimizedRoute(null);
    setDistanceMatrix({});
  }, []);

  const handleOptimizeRoute = useCallback(async () => {
    if (locations.length < 3) return;

    setIsOptimizing(true);
    try {
      // Usar Google Directions API para optimización automática
      const optimizationResult = await GoogleMapsService.getOptimizedRoute(locations);

      if (optimizationResult) {
        // Obtener matriz de distancias para mostrar información adicional
        const matrix = await GoogleMapsService.getDistanceMatrix(locations);
        setDistanceMatrix(matrix);

        // Configurar la ruta optimizada
        setOptimizedRoute({
          order: optimizationResult.optimizedOrder,
          totalDistance: optimizationResult.totalDistance,
          totalTime: optimizationResult.totalTime,
          totalCost: optimizationResult.totalDistance * 0.5 + optimizationResult.totalTime * 0.1 // Costo estimado
        });
      } else {
        throw new Error('No se pudo optimizar la ruta');
      }

    } catch (error) {
      console.error('Error optimizing route:', error);
      alert('Error al optimizar la ruta. Por favor, verifica las direcciones e intenta nuevamente.');
    } finally {
      setIsOptimizing(false);
    }
  }, [locations]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                OptimizaRutas Lima
              </h1>
              <p className="text-sm text-gray-600">
                Optimización de rutas de reparto con Google Maps Directions API
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{locations.length}</div>
                <div className="text-sm text-gray-600">Ubicaciones</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Truck className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {locations.filter(l => !l.isBase).length}
                </div>
                <div className="text-sm text-gray-600">Entregas</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {optimizedRoute ? Math.round(optimizedRoute.totalTime) : '-'}
                </div>
                <div className="text-sm text-gray-600">Minutos</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {optimizedRoute ? optimizedRoute.totalDistance.toFixed(1) : '-'}
                </div>
                <div className="text-sm text-gray-600">Kilómetros</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <LocationForm
              locations={locations}
              onAddLocation={handleAddLocation}
              onRemoveLocation={handleRemoveLocation}
              onOptimizeRoute={handleOptimizeRoute}
              isOptimizing={isOptimizing}
            />

            <OptimizationResults
              optimizedRoute={optimizedRoute}
              locations={locations}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            <RouteMap
              locations={locations}
              optimizedRoute={optimizedRoute}
            />

            <DistanceMatrix
              locations={locations}
              distanceMatrix={distanceMatrix}
            />
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;

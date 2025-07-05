import { Award, BarChart3, MapPin, TrendingUp } from 'lucide-react';
import React from 'react';
import { Location, OptimizedRoute } from '../types/route';

interface OptimizationResultsProps {
  optimizedRoute: OptimizedRoute | null;
  locations: Location[];
}

export const OptimizationResults: React.FC<OptimizationResultsProps> = ({
  optimizedRoute,
  locations
}) => {
  if (!optimizedRoute) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Resultados de Optimización</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Los resultados aparecerán después de optimizar la ruta con Google Maps</p>
        </div>
      </div>
    );
  }

  const deliveryCount = locations.filter(l => !l.isBase).length;
  const efficiencyScore = calculateEfficiencyScore(optimizedRoute, deliveryCount);
  const estimatedSavings = calculateEstimatedSavings(optimizedRoute, deliveryCount);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Resultados de Optimización</h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {optimizedRoute.totalDistance.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">km totales</div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {Math.round(optimizedRoute.totalTime)}
          </div>
          <div className="text-sm text-gray-600">minutos</div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {deliveryCount}
          </div>
          <div className="text-sm text-gray-600">entregas</div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-800">Optimización con Google Maps</span>
          </div>
          <p className="text-sm text-gray-700">
            La ruta ha sido optimizada usando Google Maps Directions API con waypoint optimization.
            Se considera el tráfico en tiempo real y las condiciones actuales de Lima.
          </p>
        </div>

        {/* Route Summary */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Resumen de la Ruta Optimizada
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Puntos de entrega:</span>
              <span className="font-medium text-blue-800">{deliveryCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Distancia promedio por entrega:</span>
              <span className="font-medium text-blue-800">
                {deliveryCount > 0 ? (optimizedRoute.totalDistance / deliveryCount).toFixed(1) : '0'} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Tiempo promedio por entrega:</span>
              <span className="font-medium text-blue-800">
                {deliveryCount > 0 ? Math.round(optimizedRoute.totalTime / deliveryCount) : '0'} min
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Velocidad promedio estimada:</span>
              <span className="font-medium text-blue-800">
                {optimizedRoute.totalTime > 0 ? ((optimizedRoute.totalDistance / (optimizedRoute.totalTime / 60)).toFixed(1)) : '0'} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 className="font-medium text-indigo-800 mb-2">Recomendaciones</h4>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• La ruta considera el tráfico actual de Lima en tiempo real</li>
            <li>• Revisa la ruta antes de partir por posibles cambios de tráfico</li>
            <li>• Mantén comunicación con los clientes sobre horarios estimados</li>
            {deliveryCount > 8 && (
              <li>• Con más de 8 entregas, considera dividir en dos rutas</li>
            )}
            <li>• Usa la aplicación Google Maps para navegación en tiempo real</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

function calculateEfficiencyScore(route: OptimizedRoute, deliveryCount: number): number {
  // Simple efficiency calculation based on distance per delivery
  const avgDistancePerDelivery = route.totalDistance / Math.max(1, deliveryCount);
  const maxExpectedDistance = 5; // km per delivery in Lima

  const efficiency = Math.max(0, 100 - (avgDistancePerDelivery / maxExpectedDistance) * 50);
  return Math.round(efficiency);
}

function calculateTimeEfficiency(route: OptimizedRoute): number {
  // Calculate time efficiency based on distance/time ratio
  const ratio = route.totalDistance / (route.totalTime / 60); // km per hour
  const expectedSpeed = 15; // Expected average speed in Lima (km/h)

  const efficiency = Math.min(100, (ratio / expectedSpeed) * 100);
  return Math.round(efficiency);
}

function calculateEstimatedSavings(route: OptimizedRoute, deliveryCount: number) {
  // Estimate savings compared to non-optimized route
  const estimatedNonOptimizedDistance = route.totalDistance * 1.3; // 30% more distance
  const fuelPrice = 5.5; // S/. per liter
  const fuelConsumption = 0.12; // liters per km

  const fuelSaved = (estimatedNonOptimizedDistance - route.totalDistance) * fuelConsumption;
  const timeSaved = (route.totalTime * 0.25); // 25% time savings

  return {
    fuel: fuelSaved * fuelPrice,
    time: Math.round(timeSaved)
  };
}

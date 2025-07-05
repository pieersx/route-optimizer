import { Loader } from '@googlemaps/js-api-loader';
import { AlertCircle, Clock, Key, Map, Navigation, Route } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Location, OptimizedRoute } from '../types/route';

interface RouteMapProps {
  locations: Location[];
  optimizedRoute?: OptimizedRoute;
}

// 🔑 INSTRUCCIONES PARA CONFIGURAR TU API KEY DE GOOGLE MAPS:
// 1. Ve a https://console.cloud.google.com/
// 2. Crea un nuevo proyecto o selecciona uno existente
// 3. Habilita las siguientes APIs:
//    - Maps JavaScript API
//    - Directions API
//    - Distance Matrix API
//    - Geocoding API
// 4. Ve a "Credenciales" y crea una nueva API Key
// 5. Configura las restricciones de la API Key:
//    - Tipo: Restricciones HTTP (sitios web)
//    - Referentes del sitio web: *.webcontainer-api.io/* (para desarrollo)
// 6. Reemplaza 'YOUR_GOOGLE_MAPS_API_KEY_HERE' con tu API key real
const VITE_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const RouteMap: React.FC<RouteMapProps> = ({ locations, optimizedRoute }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [apiKeyValid, setApiKeyValid] = useState(false);

  // Verificar si la API key está configurada
  const isApiKeyConfigured = VITE_GOOGLE_MAPS_API_KEY && VITE_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  // Inicializar Google Maps
  useEffect(() => {
    if (!isApiKeyConfigured) {
      setError('API Key de Google Maps no configurada. Por favor, sigue las instrucciones en el código para obtener y configurar tu API key.');
      return;
    }

    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: VITE_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();
        setApiKeyValid(true);

        if (mapRef.current) {
          const mapInstance = new google.maps.Map(mapRef.current, {
            center: { lat: -12.0464, lng: -77.0428 }, // Centro de Lima
            zoom: 12,
            mapTypeControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          });

          const directionsServiceInstance = new google.maps.DirectionsService();
          const directionsRendererInstance = new google.maps.DirectionsRenderer({
            suppressMarkers: true, // Suprimimos los marcadores por defecto para usar los nuestros
            polylineOptions: {
              strokeColor: '#2563EB',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });

          directionsRendererInstance.setMap(mapInstance);

          setMap(mapInstance);
          setDirectionsService(directionsServiceInstance);
          setDirectionsRenderer(directionsRendererInstance);
          setError(null);
        }
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setApiKeyValid(false);
        if (err instanceof Error && err.message.includes('API key')) {
          setError('API Key inválida o sin permisos. Verifica tu configuración en Google Cloud Console.');
        } else {
          setError('Error al cargar Google Maps. Verifica tu conexión a internet y la configuración de la API key.');
        }
      }
    };

    initMap();
  }, [isApiKeyConfigured]);

  // Limpiar marcadores anteriores
  const clearMarkers = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  };

  // Dibujar marcadores y ruta cuando cambian las ubicaciones
  useEffect(() => {
    if (!map || !directionsService || !directionsRenderer || !apiKeyValid) return;

    // Limpiar marcadores y rutas anteriores
    clearMarkers();
    directionsRenderer.setDirections({ routes: [] } as any);

    if (locations.length === 0) return;

    // Si no hay ruta optimizada, solo mostrar marcadores
    if (!optimizedRoute) {
      showMarkersOnly();
      return;
    }

    // Mostrar ruta optimizada
    showOptimizedRoute();
  }, [map, directionsService, directionsRenderer, locations, optimizedRoute, apiKeyValid]);

  const showMarkersOnly = () => {
    if (!map) return;

    const newMarkers: google.maps.Marker[] = [];

    // Crear marcadores para cada ubicación
    locations.forEach((location, index) => {
      // Geocodificar la dirección para obtener coordenadas
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: location.address + ', Lima, Perú' }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const position = results[0].geometry.location;

          const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: location.address,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createNumberedMarkerSVG(
                location.isBase ? 'BASE' : (index + 1).toString(),
                location.isBase ? '#059669' : '#2563EB'
              ))}`,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40)
            }
          });

          // Info window para mostrar detalles
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-2">
                <h3 class="font-semibold text-gray-800">
                  ${location.isBase ? 'Base de Operaciones' : `Entrega ${index + 1}`}
                </h3>
                <p class="text-sm text-gray-600">${location.address}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        } else {
          console.warn('Geocoding failed for:', location.address, status);
        }
      });
    });

    setMarkers(newMarkers);
  };

  const showOptimizedRoute = async () => {
    if (!map || !directionsService || !directionsRenderer || !optimizedRoute) return;

    setIsLoading(true);
    setError(null);

    try {
      // Obtener ubicaciones en el orden optimizado
      const orderedLocations = optimizedRoute.order.map(id =>
        locations.find(loc => loc.id === id)
      ).filter(Boolean) as Location[];

      if (orderedLocations.length < 2) return;

      // Preparar waypoints para Google Directions
      const origin = orderedLocations[0].address + ', Lima, Perú';
      const destination = orderedLocations[orderedLocations.length - 1].address + ', Lima, Perú';
      const waypoints = orderedLocations.slice(1, -1).map(location => ({
        location: location.address + ', Lima, Perú',
        stopover: true
      }));

      // Solicitar direcciones a Google
      directionsService.route({
        origin: origin,
        destination: destination,
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false, // Ya tenemos la ruta optimizada
        avoidHighways: false,
        avoidTolls: false
      }, (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);

          // Ajustar el zoom para mostrar toda la ruta
          const bounds = new google.maps.LatLngBounds();
          result.routes[0].legs.forEach(leg => {
            bounds.extend(leg.start_location);
            bounds.extend(leg.end_location);
          });
          map.fitBounds(bounds);

          // Agregar marcadores personalizados numerados
          addNumberedMarkers(orderedLocations);
        } else {
          console.error('Error getting directions:', status);
          if (status === 'REQUEST_DENIED') {
            setError('Acceso denegado a la API de Directions. Verifica que tu API key tenga permisos para Directions API.');
          } else {
            setError('Error al calcular la ruta. Intenta con direcciones más específicas.');
          }
          showMarkersOnly(); // Fallback a solo marcadores
        }
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Error showing optimized route:', err);
      setError('Error al mostrar la ruta optimizada.');
      setIsLoading(false);
    }
  };

  const addNumberedMarkers = (orderedLocations: Location[]) => {
    if (!map) return;

    const newMarkers: google.maps.Marker[] = [];

    orderedLocations.forEach((location, index) => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: location.address + ', Lima, Perú' }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const position = results[0].geometry.location;

          let markerLabel = '';
          let markerColor = '#2563EB';

          if (location.isBase) {
            if (index === 0) {
              markerLabel = 'INICIO';
              markerColor = '#059669';
            } else {
              markerLabel = 'FIN';
              markerColor = '#059669';
            }
          } else {
            // Contar solo las entregas para la numeración
            const deliveryIndex = orderedLocations.slice(0, index).filter(l => !l.isBase).length + 1;
            markerLabel = deliveryIndex.toString();
            markerColor = '#2563EB';
          }

          const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: location.address,
            icon: {
              url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createNumberedMarkerSVG(markerLabel, markerColor))}`,
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 40)
            },
            zIndex: 1000
          });

          // Info window mejorado
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-gray-800 mb-1">
                  ${location.isBase
                    ? (index === 0 ? 'Punto de Partida' : 'Punto de Llegada')
                    : `Entrega #${orderedLocations.slice(0, index).filter(l => !l.isBase).length + 1}`
                  }
                </h3>
                <p class="text-sm text-gray-600 mb-2">${location.address}</p>
                <div class="text-xs text-gray-500">
                  Orden en ruta: ${index + 1} de ${orderedLocations.length}
                </div>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
        }
      });
    });

    setMarkers(newMarkers);
  };

  // Función para crear SVG de marcadores numerados
  const createNumberedMarkerSVG = (label: string, color: string) => {
    return `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="${label.length > 2 ? '8' : '12'}" font-weight="bold">
          ${label}
        </text>
      </svg>
    `;
  };

  // Componente de configuración de API Key
  const ApiKeySetupInstructions = () => (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Key className="w-8 h-8 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Configuración de Google Maps API Key
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="font-medium text-blue-800">
              Para usar el mapa, necesitas configurar una API Key de Google Maps:
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Ve a <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
              <li>Crea un nuevo proyecto o selecciona uno existente</li>
              <li>Habilita las siguientes APIs:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>Maps JavaScript API</li>
                  <li>Directions API</li>
                  <li>Distance Matrix API</li>
                  <li>Geocoding API</li>
                </ul>
              </li>
              <li>Ve a "Credenciales" y crea una nueva API Key</li>
              <li>Configura las restricciones:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Tipo: Restricciones HTTP (sitios web)</li>
                  <li>Referentes: <code className="bg-gray-200 px-1 rounded">*.webcontainer-api.io/*</code></li>
                </ul>
              </li>
              <li>Reemplaza <code className="bg-gray-200 px-1 rounded">YOUR_GOOGLE_MAPS_API_KEY_HERE</code> en el código con tu API key real</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Mapa de Rutas Optimizadas</h3>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Calculando ruta...</span>
            </div>
          )}
        </div>
      </div>

      {/* API Key Setup Instructions */}
      {!isApiKeyConfigured && (
        <div className="p-4">
          <ApiKeySetupInstructions />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Map Container */}
      {isApiKeyConfigured && (
        <div className="relative">
          <div
            ref={mapRef}
            className="h-96 w-full"
            style={{ minHeight: '400px' }}
          />

          {locations.length === 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Map className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Agrega ubicaciones para ver el mapa</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Route Summary */}
      {optimizedRoute && isApiKeyConfigured && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <Route className="w-5 h-5 text-blue-600 mb-1" />
              <span className="text-sm text-gray-600">Distancia Total</span>
              <span className="font-semibold text-gray-800">
                {optimizedRoute.totalDistance.toFixed(1)} km
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="w-5 h-5 text-green-600 mb-1" />
              <span className="text-sm text-gray-600">Tiempo Total</span>
              <span className="font-semibold text-gray-800">
                {Math.round(optimizedRoute.totalTime)} min
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Navigation className="w-5 h-5 text-orange-600 mb-1" />
              <span className="text-sm text-gray-600">Paradas</span>
              <span className="font-semibold text-gray-800">
                {locations.filter(l => !l.isBase).length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Route Order */}
      {optimizedRoute && optimizedRoute.order.length > 0 && isApiKeyConfigured && (
        <div className="p-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-800 mb-3">Secuencia Optimizada de Entrega:</h4>
          <div className="space-y-2">
            {optimizedRoute.order.map((locationId, index) => {
              const location = locations.find(l => l.id === locationId);
              if (!location) return null;

              const isStart = index === 0;
              const isEnd = index === optimizedRoute.order.length - 1;

              let stepNumber = '';
              let stepColor = '';

              if (location.isBase) {
                if (isStart) {
                  stepNumber = 'INICIO';
                  stepColor = 'bg-green-600 text-white';
                } else {
                  stepNumber = 'FIN';
                  stepColor = 'bg-green-600 text-white';
                }
              } else {
                const deliveryNumber = optimizedRoute.order.slice(0, index).filter(id => {
                  const loc = locations.find(l => l.id === id);
                  return loc && !loc.isBase;
                }).length + 1;
                stepNumber = deliveryNumber.toString();
                stepColor = 'bg-blue-600 text-white';
              }

              return (
                <div key={`${locationId}-${index}`} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`min-w-[2rem] h-8 rounded-full flex items-center justify-center text-sm font-medium ${stepColor}`}>
                    {stepNumber}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-gray-700">
                      {location.address}
                    </span>
                    {location.isBase && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {isStart ? 'Punto de partida' : 'Retorno a base'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Paso {index + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Instrucciones:</strong> Sigue la secuencia numerada mostrada en el mapa y en la lista arriba.
              La ruta está optimizada por Google Maps considerando el tráfico en tiempo real de Lima.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

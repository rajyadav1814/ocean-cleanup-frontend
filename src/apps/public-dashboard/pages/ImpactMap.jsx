import { useState, useEffect, useCallback } from 'react';
import { useActivities } from '../../../hooks/useActivities';
import { useTheme } from '../../../context/ThemeContext';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const mapContainerStyle = {
  height: '100%',
  width: '100%',
};

// A dark theme for the map to match the application's style.
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];


// Centered on the Indian Ocean to match the provided link.
const initialCenter = { lat: 19.9340979, lng: 67.3750703 };

export default function ImpactMap() {
  const { activities, loading, error } = useActivities();
  const { theme } = useTheme();
  const [map, setMap] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const currentMapOptions = {
    styles: theme === 'light' ? [] : darkMapStyle,
    disableDefaultUI: true,
    zoomControl: true,
  };

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const onLoad = useCallback(mapInstance => setMap(mapInstance), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // Auto-zoom to fit all markers when activities data changes.
  useEffect(() => {
    if (map && activities.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      // Filter for activities that have valid coordinates from the backend
      const activitiesWithCoords = activities.filter(a => a.latitude != null && a.longitude != null);

      if (activitiesWithCoords.length === 0) return;

      activitiesWithCoords.forEach(activity => {
        bounds.extend({ lat: activity.latitude, lng: activity.longitude });
      });

      if (activitiesWithCoords.length === 1) {
        const { latitude: lat, longitude: lng } = activitiesWithCoords[0];
        map.setCenter({ lat, lng });
        map.setZoom(10);
      } else {
        map.fitBounds(bounds);
      }
    }
  }, [map, activities]);

  if (loadError) {
    // Log the specific error to the console for easier debugging.
    console.error("Failed to load Google Maps script:", loadError);
    return <div>Error loading Google Maps. Please check your API key and the browser console for more details.</div>;
  }

  if (error) return <div className="alert alert-danger">Error: {error.message}</div>;

  return (
    <section>
      <div className="mb-6">
        <h3>Global Impact Map</h3>
        <p className="text-muted">Visualizing worldwide cleanup locations.</p>
      </div>

      {!loading && !error && activities.length === 0 && (
        <div className="alert alert-info" role="alert">
          The map is ready, but there are no cleanup activities to display at the moment.
        </div>
      )}
      <div className="card" style={{ height: '700px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {!isLoaded || loading ? <LoadingSpinner /> : (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={initialCenter}
            zoom={3}
            options={currentMapOptions}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {activities
              .filter(activity => activity.latitude != null && activity.longitude != null)
              .map(activity => (
                <Marker
                  key={activity.id}
                  position={{ lat: activity.latitude, lng: activity.longitude }}
                  onClick={() => setSelectedActivity(activity)}
                />
              ))}

            {selectedActivity && selectedActivity.latitude != null && selectedActivity.longitude != null && (
              <InfoWindow
                position={{
                  lat: selectedActivity.latitude,
                  lng: selectedActivity.longitude,
                }}
                onCloseClick={() => setSelectedActivity(null)}
              >
                <div>
                  <strong>{selectedActivity.location}</strong><br />
                  Category: {selectedActivity.category}<br />
                  Quantity: {selectedActivity.quantity} kg<br />
                  Status: {selectedActivity.status}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        )}
      </div>
    </section>
  );
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Location } from '../../store';
import { MapPinIcon } from 'lucide-react';

interface MapComponentProps {
  locations: Location[];
  onPositionSelect: (position: google.maps.LatLngLiteral) => void;
  selectedPosition: google.maps.LatLngLiteral | null;
  onLibrariesLoaded?: () => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  locations, 
  onPositionSelect,
  selectedPosition, 
  onLibrariesLoaded
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [tempMarker, setTempMarker] = useState<google.maps.Marker | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [centerMarkerVisible, setCenterMarkerVisible] = useState(false);

  const handleResize = useCallback(() => {
    const mobile = window.innerWidth < 768;
    setIsMobileView(mobile);
    setCenterMarkerVisible(mobile);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  // Initialize map
  useEffect(() => {
    if (mapRef.current && !map) {
      const initialCenter = { lat: 40.7128, lng: -74.0060 }; // New York as default
      
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });
      
      // Try to get user's location for initial center
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            mapInstance.setCenter(pos);
          },
          () => {
            // Handle geolocation error silently
          }
        );
      }
      
      // Add click listener (only if not in mobile view with center marker)
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          onPositionSelect(position);
          if (isMobileView) setCenterMarkerVisible(false);
        }
      });
      
      setMap(mapInstance);
      if (onLibrariesLoaded) {
        onLibrariesLoaded();
      }
    }
  }, [mapRef, map, onPositionSelect, isMobileView, onLibrariesLoaded]);
  
  // Update markers when locations change
  useEffect(() => {
    if (map) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null));
      
      // Create new markers for all locations
      const newMarkers = locations.map(location => {
        const marker = new google.maps.Marker({
          position: location.position,
          map,
          title: location.name,
          icon: {
            url: location.isProperty 
              ? 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
              : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          },
          animation: google.maps.Animation.DROP,
        });
        
        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `<div><strong>${location.name}</strong></div>`,
        });
        
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        
        return marker;
      });
      
      setMarkers(newMarkers);
      
      // Set bounds to include all markers if there are any
      if (newMarkers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        newMarkers.forEach(marker => {
          bounds.extend(marker.getPosition()!);
        });
        map.fitBounds(bounds);
        
        // Don't zoom in too far
        if (map.getZoom()! > 15) {
          map.setZoom(15);
        }
      }
    }
  }, [map, locations]);
  
  // Handle temporary marker for selection (non-mobile or when center marker is hidden)
  useEffect(() => {
    let markerToSet: google.maps.Marker | null = null;

    if (map && selectedPosition && !centerMarkerVisible) {
      // Create a new marker instance if conditions are met
      markerToSet = new google.maps.Marker({
        position: selectedPosition,
        map,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        },
        animation: google.maps.Animation.BOUNCE,
      });
    }

    // Update the state with the new marker (or null if conditions were not met)
    // This will replace any existing marker in the state.
    setTempMarker(markerToSet);

    // Cleanup function: this will be called when the component unmounts
    // or when any of the dependencies change before the effect runs again.
    // It should remove the marker that was created and set in *this specific run* of the effect.
    return () => {
      if (markerToSet) {
        markerToSet.setMap(null);
      }
    };
  }, [map, selectedPosition?.lat, selectedPosition?.lng, centerMarkerVisible]); // Use lat/lng for dependency to avoid loop
  
  // Callback for mobile "Add Location at Center" button
  const handleAddCenterLocation = useCallback(() => {
    if (map) {
      const center = map.getCenter();
      if (center) {
        onPositionSelect({ lat: center.lat(), lng: center.lng() });
        setCenterMarkerVisible(false);
      }
    }
  }, [map, onPositionSelect]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {isMobileView && centerMarkerVisible && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
        >
          <MapPinIcon className="h-10 w-10 text-blue-600" style={{ transform: 'translateY(-50%)' }} />
        </div>
      )}
      {isMobileView && (
         <button 
            onClick={handleAddCenterLocation} 
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg text-sm"
          >
            Add Pin at Map Center
          </button>
      )}
    </div>
  );
};

export default MapComponent;
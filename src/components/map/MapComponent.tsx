import React, { useEffect, useRef, useState } from 'react';
import { Location } from '../../store';

interface MapComponentProps {
  locations: Location[];
  onPositionSelect: (position: google.maps.LatLngLiteral) => void;
  selectedPosition: google.maps.LatLngLiteral | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  locations, 
  onPositionSelect,
  selectedPosition 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [tempMarker, setTempMarker] = useState<google.maps.Marker | null>(null);
  
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
      
      // Add click listener
      mapInstance.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const position = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          };
          onPositionSelect(position);
        }
      });
      
      setMap(mapInstance);
    }
  }, [mapRef, map, onPositionSelect]);
  
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
      if (newMarkers.length > 0) {
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
  
  // Handle temporary marker for selection
  useEffect(() => {
    if (map && selectedPosition) {
      // Remove old temporary marker if exists
      if (tempMarker) {
        tempMarker.setMap(null);
      }
      
      // Create new temporary marker
      const newTempMarker = new google.maps.Marker({
        position: selectedPosition,
        map,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
        },
        animation: google.maps.Animation.BOUNCE,
      });
      
      setTempMarker(newTempMarker);
      
      return () => {
        if (newTempMarker) {
          newTempMarker.setMap(null);
        }
      };
    } else if (tempMarker) {
      tempMarker.setMap(null);
      setTempMarker(null);
    }
  }, [map, selectedPosition, tempMarker]);
  
  return <div ref={mapRef} className="w-full h-full" />;
};

export default MapComponent;
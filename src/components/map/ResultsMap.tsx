import React, { useEffect, useRef, useState } from 'react';
import { Location, RouteResult } from '../../store';

interface ResultsMapProps {
  locations: Location[];
  results: RouteResult[];
  isLoading: boolean;
}

const ResultsMap: React.FC<ResultsMapProps> = ({ 
  locations,
  results,
  isLoading
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
  
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
      
      setMap(mapInstance);
    }
  }, [mapRef, map]);
  
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
  
  // Display routes when results change
  useEffect(() => {
    if (map && results.length > 0 && !isLoading) {
      // Clear existing routes
      directionsRenderers.forEach(renderer => renderer.setMap(null));
      
      // Group results by from/to pairs
      const routeGroups: {[key: string]: RouteResult[]} = {};
      
      results.forEach(result => {
        const key = `${result.fromId}-${result.toId}`;
        if (!routeGroups[key]) {
          routeGroups[key] = [];
        }
        routeGroups[key].push(result);
      });
      
      // Create directions renderers for all routes
      const newRenderers: google.maps.DirectionsRenderer[] = [];
      
      // Function to render routes
      const renderRoute = (fromLocation: Location, toLocation: Location, routeResults: RouteResult[]) => {
        // Use the worst case (highest duration) for visualization
        const worstCaseRoute = routeResults.sort((a, b) => b.durationValue - a.durationValue)[0];
        
        // Calculate color based on duration
        // Lower duration = green, higher duration = red
        const maxDuration = 7200; // 2 hours as max reference
        const durationRatio = Math.min(worstCaseRoute.durationValue / maxDuration, 1);
        
        // Color gradient: green -> yellow -> red
        const r = Math.floor(durationRatio < 0.5 
          ? 255 * (2 * durationRatio) 
          : 255);
        const g = Math.floor(durationRatio < 0.5 
          ? 255 
          : 255 * (2 - 2 * durationRatio));
        const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}00`;
        
        // Create directions request
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: color,
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });
        
        directionsService.route(
          {
            origin: fromLocation.position,
            destination: toLocation.position,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
              directionsRenderer.setDirections(result);
              newRenderers.push(directionsRenderer);
            }
          }
        );
      };
      
      // Render routes for each pair
      Object.keys(routeGroups).forEach(key => {
        const [fromId, toId] = key.split('-');
        const fromLocation = locations.find(loc => loc.id === fromId);
        const toLocation = locations.find(loc => loc.id === toId);
        
        if (fromLocation && toLocation) {
          renderRoute(fromLocation, toLocation, routeGroups[key]);
        }
      });
      
      setDirectionsRenderers(newRenderers);
    }
  }, [map, results, locations, isLoading]);
  
  return <div ref={mapRef} className="w-full h-full" />;
};

export default ResultsMap;
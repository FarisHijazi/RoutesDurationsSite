import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPinIcon, HomeIcon, BuildingIcon, XIcon, SearchIcon } from 'lucide-react';
import { useStore, Location } from '../../store';
import MapComponent from '../map/MapComponent';

const LocationStep: React.FC = () => {
  const { apiKey, locations, addLocation, removeLocation } = useStore();
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProperty, setIsProperty] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(null);
  const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const hasProperty = locations.some(loc => loc.isProperty);
  
  useEffect(() => {
    if (!hasProperty) {
      setIsProperty(true);
    }
  }, [hasProperty]);

  // Initialize services once libraries are loaded (now assumed to be loaded by App.tsx Wrapper)
  useEffect(() => {
    if (window.google && window.google.maps) {
      if (window.google.maps.Geocoder) {
        geocoderRef.current = new google.maps.Geocoder();
      }
      if (window.google.maps.places && window.google.maps.places.PlacesService) {
        placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'));
      }
    }
  }, []); // Runs once on mount

  const performSearch = useCallback((query: string) => {
    if (!placesServiceRef.current || !query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const propertyLocation = locations.find(loc => loc.isProperty);
    const request: google.maps.places.TextSearchRequest = { query };

    if (propertyLocation) {
      request.location = propertyLocation.position;
    }

    placesServiceRef.current.textSearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results);
      } else {
        setSearchResults([]); // Clear results on error or no results
      }
    });
  }, [locations]);

  // Perform search directly when searchQuery changes
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  const handleMapPositionSelect = (position: google.maps.LatLngLiteral) => {
    setSelectedPosition(position);
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: position }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          setLocationName(results[0].formatted_address);
        } else {
          console.warn('Geocode was not successful for the following reason: ' + status);
        }
      });
    }
  };

  const handleSelectPlace = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const position = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setSelectedPosition(position);
      setLocationName(place.name || '');
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  const handleAddLocation = () => {
    if (!selectedPosition || !locationName.trim()) return;
    
    const newLocation: Location = {
      id: Date.now().toString(),
      name: locationName || (isProperty ? 'My Property' : `Destination ${locations.filter(l => !l.isProperty).length + 1}`),
      position: selectedPosition,
      isProperty
    };
    
    addLocation(newLocation);
    
    setLocationName('');
    setSelectedPosition(null);
    
    if (isProperty) {
      setIsProperty(false);
    }
  };

  const handleLocationNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLocation();
    }
  };
  
  const renderLocationList = () => {
    if (locations.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <MapPinIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No locations added yet</p>
          <p className="text-sm">Search for locations or click on the map</p>
        </div>
      );
    }
    
    const properties = locations.filter(loc => loc.isProperty);
    const destinations = locations.filter(loc => !loc.isProperty);
    
    return (
      <div className="space-y-4">
        {properties.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Your Property:</h4>
            <ul className="space-y-2">
              {properties.map(loc => (
                <LocationItem key={loc.id} location={loc} onRemove={removeLocation} />
              ))}
            </ul>
          </div>
        )}
        
        {destinations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Destinations:</h4>
            <ul className="space-y-2">
              {destinations.map(loc => (
                <LocationItem key={loc.id} location={loc} onRemove={removeLocation} />
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Locations</h2>
      <p className="text-gray-600 mb-6">
        Search for locations or click on the map to add your property and destinations.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a location..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <SearchIcon 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                {searchResults.map((place, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                  >
                    <div className="font-medium">{place.name}</div>
                    <div className="text-sm text-gray-500">{place.formatted_address}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-100 rounded-lg overflow-hidden h-[400px]">
            {apiKey ? (
                <MapComponent 
                  locations={locations}
                  onPositionSelect={handleMapPositionSelect}
                  selectedPosition={selectedPosition}
                />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-gray-600 p-4 text-center">
                  Google Maps API Key is missing. Please configure it in <code>src/store/index.ts</code> to enable map features.
                </p>
              </div>
            )}
          </div>
          
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
              <div>
                <button
                  onClick={handleAddLocation}
                  disabled={!selectedPosition || !locationName.trim()}
                  className={`w-full sm:w-auto px-4 py-2 rounded-md text-white transition duration-150 ${
                    (!selectedPosition || !locationName.trim())
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {selectedPosition ? 'Add This Location' : 'Click Map or Search to Select'}
                </button>
              </div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {selectedPosition ? 'Confirm Location Details:' : 'Select a Location to Add:'}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex-grow">
                <label htmlFor="locationNameInput" className="sr-only">Location Name</label>
                <input
                  id="locationNameInput"
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  onKeyDown={handleLocationNameKeyDown}
                  placeholder={isProperty && !hasProperty ? "Enter property name (e.g., Home)" : "Enter destination name"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={!selectedPosition}
                />
              </div>
              
              {!hasProperty && (
                <div className="flex items-center">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={isProperty}
                      onChange={(e) => setIsProperty(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      disabled={!selectedPosition}
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as Property Location</span>
                  </label>
                </div>
              )}
              
            </div>
            {selectedPosition && locationName && (
                <p className="text-xs text-gray-500 mt-2">
                    Selected: {locationName} (Lat: {selectedPosition.lat.toFixed(4)}, Lng: {selectedPosition.lng.toFixed(4)})
                </p>
            )}
            {!selectedPosition && (
                 <p className="text-xs text-gray-500 mt-2">
                    Tip: Click on the map or use the search bar to pick a location.
                </p>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Your Locations</h3>
          {renderLocationList()}
          
          <div className="mt-6 text-sm text-gray-500">
            <p className="flex items-start mb-2">
              <HomeIcon className="h-4 w-4 mr-2 mt-0.5 text-blue-500" />
              <span>First, add your property location</span>
            </p>
            <p className="flex items-start">
              <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 text-red-500" />
              <span>Then add all destinations you frequently visit</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface LocationItemProps {
  location: Location;
  onRemove: (id: string) => void;
}

const LocationItem: React.FC<LocationItemProps> = ({ location, onRemove }) => {
  return (
    <li className="flex items-center justify-between bg-white rounded-md p-3 shadow-sm border border-gray-200">
      <div className="flex items-center">
        {location.isProperty ? (
          <HomeIcon className="h-5 w-5 text-blue-500 mr-2" />
        ) : (
          <BuildingIcon className="h-5 w-5 text-red-500 mr-2" />
        )}
        <span className="font-medium text-gray-700">{location.name}</span>
      </div>
      <button
        onClick={() => onRemove(location.id)}
        className="text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Remove location"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </li>
  );
};

export default LocationStep;
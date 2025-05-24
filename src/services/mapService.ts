import { Location, RouteResult } from '../store';

// Mock distance matrix data for development without API key
const MOCK_MODE = true;

// Function to calculate routes between locations
export const calculateRoutes = async (
  property: Location,
  destinations: Location[],
  selectedTimes: string[]
): Promise<RouteResult[]> => {
  const results: RouteResult[] = [];
  
  // If in mock mode, return mock data
  if (MOCK_MODE) {
    return generateMockResults(property, destinations, selectedTimes);
  }

  try {
    // For each time
    for (const timeOption of selectedTimes) {
      // For each destination
      for (const destination of destinations) {
        // For each traffic model
        for (const trafficModel of ['best_guess', 'optimistic', 'pessimistic'] as const) {
          // Calculate route from property to destination
          const toDestResult = await calculateRoute(
            property,
            destination,
            timeOption,
            trafficModel
          );
          results.push(toDestResult);

          // Calculate route from destination to property
          const fromDestResult = await calculateRoute(
            destination,
            property,
            timeOption,
            trafficModel
          );
          results.push(fromDestResult);
        }
      }
    }
    return results;
  } catch (error) {
    console.error('Error calculating routes:', error);
    throw error;
  }
};

// Calculate a single route using Google Maps Distance Matrix API
const calculateRoute = async (
  origin: Location,
  destination: Location,
  timeOption: string,
  trafficModel: 'best_guess' | 'optimistic' | 'pessimistic'
): Promise<RouteResult> => {
  // Parse time option to create a departure time
  const [hours, minutes] = timeOption.split(':').map(Number);
  const departureTime = new Date();
  departureTime.setHours(hours, minutes, 0, 0);

  // Use Distance Matrix API
  const service = new google.maps.DistanceMatrixService();

  const response = await service.getDistanceMatrix({
    origins: [origin.position],
    destinations: [destination.position],
    travelMode: google.maps.TravelMode.DRIVING,
    drivingOptions: {
      departureTime: departureTime,
      trafficModel: trafficModel === 'best_guess'
        ? google.maps.TrafficModel.BEST_GUESS
        : trafficModel === 'optimistic'
        ? google.maps.TrafficModel.OPTIMISTIC
        : google.maps.TrafficModel.PESSIMISTIC
    }
  });

  const element = response.rows[0].elements[0];

  return {
    fromId: origin.id,
    toId: destination.id,
    time: element.duration.text,
    distance: element.distance.text,
    durationValue: element.duration.value,
    distanceValue: element.distance.value,
    timeOption,
    trafficModel
  };
};

// Generate mock results for development
const generateMockResults = (
  property: Location,
  destinations: Location[],
  selectedTimes: string[]
): RouteResult[] => {
  const results: RouteResult[] = [];
  
  // Traffic multipliers by time
  const trafficMultipliers: { [key: string]: number } = {
    '06:00': 1.0,  // Light traffic
    '08:00': 1.8,  // Heavy rush hour
    '10:00': 1.2,  // Medium traffic
    '12:00': 1.3,  // Lunch hour
    '14:00': 1.1,  // Afternoon
    '16:00': 1.7,  // Evening rush hour
    '18:00': 1.5,  // Still heavy but tapering
    '20:00': 1.1,  // Evening
  };

  const trafficModelMultipliers = {
    best_guess: 1.0,
    optimistic: 0.8,
    pessimistic: 1.2,
  };

  // For each time
  for (const timeOption of selectedTimes) {
    // For each destination
    for (const destination of destinations) {
      // Calculate base values based on actual distance
      const lat1 = property.position.lat;
      const lng1 = property.position.lng;
      const lat2 = destination.position.lat;
      const lng2 = destination.position.lng;
      // Simple distance calculation (in km)
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      const distanceText = `${distance.toFixed(1)} km`;
      // Base duration in seconds (assuming average speed of 50 km/h)
      const baseDuration = (distance / 50) * 3600;
      // Apply traffic multiplier
      const multiplier = trafficMultipliers[timeOption] || 1.0;
      // For each traffic model
      (['best_guess', 'optimistic', 'pessimistic'] as const).forEach(trafficModel => {
        const modelMultiplier = trafficModelMultipliers[trafficModel];
        const duration = baseDuration * multiplier * modelMultiplier;
        // Format duration text
        let durationText = '';
        if (duration < 3600) {
          durationText = `${Math.round(duration / 60)} mins`;
        } else {
          const hours = Math.floor(duration / 3600);
          const minutes = Math.round((duration % 3600) / 60);
          durationText = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} mins`;
        }
        // Add to property to destination
        results.push({
          fromId: property.id,
          toId: destination.id,
          time: durationText,
          distance: distanceText,
          durationValue: duration,
          distanceValue: distance * 1000, // Convert to meters
          timeOption,
          trafficModel
        });
        // Add destination to property (slightly different values for realism)
        const returnMultiplier = multiplier * (0.9 + Math.random() * 0.2);
        const returnDuration = baseDuration * returnMultiplier * modelMultiplier;
        let returnDurationText = '';
        if (returnDuration < 3600) {
          returnDurationText = `${Math.round(returnDuration / 60)} mins`;
        } else {
          const hours = Math.floor(returnDuration / 3600);
          const minutes = Math.round((returnDuration % 3600) / 60);
          returnDurationText = `${hours} hour${hours > 1 ? 's' : ''} ${minutes} mins`;
        }
        results.push({
          fromId: destination.id,
          toId: property.id,
          time: returnDurationText,
          distance: distanceText,
          durationValue: returnDuration,
          distanceValue: distance * 1000, // Convert to meters
          timeOption,
          trafficModel
        });
      });
    }
  }
  return results;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};
import { Location, RouteResult } from '../store';

// Mock distance matrix data for development without API key
const MOCK_MODE = false;

// Function to calculate routes between locations
export const calculateRoutes = async (
  property: Location,
  destinations: Location[],
  selectedTimes: string[]
): Promise<RouteResult[]> => {
  try {
    const promises: Promise<RouteResult>[] = [];

    // For each time
    for (const timeOption of selectedTimes) {
      // For each destination
      for (const destination of destinations) {
        // For each traffic model
        for (const trafficModel of ['best_guess', 'optimistic', 'pessimistic'] as const) {
          // Calculate route from property to destination
          promises.push(
            calculateRoute(
              property,
              destination,
              timeOption,
              trafficModel
            )
          );

          // Calculate route from destination to property
          promises.push(
            calculateRoute(
              destination,
              property,
              timeOption,
              trafficModel
            )
          );
        }
      }
    }

    const results = await Promise.all(promises);
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
  
  const now = new Date();
  const departureTime = new Date();
  departureTime.setHours(hours, minutes, 0, 0);

  // If the calculated departure time is in the past for today, set it for tomorrow
  if (departureTime < now) {
    departureTime.setDate(departureTime.getDate() + 1);
  }

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
    durationValue: element.duration_in_traffic
      ? element.duration_in_traffic.value
      : element.duration.value,
    distanceValue: element.distance.value,
    timeOption,
    trafficModel
  };
};
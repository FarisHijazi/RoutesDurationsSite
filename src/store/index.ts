import { create } from 'zustand';

export interface Location {
  id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  isProperty: boolean;
}

export interface TimeOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface RouteResult {
  fromId: string;
  toId: string;
  time: string;
  distance: string;
  durationValue: number;
  distanceValue: number;
  timeOption: string;
}

interface StoreState {
  apiKey: string;
  step: number;
  locations: Location[];
  timeOptions: TimeOption[];
  routeResults: RouteResult[];
  isCalculating: boolean;
  error: string | null;
  selectedTimeOption: string;
  setSelectedTimeOption: (value: string) => void;
  setStep: (step: number) => void;
  addLocation: (location: Location) => void;
  removeLocation: (id: string) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  toggleTimeOption: (value: string) => void;
  setRouteResults: (results: RouteResult[]) => void;
  setIsCalculating: (isCalculating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const DEFAULT_TIME_OPTIONS: TimeOption[] = [
  { value: '06:00', label: '6:00 AM', selected: true },
  { value: '08:00', label: '8:00 AM', selected: true },
  { value: '10:00', label: '10:00 AM', selected: true },
  { value: '12:00', label: '12:00 PM', selected: true },
  { value: '14:00', label: '2:00 PM', selected: true },
  { value: '16:00', label: '4:00 PM', selected: true },
  { value: '18:00', label: '6:00 PM', selected: true },
  { value: '20:00', label: '8:00 PM', selected: true },
];

export const useStore = create<StoreState>((set) => ({
  apiKey: '***REMOVED***',
  step: 0,
  locations: [],
  timeOptions: DEFAULT_TIME_OPTIONS,
  routeResults: [],
  isCalculating: false,
  error: null,
  selectedTimeOption: DEFAULT_TIME_OPTIONS.find(t => t.selected)?.value || DEFAULT_TIME_OPTIONS[0].value,
  setSelectedTimeOption: (value) => set({ selectedTimeOption: value }),
  
  setStep: (step) => set({ step }),
  
  addLocation: (location) => set((state) => ({
    locations: [...state.locations, location]
  })),
  
  removeLocation: (id) => set((state) => ({
    locations: state.locations.filter(location => location.id !== id)
  })),
  
  updateLocation: (id, updates) => set((state) => ({
    locations: state.locations.map(location => 
      location.id === id ? { ...location, ...updates } : location
    )
  })),
  
  toggleTimeOption: (value) => set((state) => ({
    timeOptions: state.timeOptions.map(option => 
      option.value === value ? { ...option, selected: !option.selected } : option
    )
  })),
  
  setRouteResults: (results) => set({ routeResults: results }),
  
  setIsCalculating: (isCalculating) => set({ isCalculating }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({
    step: 0,
    locations: [],
    timeOptions: DEFAULT_TIME_OPTIONS,
    routeResults: [],
    isCalculating: false,
    error: null
  })
}));
import React from 'react';
import { MapPinIcon } from 'lucide-react';
import WizardContainer from './components/WizardContainer';
import { useStore } from './store';
import { Wrapper } from '@googlemaps/react-wrapper';

function App() {
  const { step, apiKey } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-800">OptimalRoute</h1>
          </div>
          <div className="text-sm text-gray-500">Find your ideal location</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {apiKey ? (
            <Wrapper apiKey={apiKey} libraries={['places', 'geocoding', 'routes']}>
          <WizardContainer />
            </Wrapper>
          ) : (
            <WizardContainer /> // Render WizardContainer directly if no API key, SetupStep will handle it
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-4 px-6">
        <div className="max-w-7xl mx-auto text-center text-sm">
          <p>© {new Date().getFullYear()} OptimalRoute. Powered by Google Maps.</p>
          <p className="text-xs text-gray-400 mt-1">
            Using Google Maps Distance Matrix & Directions API
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
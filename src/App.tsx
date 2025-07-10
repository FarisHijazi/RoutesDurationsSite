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
            <h1 className="text-xl font-semibold text-gray-800">Zahma</h1>
          </div>
          <div className="text-sm text-gray-500">How easy is it to get to and from your home?</div>
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
          <p className="flex items-center justify-center gap-2">
            © {new Date().getFullYear()} Zahma by <a href="https://linkedin.com/in/theefaris" className="hover:text-blue-400 inline-flex items-center gap-1">Faris Hijazi <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path></svg></a> (<a href="https://twitter.com/theefaris" className="hover:text-blue-400 inline-flex items-center gap-1">@theefaris <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg></a>) and <a href="https://www.linkedin.com/in/munirah-alsaeed" className="hover:text-blue-400 inline-flex items-center gap-1">Munirah Alsaeed <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path></svg></a>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Using Google Maps Distance Matrix & Directions API
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
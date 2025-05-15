# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## General prompt for the project

### Google Maps routing distance matrix calculator

### Behaviour
An app that uses Google Maps API to compare distances and routes to find the optimal property or place to live.

### User flow
Build a webapp that has a wizard that gets info from the user.

The first wizard page shows the user a map (using Google Maps embed), and the user is asked to drop multiple pins, the first pin is on their property location, the other pins are the places they want to reach.

After this, they will have a multiselect dropdown where they'll choose the times they're interested in calculating. Keep default values selected of 6am, 8am, 10am, 12pm, 2pm, 4pm, 6pm, 8pm

Once that's done, they will click "calculate distances", and at this point it will do this pseudo code:

for each location
for each traffic level
for each time
to and from the property
calculate the distance and time
draw the average traffic on the map using colors, and show a neat graph of your traffic experience, that captures all the possible
also print all the times and distances in all the possible trips

## Architecture Overview

This is a React TypeScript application for calculating optimal locations based on travel times using Google Maps API:

- Built with React 18, TypeScript, and Vite
- Uses Zustand for state management
- TailwindCSS for styling
- Chart.js for data visualization
- Google Maps API for mapping and route calculations

The application implements a wizard-style interface guiding users through:
1. Adding a property location and multiple destinations
2. Selecting time periods for travel time calculations
3. Viewing results with maps, charts, and detailed breakdowns

## Component Structure

- **State Management:** Zustand store in `src/store/index.ts` manages locations, time periods, results, and UI state
- **Wizard Flow:** `WizardContainer.tsx` manages the step navigation flow
- **Steps:**
  - `LocationStep.tsx` - Property and destination selection with map integration
  - `TimeSelectionStep.tsx` - Time period selection
  - `ResultsStep.tsx` - Displays calculation results
- **Map Components:**
  - `MapComponent.tsx` - Core map functionality with markers
  - `ResultsMap.tsx` - Specialized map for displaying routes
- **Results Views:**
  - `ResultsSummary.tsx` - Travel time overview
  - `ResultsDetails.tsx` - Detailed route breakdown
  - `ResultsCharts.tsx` - Data visualization

The `mapService.ts` provides route calculation functionality with the Google Maps Distance Matrix API and includes mock functionality for development.

## Known Issues and TODOs

- **Ad Blocker Conflict**: Some ad blockers (like uBlock Origin) block certain Lucide icon files (particularly "fingerprint.js") because they're named like tracking scripts. This can cause the app to display a blank page or miss UI elements.
  - TODO: Replace problematic icon names or provide fallbacks
  - Temporary solution: Disable ad blocker for localhost:5173 or add an exception

## Feature details

- [ ] make sure the map part works on mobile as well, put a marker in the middle so that people can see the center that's gonna happen, and don't use hardcoded. double click stuff
- [ ] for the map part, I don't like that the user has to keep tapping the map for it to allow him to enter a new location
  keep the buttons always available, stop hiding them, update the buttons to show something like "move the map to add another location" or something like that
   that's appropriate, think well about it. Make sure the buttons don't exist in the results page of the wizard
features to do:
- [ ] in the results page, I want the order of the results to be: best,average,worst.
- [ ] In the results page, I don't want tabs, I instead want them to be back to back
- [ ] I want to have the option to add the "closest" gym to my property

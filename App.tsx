import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Cafe, FilterState, MoodOption, TimeOption } from './types';
import { CAFES, INITIAL_MAP_CENTER } from './constants';
import { filterCafes } from './services/utils';
import CafeCard from './components/CafeCard';
import { MapPin, Search, Coffee, Clock, Navigation } from 'lucide-react';

declare global {
  interface Window {
    google: any;
  }
}

// Helper to determine initial time of day
const getInitialTime = (): TimeOption => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Late Night';
};

function App() {
  // State
  const [cafes, setCafes] = useState<Cafe[]>(CAFES);
  const [filteredCafes, setFilteredCafes] = useState<Cafe[]>(CAFES);
  const [selectedCafeId, setSelectedCafeId] = useState<number | null>(null);
  const [mapInstance, setMapInstance] = useState<any | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    mood: 'Any',
    time: getInitialTime(),
    searchLocation: null,
  });
  const [locationInputValue, setLocationInputValue] = useState('');

  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    // Check if Google Maps script is loaded
    if (!window.google) {
        console.error("Google Maps API not loaded. Please check your API key.");
        return;
    }

    const map = new window.google.maps.Map(mapRef.current, {
      center: INITIAL_MAP_CENTER,
      zoom: 13,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }] // Hide default POIs for cleaner look
        }
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMapInstance(map);
  }, []);

  // 2. Initialize Autocomplete
  useEffect(() => {
    if (!searchInputRef.current || !window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
      componentRestrictions: { country: "ae" }, // Restrict to UAE
      fields: ["geometry", "name", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      const loc = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || "",
      };

      setFilters(prev => ({ ...prev, searchLocation: loc }));
      setLocationInputValue(place.name || "");
      
      // Pan map to location
      if (mapInstance) {
        mapInstance.panTo(loc);
        mapInstance.setZoom(14);
      }
    });
  }, [mapInstance]);

  // 3. Filter Logic
  useEffect(() => {
    const results = filterCafes(CAFES, filters);
    setFilteredCafes(results);
    setSelectedCafeId(null); // Reset selection on filter change
  }, [filters]);

  // 4. Update Markers when Filtered Cafes change
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing markers
    markers.forEach(m => m.setMap(null));

    const newMarkers = filteredCafes.map(cafe => {
      const marker = new window.google.maps.Marker({
        position: { lat: cafe.lat, lng: cafe.lng },
        map: mapInstance,
        title: cafe.name,
        animation: window.google.maps.Animation.DROP,
        icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#d97706", // amber-600
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff",
        }
      });

      marker.addListener("click", () => {
        setSelectedCafeId(cafe.id);
        // Optional: InfoWindow logic could go here
      });

      return marker;
    });

    setMarkers(newMarkers);

    // Re-center map bounds if results exist
    if (filteredCafes.length > 0 && !filters.searchLocation) {
        const bounds = new window.google.maps.LatLngBounds();
        filteredCafes.forEach(c => bounds.extend({lat: c.lat, lng: c.lng}));
        mapInstance.fitBounds(bounds);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCafes, mapInstance]); 
  // Excluding 'filters.searchLocation' from deps to prevent aggressive re-centering if user pans manually

  // 5. Handle Card Click
  const handleCardClick = useCallback((cafe: Cafe) => {
    setSelectedCafeId(cafe.id);
    if (mapInstance) {
      mapInstance.panTo({ lat: cafe.lat, lng: cafe.lng });
      mapInstance.setZoom(16);
    }
  }, [mapInstance]);

  const handleClearLocation = () => {
    setFilters(prev => ({ ...prev, searchLocation: null }));
    setLocationInputValue('');
    if(mapInstance) {
        mapInstance.setZoom(13);
        mapInstance.panTo(INITIAL_MAP_CENTER);
    }
  };

  return (
    <div className="flex flex-col h-full md:flex-row bg-stone-50">
      
      {/* Sidebar */}
      <div className="w-full md:w-[420px] flex flex-col h-[45vh] md:h-full border-r border-stone-200 bg-white shadow-xl z-10">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 bg-white">
            <div className="flex items-center gap-2 mb-1 text-amber-600">
                <Coffee className="w-6 h-6" />
                <h1 className="text-xl font-extrabold tracking-tight text-stone-900">Dubai Café Finder</h1>
            </div>
            <p className="text-sm text-stone-500">Find your perfect brewing spot</p>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4 bg-stone-50/50 border-b border-stone-200">
            
            {/* Search Input */}
            <div className="relative">
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Near</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-4 w-4 text-stone-400" />
                    </div>
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg leading-5 bg-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-all"
                        placeholder="Dubai Mall, JLT, etc."
                        value={locationInputValue}
                        onChange={(e) => setLocationInputValue(e.target.value)}
                    />
                    {filters.searchLocation && (
                         <button onClick={handleClearLocation} className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-stone-400 hover:text-red-500">
                            Clear
                         </button>
                    )}
                </div>
            </div>

            <div className="flex gap-4">
                {/* Mood Select */}
                <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Mood</label>
                    <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Navigation className="h-4 w-4 text-stone-400" />
                        </div>
                        <select
                            value={filters.mood}
                            onChange={(e) => setFilters(p => ({ ...p, mood: e.target.value as MoodOption }))}
                            className="block w-full pl-10 pr-8 py-2 border border-stone-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm appearance-none cursor-pointer"
                        >
                            <option value="Any">Any Mood</option>
                            <option value="Calm">Calm & Quiet</option>
                            <option value="Lively">Crowded & Lively</option>
                            <option value="Cozy">Cozy</option>
                            <option value="Work">Work / Study</option>
                            <option value="Friends">With Friends</option>
                            <option value="Family">With Family</option>
                        </select>
                    </div>
                </div>

                {/* Time Select */}
                <div className="flex-1">
                     <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">Time</label>
                     <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock className="h-4 w-4 text-stone-400" />
                        </div>
                        <select
                            value={filters.time}
                            onChange={(e) => setFilters(p => ({ ...p, time: e.target.value as TimeOption }))}
                            className="block w-full pl-10 pr-8 py-2 border border-stone-300 rounded-lg leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm appearance-none cursor-pointer"
                        >
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Evening">Evening</option>
                            <option value="Late Night">Late Night</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar bg-stone-50">
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-bold text-stone-700">Results ({filteredCafes.length})</h2>
                {filters.searchLocation && <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">Within 5km</span>}
            </div>
            
            {filteredCafes.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                    <Coffee className="mx-auto h-12 w-12 mb-3 opacity-20" />
                    <p>No cafés found matching these filters.</p>
                    <button onClick={() => setFilters({ mood: 'Any', time: getInitialTime(), searchLocation: null })} className="mt-2 text-amber-600 text-sm font-medium hover:underline">Reset Filters</button>
                </div>
            ) : (
                filteredCafes.map(cafe => (
                    <CafeCard 
                        key={cafe.id} 
                        cafe={cafe} 
                        selectedTime={filters.time}
                        onClick={() => handleCardClick(cafe)}
                        isSelected={selectedCafeId === cafe.id}
                    />
                ))
            )}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full h-[55vh] md:h-full md:flex-1 bg-stone-200 relative">
        <div ref={mapRef} className="w-full h-full" />
        {!window.google && (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-100 z-50">
                <div className="text-center p-6 max-w-sm">
                    <h3 className="text-lg font-bold text-red-600 mb-2">Map Error</h3>
                    <p className="text-sm text-stone-600">Google Maps API key is missing. Please add your key to the <code>index.html</code> file.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}

export default App;
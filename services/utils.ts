import { Cafe, FilterState, TimeOption } from '../types';

// Haversine formula to calculate distance between two coords in km
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export const isBusyAtTime = (cafe: Cafe, time: TimeOption): boolean => {
  // Simple heuristic mapping TimeOption to a representative hour
  let checkHour = 0;
  switch(time) {
    case 'Morning': checkHour = 9; break;
    case 'Afternoon': checkHour = 14; break;
    case 'Evening': checkHour = 19; break;
    case 'Late Night': checkHour = 22; break;
  }

  // Parse busy hours strings "HH:MM-HH:MM"
  return cafe.busiest_hours.some(range => {
    const [start, end] = range.split('-');
    const startH = parseInt(start.split(':')[0]);
    const endH = parseInt(end.split(':')[0]);
    return checkHour >= startH && checkHour < endH;
  });
};

export const isCalmAtTime = (cafe: Cafe, time: TimeOption): boolean => {
   // Simple heuristic: if it's not busy, and noise level isn't inherently lively, it might be calm
   const busy = isBusyAtTime(cafe, time);
   if (busy) return false;
   if (cafe.noise_level === 'lively') return false;
   return true;
}

export const filterCafes = (cafes: Cafe[], filters: FilterState): Cafe[] => {
  let result = cafes;

  // 1. Location Filter (Radius check: 5km)
  if (filters.searchLocation) {
    result = result.filter(cafe => {
      const dist = calculateDistance(
        filters.searchLocation!.lat,
        filters.searchLocation!.lng,
        cafe.lat,
        cafe.lng
      );
      return dist <= 5; // 5km radius
    });
  }

  // 2. Mood Filter
  if (filters.mood !== 'Any') {
    switch (filters.mood) {
      case 'Calm':
        result = result.filter(c => c.noise_level === 'calm');
        break;
      case 'Lively':
        result = result.filter(c => c.noise_level === 'lively');
        break;
      case 'Cozy':
        result = result.filter(c => c.cozy_score >= 4);
        break;
      case 'Work':
        result = result.filter(c => c.good_for_work && c.has_wifi);
        break;
      case 'Friends':
        result = result.filter(c => c.good_for_friends);
        break;
      case 'Family':
        result = result.filter(c => c.good_for_families);
        break;
    }
  }

  return result;
};
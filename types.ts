export interface Cafe {
  id: number;
  name: string;
  lat: number;
  lng: number;
  area: string;
  has_wifi: boolean;
  has_outlets: boolean;
  noise_level: 'calm' | 'medium' | 'lively';
  good_for_work: boolean;
  good_for_families: boolean;
  good_for_friends: boolean;
  cozy_score: number; // 1-5
  best_for_work_hours: string[]; // e.g. "09:00-12:00"
  busiest_hours: string[]; // e.g. "19:00-22:00"
  image: string; // Placeholder image URL
}

export type MoodOption = 'Any' | 'Calm' | 'Lively' | 'Cozy' | 'Work' | 'Friends' | 'Family';

export type TimeOption = 'Morning' | 'Afternoon' | 'Evening' | 'Late Night';

export interface FilterState {
  mood: MoodOption;
  time: TimeOption;
  searchLocation: {
    lat: number;
    lng: number;
    address: string;
  } | null;
}
import React from 'react';
import { Cafe, TimeOption } from '../types';
import { Wifi, Users, Coffee, Zap, Volume2, VolumeX, UserCheck } from 'lucide-react';
import { isBusyAtTime, isCalmAtTime } from '../services/utils';

interface CafeCardProps {
  cafe: Cafe;
  selectedTime: TimeOption;
  onClick: () => void;
  isSelected: boolean;
}

const CafeCard: React.FC<CafeCardProps> = ({ cafe, selectedTime, onClick, isSelected }) => {
  const isBusy = isBusyAtTime(cafe, selectedTime);
  const isCalm = isCalmAtTime(cafe, selectedTime);

  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer rounded-xl p-4 mb-4 border transition-all duration-200 flex flex-col gap-2 bg-white shadow-sm
        ${isSelected ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'border-stone-200 hover:border-amber-300 hover:shadow-md'}
      `}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg text-stone-800 leading-tight">{cafe.name}</h3>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mt-1">{cafe.area}</p>
        </div>
        {/* Simple Score Badge */}
        <div className="bg-stone-100 text-stone-600 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
          <Coffee size={12} />
          <span>{cafe.cozy_score}/5</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-1">
        {cafe.has_wifi && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-700 border border-blue-100">
            <Wifi size={10} /> WiFi
          </span>
        )}
        {cafe.good_for_work && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Zap size={10} /> Work
          </span>
        )}
         {cafe.good_for_families && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700 border border-purple-100">
            <Users size={10} /> Family
          </span>
        )}
         {cafe.noise_level === 'calm' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
            <VolumeX size={10} /> Calm
          </span>
        )}
         {cafe.noise_level === 'lively' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-700 border border-orange-100">
            <Volume2 size={10} /> Lively
          </span>
        )}
      </div>

      {/* Time Heuristic Message */}
      <div className={`mt-2 text-xs px-3 py-1.5 rounded border ${isBusy ? 'bg-red-50 text-red-700 border-red-100' : isCalm ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-gray-50 text-gray-600 border-gray-100'}`}>
        {isBusy ? (
          <span className="font-semibold">Usually busy {selectedTime.toLowerCase()}s</span>
        ) : isCalm ? (
          <span className="font-semibold">Likely calm {selectedTime.toLowerCase()}s</span>
        ) : (
           <span>Moderate activity expected</span>
        )}
      </div>
    </div>
  );
};

export default CafeCard;
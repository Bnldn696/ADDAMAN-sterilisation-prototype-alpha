import React, { useState, useMemo } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useStore } from '../hooks/useStore';

export const InstrumentSearchView: React.FC = () => {
  const { state } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    const map = new Map<string, { name: string; locations: string[]; count: number }>();

    state.boites.forEach(boite => {
      boite.instruments.forEach(inst => {
        if (inst.name.toLowerCase().includes(term)) {
          const entry = map.get(inst.name) || { name: inst.name, locations: [], count: 0 };
          if (!entry.locations.includes(boite.name)) {
            entry.locations.push(boite.name);
          }
          entry.count += 1;
          map.set(inst.name, entry);
        }
      });
    });

    return Array.from(map.values());
  }, [searchTerm, state.boites]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <Search className="h-5 w-5 text-slate-400" />
        <input 
          type="text"
          placeholder="Rechercher un instrument..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-none focus:ring-0 text-slate-900 placeholder-slate-400"
        />
      </div>

      {searchTerm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Instrument</th>
                <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Total</th>
                <th className="px-4 sm:px-6 py-3 text-left text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Boîtes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {searchResults.length > 0 ? (
                searchResults.map(res => (
                  <tr key={res.name} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-semibold text-slate-900">{res.name}</td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-slate-600 font-medium">{res.count}</td>
                    <td className="px-4 sm:px-6 py-4 text-[10px] sm:text-sm text-slate-500 italic leading-relaxed">{res.locations.join(', ')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 sm:px-6 py-8 text-center text-sm text-slate-500">Aucun instrument trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, Palette, Check, ArrowRight } from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface DominantColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: string[];
  defaultSelectedColors?: string[];
  lang: Language;
  theme: Theme;
  onApply: (selectedColors: string[]) => void;
  debugInfo?: {
    totalPixels: number;
    transparentPixels: number;
    rawVoxelCount: number;
    retainedVoxelCount: number;
    voxels: {
      index: number;
      count: number;
      avgLab: { l: number; a: number; b: number };
      hex: string;
      clusterId: number;
      isClusterRepresentative: boolean;
    }[];
    dbscanEps: number;
    dbscanMinPts: number;
  };
}

const DominantColorsModal: React.FC<DominantColorsModalProps> = ({ 
  isOpen, 
  onClose, 
  colors, 
  defaultSelectedColors = [],
  lang, 
  theme,
  onApply,
  debugInfo
}) => {
  const t = translations[lang];
  const isDark = theme === 'dark';
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Reset selection when colors change or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColors(defaultSelectedColors.length > 0 ? defaultSelectedColors : colors);
    }
  }, [isOpen, colors, defaultSelectedColors]);

  if (!isOpen) return null;

  const toggleColor = (color: string) => {
    setSelectedColors(prev => {
      if (prev.includes(color)) {
        return prev.filter(c => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  const handleApply = () => {
    onApply(selectedColors);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`
        border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 transition-all
        ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className={`
            flex justify-between items-center p-4 border-b
            ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/80'}
        `}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <Palette className="text-pink-500" size={20} />
            {t.dominant_colors_title}
          </h3>
          <button 
            type="button"
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          
          {/* Main selection section */}
          <div>
            <p className={`mb-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t.dominant_colors_desc}
            </p>
            <p className={`mb-6 text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
               {t.select_colors_instruction}
            </p>
            
            {colors.length === 0 ? (
               <p className="text-center text-slate-500 italic py-4">{t.no_colors_found}</p>
            ) : (
               <div className="max-h-64 overflow-y-auto mb-6 pr-1">
                 <div className="grid grid-cols-6 gap-3 pt-1">
                   {colors.map((color, idx) => {
                     const isSelected = selectedColors.includes(color);
                     return (
                        <div key={idx} className="flex flex-col items-center gap-1">
                            <button
                            type="button"
                            onClick={() => toggleColor(color)}
                            className={`
                                w-10 h-10 rounded-full shadow-md transition-all relative border
                                ${isDark ? 'border-slate-600' : 'border-slate-100'}
                                ${isSelected ? 'scale-110 ring-2 ring-offset-2 ring-blue-500 ring-offset-slate-800' : 'opacity-60 hover:opacity-100 scale-90'}
                            `}
                            style={{ backgroundColor: color }}
                            title={color}
                            >
                            {isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                <Check size={14} className="text-white drop-shadow-md" strokeWidth={3} />
                                </div>
                            )}
                            </button>
                        </div>
                     );
                   })}
                 </div>
               </div>
            )}

            <div className="flex justify-between items-center pt-2 gap-3 border-t border-slate-700/50 mt-4">
               <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t.cancel}
              </button>
              <button
                  type="button"
                  onClick={handleApply}
                  disabled={selectedColors.length === 0}
                  className={`
                      flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg
                      ${selectedColors.length > 0 
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20' 
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                  `}
              >
                  {t.apply_palette} ({selectedColors.length})
                  <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DominantColorsModal;
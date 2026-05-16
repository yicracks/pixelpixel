import React from 'react';
import { X, Settings as SettingsIcon, Moon, Sun, User, Mail } from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Language;
  dominantCount: number;
  setDominantCount: (n: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, theme, setTheme, lang,
  dominantCount, setDominantCount
}) => {
  const t = translations[lang];
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`
        w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border
        ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        {/* Header */}
        <div className={`
          flex justify-between items-center p-4 border-b
          ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/80'}
        `}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <SettingsIcon className={isDark ? "text-blue-400" : "text-blue-600"} size={20} />
            {t.settings}
          </h3>
          <button 
            onClick={onClose}
            className={`transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto max-h-[80vh]">
          
          {/* Theme Section */}
          <section>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.theme}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`
                  flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-medium
                  ${theme === 'dark' 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                    : (isDark ? 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')}
                `}
              >
                <Moon size={16} />
                {t.theme_dark}
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`
                  flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-sm font-medium
                  ${theme === 'light' 
                    ? 'bg-blue-500 text-white border-blue-400 shadow-lg shadow-blue-500/20' 
                    : (isDark ? 'bg-slate-700 text-slate-400 border-slate-600 hover:bg-slate-600' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')}
                `}
              >
                <Sun size={16} />
                {t.theme_light}
              </button>
            </div>
          </section>

          {/* New Settings Section */}
          <section className="space-y-6">
             {/* Dominant Count Slider */}
             <div>
                <div className="flex justify-between items-center mb-3">
                  <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {t.dominant_count_label}
                  </label>
                  <span className={`text-sm font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {dominantCount}
                  </span>
                </div>
                <input 
                  type="range"
                  min="6"
                  max="30"
                  step="1"
                  value={dominantCount}
                  onChange={(e) => setDominantCount(parseInt(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-blue-500 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}
                />
                <div className="flex justify-between mt-2 text-[10px] font-medium text-slate-500">
                  <span>6</span>
                  <span>30</span>
                </div>
             </div>
          </section>

          {/* About Us Section */}
          <div className={`pt-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
             <label className={`block text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t.about_us}
            </label>
            
            <div className={`space-y-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <User size={16} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.author}</p>
                    <p className="font-medium">Yi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <Mail size={16} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                </div>
                <div>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{t.contact}</p>
                    <p className="font-medium font-mono">cracks@yeah.net</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
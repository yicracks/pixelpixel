import React from 'react';
import { X, Settings as SettingsIcon, Moon, Sun, User, Mail, Leaf } from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Language;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, onClose, theme, setTheme, lang
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  const modalBg = theme === 'dark' 
    ? 'bg-slate-800 border-slate-700 text-white' 
    : theme === 'forest' 
      ? 'bg-[#eef5edf0] border-[#b0d0b9] text-[#163c24]' 
      : 'bg-white border-slate-200 text-slate-850';

  const modalHeaderBg = theme === 'dark'
    ? 'border-slate-700 bg-slate-800/50'
    : theme === 'forest'
      ? 'border-[#b0d0b9] bg-[#e1ecd0aa]/40'
      : 'border-slate-100 bg-slate-50/80';

  const labelColor = theme === 'dark'
    ? 'text-slate-400'
    : theme === 'forest'
      ? 'text-[#265d3a] font-bold'
      : 'text-slate-500 font-bold';

  const textMuted = theme === 'dark'
    ? 'text-slate-400'
    : theme === 'forest'
      ? 'text-[#2d573d]'
      : 'text-slate-500';

  const hrBorder = theme === 'dark'
    ? 'border-slate-700'
    : theme === 'forest'
      ? 'border-[#b0d0b9]'
      : 'border-slate-100';

  const closeButtonColor = theme === 'dark'
    ? 'text-slate-400 hover:text-white'
    : theme === 'forest'
      ? 'text-[#2d573d] hover:text-[#163c24]'
      : 'text-slate-500 hover:text-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`
        w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border
        ${modalBg}
      `}>
        {/* Header */}
        <div className={`
          flex justify-between items-center p-4 border-b
          ${modalHeaderBg}
        `}>
          <h3 className={`text-base font-semibold flex items-center gap-2`}>
            <SettingsIcon className={theme === 'dark' ? "text-blue-400" : (theme === 'forest' ? "text-emerald-600" : "text-blue-600")} size={18} />
            {t.settings}
          </h3>
          <button 
            onClick={onClose}
            className={`transition-colors ${closeButtonColor}`}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 space-y-6 overflow-y-auto max-h-[80vh]">
          
          {/* Theme Section */}
          <section>
            <label className={`block text-xs uppercase tracking-wider mb-3 ${labelColor}`}>
              {t.theme}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`
                  flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-xs font-semibold
                  ${theme === 'light' 
                    ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/10' 
                    : (theme === 'forest'
                      ? 'bg-[#f4faf6] text-[#2d573d] border-[#bcd9c4] hover:bg-[#e2f0e6]'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600')}
                `}
              >
                <Sun size={14} />
                {t.theme_light}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`
                  flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-xs font-semibold
                  ${theme === 'dark' 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/10' 
                    : (theme === 'forest'
                      ? 'bg-[#f4faf6] text-[#2d573d] border-[#bcd9c4] hover:bg-[#e2f0e6]'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')}
                `}
              >
                <Moon size={14} />
                {t.theme_dark}
              </button>
              <button
                type="button"
                onClick={() => setTheme('forest')}
                className={`
                  flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-xs font-semibold
                  ${theme === 'forest' 
                    ? 'bg-[#1b4327] text-[#ecf5ee] border-[#163c24] shadow-md shadow-emerald-950/20' 
                    : (theme === 'dark'
                      ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200')}
                `}
              >
                <Leaf size={14} />
                {t.theme_forest}
              </button>
            </div>
          </section>

          {/* About Us Section */}
          <div className={`pt-5 border-t ${hrBorder}`}>
             <label className={`block text-xs uppercase tracking-wider mb-3 ${labelColor}`}>
              {t.about_us}
            </label>
            
            <div className={`space-y-3 text-xs ${textMuted}`}>
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : (theme === 'forest' ? 'bg-[#dae9de]' : 'bg-slate-50')}`}>
                    <User size={14} className={theme === 'dark' ? 'text-slate-400' : (theme === 'forest' ? 'text-emerald-700' : 'text-slate-500')} />
                </div>
                <div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : (theme === 'forest' ? 'text-emerald-600/70' : 'text-slate-400')}`}>{t.author}</p>
                    <p className="font-semibold text-xs text-inherit">Yi</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : (theme === 'forest' ? 'bg-[#dae9de]' : 'bg-slate-50')}`}>
                    <Mail size={14} className={theme === 'dark' ? 'text-slate-400' : (theme === 'forest' ? 'text-emerald-700' : 'text-slate-500')} />
                </div>
                <div>
                    <p className={`text-[10px] ${theme === 'dark' ? 'text-slate-500' : (theme === 'forest' ? 'text-[#3e6f4f]' : 'text-slate-400')}`}>{t.contact}</p>
                    <p className="font-semibold font-mono text-xs text-inherit">cracks@yeah.net</p>
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
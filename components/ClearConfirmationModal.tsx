import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface ClearConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dontShowAgain: boolean) => void;
  lang: Language;
  theme?: Theme;
}

const ClearConfirmationModal: React.FC<ClearConfirmationModalProps> = ({ isOpen, onClose, onConfirm, lang, theme = 'dark' }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const t = translations[lang];
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`
        border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200
        ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className={`
            flex justify-between items-center p-4 border-b
            ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50/80'}
        `}>
          <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <AlertTriangle className="text-red-400" size={20} />
            {t.clearConfirmTitle}
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
          <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {t.clearConfirmText}
          </p>
          
          <label className={`flex items-center gap-2 text-sm mb-6 cursor-pointer hover:opacity-80 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <input 
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500/50 focus:ring-offset-0"
            />
            {t.dontAskAgain}
          </label>

          <div className="flex justify-end gap-3">
             <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${isDark ? 'text-slate-300 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={() => onConfirm(dontShowAgain)}
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
            >
              {t.clear_board_btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearConfirmationModal;
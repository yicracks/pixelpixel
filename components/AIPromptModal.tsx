import React, { useState } from 'react';
import { X, Wand2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
  lang?: Language; // Optional for backward compatibility if not passed immediately
}

const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose, onSubmit, isGenerating, lang = 'zh' }) => {
  const [prompt, setPrompt] = useState('');
  const t = translations[lang];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wand2 className="text-purple-400" size={20} />
            {t.ai_modal_title}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-slate-300 mb-4">
            {t.ai_modal_desc}
          </p>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t.ai_input_placeholder}
            className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none mb-4"
            autoFocus
          />

          <div className="flex justify-end gap-3">
             <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? t.generating : t.generate}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIPromptModal;
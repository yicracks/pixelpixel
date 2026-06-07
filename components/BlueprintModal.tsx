import React, { useMemo } from 'react';
import { X, Download } from 'lucide-react';
import { GridData, Language, Theme } from '../types';
import { translations } from '../utils/translations';
import { analyzeGrid, getContrastColor, downloadBlueprintPNG } from '../utils/blueprintExporter';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: GridData;
  lang: Language;
  theme: Theme;
}

const BlueprintModal: React.FC<BlueprintModalProps> = ({
  isOpen,
  onClose,
  grid,
  lang,
  theme
}) => {
  const isDark = theme === 'dark';
  const t = translations[lang];

  // Analyze the canvas grid layout
  const analysis = useMemo(() => {
    return analyzeGrid(grid);
  }, [grid]);

  const handleDownloadClick = () => {
    downloadBlueprintPNG(analysis, lang);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h2 className="text-xl font-bold">{t.analyze_blueprint}</h2>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {analysis.rows} x {analysis.cols} • {analysis.totalColors} {lang === 'zh' ? '种颜色' : 'Colors'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <div className="flex flex-col gap-10">
            
            {/* Grid Section */}
            <div className="w-full">
               <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                 {lang === 'zh' ? '设计图纸' : 'Design Blueprint'}
               </h3>
               <div className="overflow-x-auto pb-4 custom-scrollbar">
                  <div className="inline-block border border-slate-300 dark:border-slate-700 shadow-sm">
                    <table className="border-collapse table-auto">
                      <thead>
                        <tr>
                          <th className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] sticky left-0 z-10">#</th>
                          {Array.from({ length: analysis.cols }).map((_, i) => (
                            <th key={i} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] text-slate-500 font-mono">
                              {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.processedGrid.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="w-10 h-10 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] text-slate-500 font-mono text-center sticky left-0 z-10">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td 
                                key={cIdx} 
                                className="w-10 h-10 border border-slate-300 dark:border-slate-700 text-[10px] text-center font-bold"
                                style={{ 
                                  backgroundColor: cell.color !== 'transparent' ? cell.color : 'transparent',
                                  color: cell.color !== 'transparent' ? getContrastColor(cell.color) : 'transparent'
                                }}
                              >
                                {cell.index || ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </div>

            {/* Legend Section */}
            <div className="w-full border-t pt-8 dark:border-slate-800">
               <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                 {lang === 'zh' ? '颜色索引' : 'Color Index'}
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {analysis.uniqueColors.map(c => (
                   <div key={c.hex} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-md mb-0" style={{ backgroundColor: c.hex, color: getContrastColor(c.hex) }}>
                         {c.index}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {lang === 'zh' ? `颜色 ${c.index}` : `Color ${c.index}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {c.hex}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-slate-200 text-blue-700'}`}>
                            {c.count}
                          </span>
                        </div>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t flex justify-end gap-3 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
            <button 
                onClick={handleDownloadClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  analysis.totalColors > 50
                    ? 'opacity-60 cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-transparent'
                    : isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
            >
                <Download size={16} />
                {lang === 'zh' ? '下载图纸' : 'Download Blueprint'}
            </button>
            <button 
                onClick={onClose}
                className="px-6 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-colors"
            >
                {t.cancel}
            </button>
        </div>
      </div>
    </div>
  );
};

export default BlueprintModal;

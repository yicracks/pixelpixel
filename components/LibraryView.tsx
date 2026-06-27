import React, { useState } from 'react';
import { Download, ZoomIn, Sparkles } from 'lucide-react';
import { GridData, Language, Theme, EMPTY_COLOR } from '../types';
import { ADMIN_BLUEPRINTS, PreloadBlueprint } from '../utils/blueprintPreloads';
import { analyzeGrid, downloadBlueprintPNG } from '../utils/blueprintExporter';
import BlueprintModal from './BlueprintModal';

interface LibraryViewProps {
  lang: Language;
  theme: Theme;
  currentGrid: GridData;
  onLoadGrid: (newGrid: GridData) => void;
  onNavigateToCanvas: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  lang,
  theme,
  onLoadGrid,
  onNavigateToCanvas
}) => {
  const isZh = lang === 'zh';
  const [selectedBlueprintForPreview, setSelectedBlueprintForPreview] = useState<PreloadBlueprint | null>(null);

  // Handle pixel grid layout PNG drawing download or direct image preset download
  const handleDownloadClick = async (item: PreloadBlueprint) => {
    if (item.isImage && item.imageSrc) {
      try {
        const response = await fetch(item.imageSrc);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${item.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (error) {
        console.error('Fallback download for LibraryView image:', error);
        const link = document.createElement('a');
        link.href = item.imageSrc;
        link.download = `${item.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (item.gridData) {
      const analysis = analyzeGrid(item.gridData);
      downloadBlueprintPNG(analysis, lang);
    }
  };

  // Convert and apply theme layout classes
  const containerClass = theme === 'dark'
    ? 'text-slate-100'
    : theme === 'forest'
      ? 'text-[#13351e]'
      : 'text-slate-800';

  const cardBgClass = theme === 'dark'
    ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
    : theme === 'forest'
      ? 'bg-[#f4faf5be] border-[#bcd9c4] hover:bg-[#eaf4ed] hover:border-[#9dc0a7]'
      : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300';

  const previewBg = theme === 'dark'
    ? 'bg-slate-950/40 border-slate-850'
    : theme === 'forest'
      ? 'bg-[#e4eddcaa]/60 border-[#bcd9c4]/60'
      : 'bg-slate-50 border-slate-150';

  return (
    <div className={`w-full max-w-5xl mx-auto px-4 py-8 md:py-12 ${containerClass}`}>
      
      {/* Visual Header */}
      <div className="text-center mb-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Sparkles size={14} className="animate-pulse" />
          {isZh ? '官方精选图纸库' : 'Curated Blueprint Archive'}
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {isZh ? '📐 官方画板图纸下载中心' : '📐 Curated Blueprint Center'}
        </h2>
        <p className="text-sm opacity-80 leading-relaxed">
          {isZh 
            ? '提供官方精心预置的复古艺术像素拼豆图纸。点击一键预览或下载带有清晰序号的高清原厂结构与高分辨率图纸！' 
            : 'Predefined artwork curated by administration. Enjoy previewing or downloading high-resolution templates.'}
        </p>
      </div>

      {/* Grid of Curated Preset Files */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ADMIN_BLUEPRINTS.map((item) => {
          const isImage = item.isImage;
          const rows = item.gridData ? item.gridData.length : (item.targetRows || 32);
          const cols = item.gridData && item.gridData.length > 0 ? item.gridData[0].length : (item.targetCols || 32);
          const title = isZh ? item.nameZh : item.nameEn;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row gap-5 items-center sm:items-start ${cardBgClass}`}
            >
              {/* Miniature visual rendering */}
              <button
                onClick={() => setSelectedBlueprintForPreview(item)}
                className={`w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border flex items-center justify-center p-2.5 shrink-0 cursor-pointer hover:scale-105 hover:shadow-md active:scale-95 transition-all duration-250 relative group ${previewBg}`}
                title={isZh ? '点击查看高清大图图纸' : 'Click to preview high-res blueprint'}
              >
                {isImage && item.imageSrc ? (
                  <img 
                    src={item.imageSrc} 
                    className="w-full h-full object-contain rounded-xl" 
                    referrerPolicy="no-referrer"
                    alt={title}
                  />
                ) : item.gridData ? (
                  <div 
                    className="grid gap-0.5 w-full h-full" 
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                  >
                    {item.gridData.map((row, rIdx) => 
                      row.map((color, cIdx) => (
                        <div 
                          key={`${rIdx}-${cIdx}`}
                          className="w-full h-full rounded-[1px]"
                          style={{ 
                            backgroundColor: color === EMPTY_COLOR || color === 'transparent' 
                              ? 'transparent' 
                              : color 
                          }}
                        />
                      ))
                    )}
                  </div>
                ) : null}
                {/* Hover overlay indicator */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity duration-200">
                  <ZoomIn className="text-white drop-shadow-md" size={24} />
                </div>
              </button>

              {/* Title and details with actions */}
              <div className="flex-1 flex flex-col justify-between h-full min-w-0 w-full sm:text-left text-center">
                <div>
                  <h3 className="font-extrabold text-base tracking-tight truncate" title={title}>
                    {title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2 items-center justify-center sm:justify-start">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${theme === 'dark' ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      📐 {isZh ? (isImage ? '像素图' : '格点') : (isImage ? 'image' : 'grid')}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-bold">
                      ✓ {isZh ? '就绪' : 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Smaller and less prominent download action button */}
                <div className="mt-5 flex justify-center sm:justify-start">
                  <button
                    onClick={() => handleDownloadClick(item)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-85 transition-all border shrink-0 ${
                      theme === 'dark'
                        ? 'bg-slate-800/65 border-slate-700 text-slate-300 hover:bg-slate-700'
                        : theme === 'forest'
                          ? 'bg-[#ecf5ee] border-[#b0d0b9] text-[#13351e] hover:bg-[#dae9de]'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm'
                    }`}
                    title={isZh ? '下载高清带颜色序号图纸' : 'Download high-res numbered template'}
                  >
                    <Download size={13} className="text-blue-500 dark:text-blue-400" />
                    <span>{isZh ? '下载图纸' : 'Download'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Blueprint View Modal Overlay */}
      {selectedBlueprintForPreview && (
        <BlueprintModal
          isOpen={true}
          onClose={() => setSelectedBlueprintForPreview(null)}
          grid={selectedBlueprintForPreview.gridData}
          isImage={selectedBlueprintForPreview.isImage}
          imageSrc={selectedBlueprintForPreview.imageSrc}
          lang={lang}
          theme={theme}
        />
      )}

    </div>
  );
};

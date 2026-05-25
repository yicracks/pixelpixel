import React, { useMemo } from 'react';
import { X, Download } from 'lucide-react';
import { GridData, Language, Theme, EMPTY_COLOR } from '../types';
import { translations } from '../utils/translations';

interface BlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  grid: GridData;
  lang: Language;
  theme: Theme;
}

const handleDownloadBlueprint = (analysis: any, lang: Language) => {
  const cellSize = 40;
  const padding = 60;
  const headerSize = 40;
  const legendItemWidth = 180;
  const legendItemHeight = 60;
  const legendCols = 5;
  
  const gridWidth = analysis.cols * cellSize;
  const gridHeight = analysis.rows * cellSize;
  
  // Calculate legend dimensions
  const legendRows = Math.ceil(analysis.uniqueColors.length / legendCols);
  const legendHeight = legendRows * legendItemHeight + 60; // Title + Items
  
  const canvasWidth = Math.max(gridWidth + headerSize + padding * 2, legendCols * legendItemWidth + padding * 2);
  const canvasHeight = gridHeight + headerSize + legendHeight + padding * 3;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.translate(padding, padding);

  // --- Draw Title ---
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(`${lang === 'zh' ? '像素设计图纸' : 'Pixel Design Blueprint'} (${analysis.rows}x${analysis.cols})`, 0, -20);
  
  // --- Draw Grid Headers ---
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Corner box
  ctx.strokeRect(0, 0, headerSize, headerSize);
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(1, 1, headerSize - 2, headerSize - 2);
  ctx.fillStyle = '#64748b';
  ctx.fillText('#', headerSize / 2, headerSize / 2);

  // Column labels
  for (let c = 0; c < analysis.cols; c++) {
    const x = headerSize + c * cellSize;
    ctx.strokeRect(x, 0, cellSize, headerSize);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(x + 1, 1, cellSize - 2, headerSize - 2);
    ctx.fillStyle = '#64748b';
    ctx.fillText((c + 1).toString(), x + cellSize / 2, headerSize / 2);
  }

  // Row labels and Cells
  analysis.processedGrid.forEach((row: any[], rIdx: number) => {
    const y = headerSize + rIdx * cellSize;
    
    // Row label
    ctx.strokeRect(0, y, headerSize, cellSize);
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(1, y + 1, headerSize - 2, cellSize - 2);
    ctx.fillStyle = '#64748b';
    ctx.fillText((rIdx + 1).toString(), headerSize / 2, y + cellSize / 2);

    // Cells
    row.forEach((cell, cIdx) => {
      const x = headerSize + cIdx * cellSize;
      ctx.strokeRect(x, y, cellSize, cellSize);
      
      if (cell.color !== 'transparent') {
        ctx.fillStyle = cell.color;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
        
        ctx.fillStyle = getContrastColor(cell.color);
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(cell.index.toString(), x + cellSize / 2, y + cellSize / 2);
      }
    });
  });

  // --- Draw Legend ---
  const legendY = gridHeight + headerSize + padding;
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(lang === 'zh' ? '颜色索引 / COLOR INDEX' : 'COLOR INDEX', 0, legendY);

  analysis.uniqueColors.forEach((c: any, i: number) => {
    const row = Math.floor(i / legendCols);
    const col = i % legendCols;
    const lx = col * legendItemWidth;
    const ly = legendY + 30 + row * legendItemHeight;

    // Color Box
    ctx.fillStyle = c.hex;
    ctx.beginPath();
    ctx.roundRect(lx, ly, 36, 36, 8);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 4;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = getContrastColor(c.hex);
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.index.toString(), lx + 18, ly + 18);

    // Text Data
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${lang === 'zh' ? '颜色' : 'Color'} ${c.index}`, lx + 48, ly + 4);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.fillText(c.hex, lx + 48, ly + 18);
    
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`${c.count} pcs`, lx + 48, ly + 30);
  });

  // --- Finalize and Download ---
  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = `blueprint_${analysis.rows}x${analysis.cols}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const BlueprintModal: React.FC<BlueprintModalProps> = ({
  isOpen,
  onClose,
  grid,
  lang,
  theme
}) => {
  const isDark = theme === 'dark';
  const t = translations[lang];

  // Analysis Logic
  const analysis = useMemo(() => {
    let minRow = grid.length;
    let maxRow = -1;
    let minCol = grid[0]?.length || 0;
    let maxCol = -1;

    grid.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        if (cell !== EMPTY_COLOR && cell !== 'transparent') {
          if (rIdx < minRow) minRow = rIdx;
          if (rIdx > maxRow) maxRow = rIdx;
          if (cIdx < minCol) minCol = cIdx;
          if (cIdx > maxCol) maxCol = cIdx;
        }
      });
    });

    const hasDrawing = maxRow >= 0 && maxCol >= 0;
    const croppedGrid = hasDrawing
      ? grid.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1))
      : grid;

    const colorMap = new Map<string, { index: number; count: number }>();
    let colorIndex = 1;
    const processedGrid: { color: string; index: number | null }[][] = [];

    // First pass: identify unique colors (excluding empty)
    croppedGrid.forEach((row, rIdx) => {
      processedGrid[rIdx] = [];
      row.forEach((cell, cIdx) => {
        if (cell === EMPTY_COLOR || cell === 'transparent') {
          processedGrid[rIdx][cIdx] = { color: 'transparent', index: null };
        } else {
          if (!colorMap.has(cell)) {
            colorMap.set(cell, { index: colorIndex++, count: 0 });
          }
          const colorData = colorMap.get(cell)!;
          colorData.count++;
          processedGrid[rIdx][cIdx] = { color: cell, index: colorData.index };
        }
      });
    });

    const uniqueColors = Array.from(colorMap.entries()).map(([hex, data]) => ({
      hex,
      index: data.index,
      count: data.count
    }));

    return {
      processedGrid,
      uniqueColors,
      totalColors: uniqueColors.length,
      rows: croppedGrid.length,
      cols: croppedGrid[0]?.length || 0
    };
  }, [grid]);

  const handleDownloadClick = () => {
    if (analysis.totalColors > 50) {
      alert(lang === 'zh' ? '颜色过多无法使用图纸，请先回主页面点击识别主要色彩' : 'Too many colors to use the blueprint, please return to the main page and click "Identify Main Colors" first.');
      return;
    }
    handleDownloadBlueprint(analysis, lang);
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
            
            {/* Grid Section - Now supports full horizontal scroll */}
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
                                className={`w-10 h-10 border border-slate-300 dark:border-slate-700 text-[10px] text-center font-bold`}
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

            {/* Legend Section - Now below the grid */}
            <div className="w-full border-t pt-8 dark:border-slate-800">
               <h3 className={`text-xs font-bold uppercase tracking-wider mb-6 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                 {lang === 'zh' ? '颜色索引' : 'Color Index'}
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 {analysis.uniqueColors.map(c => (
                   <div key={c.hex} className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800/50 hover:bg-slate-800' : 'bg-slate-50 hover:bg-slate-100'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shadow-md mb-0`} style={{ backgroundColor: c.hex, color: getContrastColor(c.hex) }}>
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
                {lang === 'zh' ? '下载图纸数据' : 'Download Blueprint Data'}
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

// Helper to determine text color based on background
function getContrastColor(hexcolor: string) {
	if (hexcolor === 'transparent') return '#000000';
	const hex = hexcolor.replace("#", "");
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
	return (yiq >= 128) ? 'black' : 'white';
}

export default BlueprintModal;

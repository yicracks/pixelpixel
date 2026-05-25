import React, { useState, useEffect } from 'react';
import { 
  Pencil, 
  Eraser, 
  Pipette, 
  Grid3X3, 
  Square,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  PaintBucket,
  Sparkles
} from 'lucide-react';
import { ToolType, APP_CONFIG, BoardStyle, Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface ToolbarProps {
  tool: ToolType;
  setTool: (t: ToolType) => void;
  activeColor: string;
  setActiveColor: (c: string) => void;
  gridSize: number;
  setGridSize: (s: number) => void;
  showGridLines: boolean;
  setShowGridLines: (v: boolean) => void;
  boardStyle: BoardStyle;
  setBoardStyle: (s: BoardStyle) => void;
  beadSize: number;
  setBeadSize: (s: number) => void;
  lang: Language;
  theme: Theme;
  onDenoise: () => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  tool, setTool,
  activeColor, setActiveColor,
  gridSize, setGridSize,
  showGridLines, setShowGridLines,
  boardStyle, setBoardStyle,
  beadSize, setBeadSize,
  lang,
  theme,
  onDenoise,
  brushSize,
  setBrushSize
}) => {
  const isDark = theme === 'dark';
  const [customSize, setCustomSize] = useState<string>(gridSize.toString());
  
  // Recent Colors State
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState<boolean>(true);

  const t = translations[lang];

  // Sync local input when external grid size changes
  useEffect(() => {
    setCustomSize(gridSize.toString());
  }, [gridSize]);

  // Track active color usage for history
  useEffect(() => {
    if (!activeColor || activeColor === 'transparent') return;

    const handler = setTimeout(() => {
      setRecentColors(prev => {
        // If the color is already the most recent, do nothing
        if (prev[0] === activeColor) return prev;
        // Otherwise, move it to front or add it
        const filtered = prev.filter(c => c !== activeColor);
        return [activeColor, ...filtered].slice(0, 12); // Limit to 12 colors
      });
    }, 500); // Debounce to capture final color after picking

    return () => clearTimeout(handler);
  }, [activeColor]);

  const handleCustomSizeCommit = () => {
    let val = parseInt(customSize, 10);
    
    if (isNaN(val)) {
      setCustomSize(gridSize.toString());
      return;
    }

    // Enforce limits from config
    if (val < APP_CONFIG.MIN_GRID_SIZE) val = APP_CONFIG.MIN_GRID_SIZE;
    if (val > APP_CONFIG.MAX_GRID_SIZE) val = APP_CONFIG.MAX_GRID_SIZE;

    setCustomSize(val.toString());
    if (val !== gridSize) {
      setGridSize(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomSizeCommit();
      (e.target as HTMLInputElement).blur();
    }
  };

  const colors = [
    '#000000', '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57',
    '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f',
    '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2',
    '#566c86', '#333c57'
  ];

  // Styles based on theme
  const containerClass = isDark 
    ? 'bg-slate-800/50 border-slate-700 text-slate-100' 
    : 'bg-white/80 border-slate-200 text-slate-800 shadow-slate-200';
  
  const labelClass = isDark ? 'text-slate-400' : 'text-slate-500';
  
  const inputContainerClass = isDark 
    ? 'bg-slate-900/50 border-slate-700/50' 
    : 'bg-slate-100 border-slate-200';

  const inputTextClass = isDark ? 'text-white' : 'text-slate-800';

  return (
    <div className={`flex flex-col gap-6 p-5 backdrop-blur-xl border rounded-2xl shadow-xl w-full max-w-[min(320px,88vw)] h-fit overflow-y-auto max-h-[90vh] transition-colors duration-300 ${containerClass}`}>
      
      {/* --- Size Selector --- */}
      <div>
        <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${labelClass}`}>
          {t.size_label}
        </label>
        <div className="flex flex-col gap-3">
          {/* Slider input */}
          <div className="flex flex-col gap-1.5 px-0.5">
            <input 
              type="range"
              min={APP_CONFIG.MIN_GRID_SIZE}
              max={APP_CONFIG.MAX_GRID_SIZE}
              step={1}
              value={gridSize}
              onChange={(e) => {
                const val = Number(e.target.value);
                setGridSize(val);
                setCustomSize(val.toString());
              }}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
              <span>{APP_CONFIG.MIN_GRID_SIZE} px</span>
              <span className="font-bold text-blue-500">{gridSize} px</span>
              <span>{APP_CONFIG.MAX_GRID_SIZE} px</span>
            </div>
          </div>
          
          {/* Custom Input */}
          <div className={`flex items-center gap-2 p-2 rounded-lg border ${inputContainerClass}`}>
             <span className={`text-xs font-medium whitespace-nowrap px-1 ${labelClass}`}>{t.custom_size}:</span>
             <input 
                type="number"
                min={APP_CONFIG.MIN_GRID_SIZE}
                max={APP_CONFIG.MAX_GRID_SIZE}
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onBlur={handleCustomSizeCommit}
                onKeyDown={handleKeyDown}
                className={`w-full bg-transparent text-sm text-right focus:outline-none placeholder-slate-400 ${inputTextClass}`}
                placeholder={`${APP_CONFIG.MIN_GRID_SIZE}-${APP_CONFIG.MAX_GRID_SIZE}`}
             />
             <span className="text-xs text-slate-400 pr-1">px</span>
          </div>
        </div>
      </div>

      {/* --- Board Style --- */}
      <div>
        <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${labelClass}`}>{t.board_style}</label>
        <div className="grid grid-cols-3 gap-2">
           <ToolButton 
             active={boardStyle === BoardStyle.SQUARE}
             onClick={() => setBoardStyle(BoardStyle.SQUARE)}
             icon={<Square size={18} />}
             label={t.style_square}
             theme={theme}
           />
           <ToolButton 
             active={boardStyle === BoardStyle.BEAD}
             onClick={() => setBoardStyle(BoardStyle.BEAD)}
             icon={<Circle size={18} />}
             label={t.style_bead}
             theme={theme}
           />
           <ToolButton 
             active={showGridLines} 
             onClick={() => setShowGridLines(!showGridLines)} 
             icon={<Grid3X3 size={18} />} 
             label={t.tool_grid}
             theme={theme}
           />
        </div>
      </div>

      {/* --- Tools --- */}
      <div>
        <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${labelClass}`}>{t.tools_label}</label>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton 
            active={tool === ToolType.PEN} 
            onClick={() => setTool(ToolType.PEN)} 
            icon={<Pencil size={18} />} 
            label={t.tool_pen}
            theme={theme}
          />
          <ToolButton 
            active={tool === ToolType.ERASER} 
            onClick={() => setTool(ToolType.ERASER)} 
            icon={<Eraser size={18} />} 
            label={t.tool_eraser}
            theme={theme}
          />
          <ToolButton 
            active={tool === ToolType.EYEDROPPER} 
            onClick={() => setTool(ToolType.EYEDROPPER)} 
            icon={<Pipette size={18} />} 
            label={t.tool_pick}
            theme={theme}
          />
          <ToolButton 
            active={tool === ToolType.FILL} 
            onClick={() => setTool(ToolType.FILL)} 
            icon={<PaintBucket size={18} />} 
            label={t.tool_fill}
            theme={theme}
          />
          <ToolButton 
            active={tool === ToolType.FLOOD_ERASE} 
            onClick={() => setTool(ToolType.FLOOD_ERASE)} 
            icon={
              <div className="relative w-5 h-5 flex items-center justify-center">
                <PaintBucket size={18} className="opacity-80" />
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded p-[1px] shadow-sm flex items-center justify-center border border-white dark:border-slate-800 scale-90">
                  <Eraser size={8} strokeWidth={3} />
                </div>
              </div>
            } 
            label={t.tool_flood_erase}
            theme={theme}
          />
          <ToolButton 
            active={false} 
            onClick={onDenoise} 
            icon={<Sparkles size={18} className="text-amber-400" />} 
            label={t.tool_denoise}
            theme={theme}
          />
        </div>

        {/* Brush/Eraser size slider shown if PEN or ERASER is selected */}
        {(tool === ToolType.PEN || tool === ToolType.ERASER) && (
          <div className="mt-3 p-3 rounded-xl bg-slate-100/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex justify-between items-center mb-1.5">
              <span className={`text-[11px] font-semibold ${labelClass}`}>{t.brush_size}</span>
              <span className="text-xs font-mono font-bold text-blue-500">{brushSize} px</span>
            </div>
            <input 
              type="range"
              min={1}
              max={20}
              step={1}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`}
            />
          </div>
        )}
      </div>

      {/* --- Colors --- */}
      <div>
        <label className={`text-xs font-semibold uppercase tracking-wider mb-2 block ${labelClass}`}>{t.palette_label}</label>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {colors.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setActiveColor(c)}
              className={`
                w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                ${activeColor === c ? 'border-white ring-2 ring-blue-500' : 'border-transparent'}
              `}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-slate-700/50' : 'bg-slate-200/50'}`}>
          <input 
            type="color" 
            value={activeColor}
            onChange={(e) => setActiveColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border-none p-0"
          />
          <span className={`text-xs font-mono uppercase ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{activeColor}</span>
        </div>
      </div>

      {/* --- Recent Colors --- */}
      {recentColors.length > 0 && (
          <div className={`pt-2 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
            <button 
                type="button"
                onClick={() => setShowRecent(!showRecent)}
                className={`flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider mb-2 transition-colors ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <span className="flex items-center gap-1.5">
                    <Clock size={12} />
                    {t.recent_label}
                </span>
                {showRecent ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            {showRecent && (
                <div className="grid grid-cols-6 gap-2 mb-3 animate-in fade-in slide-in-from-top-1 duration-200">
                {recentColors.map(c => (
                    <button
                    key={c}
                    type="button"
                    onClick={() => setActiveColor(c)}
                    className={`
                        w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shadow-sm
                        ${activeColor === c ? 'border-white ring-2 ring-blue-500/50' : (isDark ? 'border-slate-600/50' : 'border-slate-300')}
                    `}
                    style={{ backgroundColor: c }}
                    title={c}
                    />
                ))}
                </div>
            )}
          </div>
      )}
    </div>
  );
};

// --- Sub-components for styling ---

const ToolButton = ({ active, onClick, icon, label, theme, text }: any) => {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`
        flex items-center justify-center gap-2 p-3 rounded-xl transition-all w-full
        ${active 
          ? (isDark ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/25')
          : (isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800')}
      `}
    >
      {icon}
      {text && <span className="text-xs font-semibold whitespace-nowrap">{text}</span>}
    </button>
  );
};

export default Toolbar;

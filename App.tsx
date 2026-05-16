import React, { useState, useEffect, useCallback } from 'react';
import { Undo2, Redo2, Languages, Settings as SettingsIcon, Image as ImageIcon, Palette, Trash2, Download, Search } from 'lucide-react';
import Grid from './components/Grid';
import Toolbar from './components/Toolbar';
import ClearConfirmationModal from './components/ClearConfirmationModal';
import SettingsModal from './components/SettingsModal';
import DominantColorsModal from './components/DominantColorsModal';
import BlueprintModal from './components/BlueprintModal';
import { GridData, ToolType, DEFAULT_COLOR, EMPTY_COLOR, BoardStyle, Language, Theme, APP_CONFIG } from './types';
import { processImageToGrid, exportGridToImage } from './utils/imageHelper';
import { translations } from './utils/translations';
import { reduceGridToAverageColors, getDominantColors, applyPaletteToGrid } from './utils/colorUtils';

// Helper to create a fresh grid
const createGrid = (size: number): GridData => {
  return Array(size).fill(null).map(() => Array(size).fill(EMPTY_COLOR));
};

const App: React.FC = () => {
  // Language & Theme State
  const [lang, setLang] = useState<Language>('zh');
  const [theme, setTheme] = useState<Theme>('dark');
  
  // State
  const [gridSize, setGridSize] = useState<number>(APP_CONFIG.DEFAULT_GRID_SIZE);
  // Initialize grid immediately with the default size
  const [grid, setGrid] = useState<GridData>(() => createGrid(APP_CONFIG.DEFAULT_GRID_SIZE));
  const [activeColor, setActiveColor] = useState<string>(DEFAULT_COLOR);
  const [tool, setTool] = useState<ToolType>(ToolType.PEN);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [boardStyle, setBoardStyle] = useState<BoardStyle>(BoardStyle.SQUARE);
  const [beadSize, setBeadSize] = useState<number>(APP_CONFIG.DEFAULT_BEAD_SIZE); // Percentage 20-100

  // New Settings State
  const [dominantColorCount, setDominantColorCount] = useState<number>(10);

  // History State
  const [history, setHistory] = useState<GridData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modal States
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [skipClearConfirm, setSkipClearConfirm] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Dominant Colors Modal State
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [dominantColors, setDominantColors] = useState<string[]>([]);

  // Blueprint Modal State
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);

  // Get current translations
  const t = translations[lang];
  const isDark = theme === 'dark';

  // Initialize history on first load or reset
  useEffect(() => {
    const initialGrid = createGrid(gridSize);
    setGrid(initialGrid);
    setHistory([initialGrid]);
    setHistoryIndex(0);
  }, [gridSize]); // Reset everything when grid size changes

  // History Helper: Add current grid state to history
  const addToHistory = useCallback((newGridState: GridData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      // More efficient copy: shallow copy of rows
      const copy = newGridState.map(row => [...row]);
      newHistory.push(copy);
      
      // Limit history size to 50 steps to prevent memory issues
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Handle Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const historyState = history[newIndex];
      if (historyState) {
          setHistoryIndex(newIndex);
          setGrid(historyState.map(row => [...row]));
      }
    }
  };

  // Handle Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const historyState = history[newIndex];
      if (historyState) {
          setHistoryIndex(newIndex);
          setGrid(historyState.map(row => [...row]));
      }
    }
  };

  // Handlers
  const handleStrokeEnd = () => {
    addToHistory(grid);
  };

  // Logic to actually perform the clear operation
  const performClear = () => {
    const newGrid = createGrid(gridSize);
    setGrid(newGrid);
    addToHistory(newGrid);
    setIsClearModalOpen(false);
  };

  // Triggered when user clicks "Clear" in toolbar
  const handleClearRequest = () => {
    if (skipClearConfirm) {
        performClear();
    } else {
        setIsClearModalOpen(true);
    }
  };

  // Triggered when user confirms in the modal
  const handleConfirmClear = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
        setSkipClearConfirm(true);
    }
    performClear();
  };

  const handleDownload = () => {
    exportGridToImage(grid);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const newGrid = await processImageToGrid(file, gridSize, gridSize);
      setGrid(newGrid);
      addToHistory(newGrid);
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error("Failed to process image", error);
      alert(t.error_processing_alert);
    }
  };

  const handleIdentifyColors = () => {
    const colors = getDominantColors(grid, dominantColorCount);
    setDominantColors(colors);
    setIsColorModalOpen(true);
  };

  const handleApplyPalette = (selectedColors: string[]) => {
    const newGrid = applyPaletteToGrid(grid, selectedColors);
    setGrid(newGrid);
    addToHistory(newGrid);
    setIsColorModalOpen(false);
  };

  const toggleLanguage = () => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-3 md:p-8 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-500 ${isDark ? 'bg-blue-600/10' : 'bg-blue-400/20'}`}></div>
         <div className={`absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-500 ${isDark ? 'bg-purple-600/10' : 'bg-purple-400/20'}`}></div>
      </div>

      <header className="mb-6 md:mb-8 z-10 text-center relative w-full max-w-6xl px-2">
        {/* Desktop Controls */}
        <div className="absolute right-0 top-0 hidden md:flex items-center gap-2">
            <button 
                onClick={toggleLanguage}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors text-xs font-medium ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
            >
                <Languages size={14} />
                {lang === 'zh' ? 'EN' : '中文'}
            </button>
            <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className={`p-1.5 rounded-full border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
            >
                <SettingsIcon size={14} />
            </button>
        </div>

        {/* Mobile Controls */}
        <div className="absolute right-0 top-[-10px] md:hidden flex gap-2">
            <button 
                onClick={toggleLanguage}
                className={`p-2 rounded-full border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
            >
                <Languages size={16} />
            </button>
             <button 
                onClick={() => setIsSettingsModalOpen(true)}
                className={`p-2 rounded-full border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
            >
                <SettingsIcon size={16} />
            </button>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
          {t.title}
        </h1>
        <p className={isDark ? "text-slate-400" : "text-slate-500"}>{t.subtitle}</p>
      </header>

      <main className="w-full max-w-6xl z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start justify-center">
        
        {/* Left Control Panel (Mobile: Top) */}
        <section className="w-full md:w-auto order-2 md:order-1 flex justify-center">
          <Toolbar 
            tool={tool}
            setTool={setTool}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            gridSize={gridSize}
            setGridSize={setGridSize}
            onClear={handleClearRequest}
            onDownload={handleDownload}
            onUpload={handleUpload}
            onIdentifyColors={handleIdentifyColors}
            showGridLines={showGridLines}
            setShowGridLines={setShowGridLines}
            boardStyle={boardStyle}
            setBoardStyle={setBoardStyle}
            beadSize={beadSize}
            setBeadSize={setBeadSize}
            lang={lang}
            theme={theme}
          />
        </section>

        {/* Center Canvas */}
        <section className={`flex-1 order-1 md:order-2 p-3 md:p-8 rounded-2xl md:rounded-3xl border shadow-2xl backdrop-blur-sm flex flex-col items-center transition-colors duration-300 ${isDark ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/60 border-slate-200'}`}>
           
           {/* Canvas Header (Icons + Undo/Redo/Clear) */}
           <div className="w-full flex items-center justify-between mb-6">
              {/* Top Left: Upload + Palette */}
              <div className="flex gap-2">
                  <div className="relative">
                    <input 
                      type="file" 
                      id="grid-upload-input"
                      onChange={handleUpload}
                      accept="image/*"
                      className="hidden" 
                    />
                    <button 
                      onClick={() => document.getElementById('grid-upload-input')?.click()}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      title={t.upload_image}
                    >
                      <ImageIcon size={20} />
                    </button>
                  </div>
                  <button 
                    onClick={handleIdentifyColors}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    title={t.identify_colors}
                  >
                    <Palette size={20} />
                  </button>
              </div>

              {/* Top Right: Undo + Redo + Clear */}
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:hover:bg-white'}`}
                  title={t.undo}
                >
                  <Undo2 size={20} />
                </button>
                <button 
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:hover:bg-white'}`}
                  title={t.redo}
                >
                  <Redo2 size={20} />
                </button>
                <button 
                  type="button"
                  onClick={handleClearRequest}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-100'}`}
                  title={t.clear}
                >
                  <Trash2 size={20} />
                </button>
              </div>
           </div>

           <Grid 
             grid={grid}
             setGrid={setGrid}
             activeColor={activeColor}
             setActiveColor={setActiveColor}
             tool={tool}
             showGridLines={showGridLines}
             boardStyle={boardStyle}
             beadSize={beadSize}
             onStrokeEnd={handleStrokeEnd}
             lang={lang}
             theme={theme}
           />

           {/* Canvas Footer (Save + Analyze) */}
           <div className="w-full flex justify-center gap-4 mt-8">
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                <Download size={18} />
                {t.save_image}
              </button>
              <button 
                onClick={() => setIsBlueprintModalOpen(true)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'}`}
              >
                <Search size={18} />
                {t.analyze_blueprint}
              </button>
           </div>
        </section>

      </main>

      <footer className={`mt-12 text-sm z-10 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
        <p>{t.footer_text}</p>
      </footer>

      {/* Modals */}
      <ClearConfirmationModal 
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        lang={lang}
        theme={theme}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        theme={theme}
        setTheme={setTheme}
        lang={lang}
        dominantCount={dominantColorCount}
        setDominantCount={setDominantColorCount}
      />

      <DominantColorsModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        colors={dominantColors}
        lang={lang}
        theme={theme}
        onApply={handleApplyPalette}
      />

      <BlueprintModal 
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        grid={grid}
        lang={lang}
        theme={theme}
      />
    </div>
  );
};

export default App;
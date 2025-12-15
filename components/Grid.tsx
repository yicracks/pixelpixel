import React, { useRef, useEffect } from 'react';
import { GridData, ToolType, EMPTY_COLOR, BoardStyle, Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface GridProps {
  grid: GridData;
  setGrid: React.Dispatch<React.SetStateAction<GridData>>;
  activeColor: string;
  setActiveColor: (c: string) => void;
  tool: ToolType;
  showGridLines: boolean;
  boardStyle: BoardStyle;
  beadSize: number;
  onStrokeEnd?: () => void;
  lang: Language;
  theme: Theme;
}

const Grid: React.FC<GridProps> = ({ 
  grid, 
  setGrid, 
  activeColor, 
  setActiveColor,
  tool, 
  showGridLines,
  boardStyle,
  beadSize,
  onStrokeEnd,
  lang,
  theme
}) => {
  const isDrawing = useRef(false);
  const t = translations[lang];
  const isDark = theme === 'dark';

  // Safety check: Ensure grid is populated before rendering
  if (!grid || grid.length === 0 || !grid[0]) {
    return (
        <div className={`flex items-center justify-center w-64 h-64 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {t.loading}
        </div>
    );
  }

  // Helper to paint a specific cell
  const paintCell = (rowIndex: number, colIndex: number) => {
    if (rowIndex < 0 || rowIndex >= grid.length || colIndex < 0 || colIndex >= grid[0].length) return;
    
    // Optimization: Don't update state if color is identical
    const currentColor = grid[rowIndex][colIndex];
    let targetColor = activeColor;
    
    if (tool === ToolType.ERASER) {
      targetColor = EMPTY_COLOR;
    } else if (tool === ToolType.EYEDROPPER) {
        if (currentColor !== EMPTY_COLOR) {
            setActiveColor(currentColor);
        }
        return; // Don't paint
    }

    if (currentColor === targetColor) return;

    setGrid(prev => {
      const newGrid = [...prev]; // Shallow copy outer
      newGrid[rowIndex] = [...prev[rowIndex]]; // Copy row
      newGrid[rowIndex][colIndex] = targetColor;
      return newGrid;
    });
  };

  const handleMouseDown = (r: number, c: number) => {
    isDrawing.current = true;
    paintCell(r, c);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (isDrawing.current) {
      paintCell(r, c);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing.current) {
      isDrawing.current = false;
      if (onStrokeEnd) onStrokeEnd();
    }
  };

  // Global mouse up to catch drags that go outside
  useEffect(() => {
    const handleGlobalMouseUp = () => { 
        if (isDrawing.current) {
            isDrawing.current = false; 
            if (onStrokeEnd) onStrokeEnd();
        }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [onStrokeEnd]);

  const isBead = boardStyle === BoardStyle.BEAD;
  
  // Dynamic Styles
  const containerClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200';
  const gridLineClass = isDark ? 'border-slate-700/50' : 'border-slate-200';
  const emptyPegClass = isDark ? 'bg-slate-700 shadow-inner' : 'bg-slate-200 shadow-inner';
  const bgPatternColor = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <div 
      className={`select-none inline-block shadow-2xl p-1 rounded-sm border transition-colors duration-300 ${containerClass}`}
      onMouseLeave={handleMouseUp}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid[0].length}, 1fr)`,
        gap: '0px', 
        // Force a max size to keep it within view
        maxWidth: '100%',
        maxHeight: '80vh',
        aspectRatio: '1 / 1',
        width: 'min(600px, 90vw)', 
      }}
    >
      {grid.map((row, rIndex) => (
        row.map((color, cIndex) => {
          const isTransparent = color === 'transparent' || color === EMPTY_COLOR;
          
          return (
            <div
              key={`${rIndex}-${cIndex}`}
              onMouseDown={() => handleMouseDown(rIndex, cIndex)}
              onMouseEnter={() => handleMouseEnter(rIndex, cIndex)}
              className={`
                w-full h-full cursor-crosshair flex items-center justify-center
                ${showGridLines && !isBead ? `border-[0.5px] ${gridLineClass}` : ''}
              `}
            >
                <div 
                   className={`
                      transition-all duration-200
                      ${isBead 
                          ? isTransparent 
                              ? `w-[20%] h-[20%] rounded-full ${emptyPegClass}` // Peg for empty bead
                              : 'rounded-full shadow-md ring-1 ring-black/10' // Filled Bead
                          : 'w-full h-full' // Square
                      }
                   `}
                   style={{ 
                      // Size logic: If Square, 100%. If Bead, use dynamic size unless it's an empty peg
                      width: isBead ? (isTransparent ? undefined : `${beadSize}%`) : undefined,
                      height: isBead ? (isTransparent ? undefined : `${beadSize}%`) : undefined,

                      backgroundColor: isBead && isTransparent ? undefined : (color === 'transparent' ? undefined : color),
                      backgroundImage: (!isBead && isTransparent)
                        ? `linear-gradient(45deg, ${bgPatternColor} 25%, transparent 25%), linear-gradient(-45deg, ${bgPatternColor} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${bgPatternColor} 75%), linear-gradient(-45deg, transparent 75%, ${bgPatternColor} 75%)` 
                        : 'none',
                      backgroundSize: !isBead ? '10px 10px' : undefined,
                      backgroundPosition: !isBead ? '0 0, 0 5px, 5px -5px, -5px 0px' : undefined,
                      // Add nice 3D lighting effect for colored beads
                      boxShadow: (isBead && !isTransparent) 
                        ? 'inset -2px -2px 4px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.25), 1px 1px 2px rgba(0,0,0,0.5)' 
                        : undefined
                   }}
                />
            </div>
          );
        })
      ))}
    </div>
  );
};

export default Grid;
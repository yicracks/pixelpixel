import React, { useRef, useEffect, useCallback } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{r: number, c: number} | null>(null);
  const gridRef = useRef<GridData>(grid);
  
  // Sync gridRef when grid prop changes from outside (e.g. undo/redo)
  useEffect(() => {
    if (!isDrawing.current) {
        gridRef.current = grid;
    }
  }, [grid]);

  const t = translations[lang];
  const isDark = theme === 'dark';

  // Draw the grid to the canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridRef.current || gridRef.current.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentGrid = gridRef.current;
    const rows = currentGrid.length;
    const cols = currentGrid[0].length;
    
    const cellSize = 10; 
    canvas.width = cols * cellSize;
    canvas.height = rows * cellSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isBead = boardStyle === BoardStyle.BEAD;
    const bgPatternColor = isDark ? '#1e293b' : '#e2e8f0';
    const emptyPegColor = isDark ? '#334155' : '#e2e8f0';
    const gridLineColor = isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = currentGrid[r][c];
        const isTransparent = color === 'transparent' || color === EMPTY_COLOR;
        const x = c * cellSize;
        const y = r * cellSize;

        if (isBead) {
           if (isTransparent) {
              const pegSize = cellSize * 0.2;
              ctx.fillStyle = emptyPegColor;
              ctx.beginPath();
              ctx.arc(x + cellSize/2, y + cellSize/2, pegSize/2, 0, Math.PI * 2);
              ctx.fill();
           } else {
              const actualBeadSize = (cellSize * (beadSize / 100));
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(x + cellSize/2, y + cellSize/2, actualBeadSize/2, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = 'rgba(0,0,0,0.1)';
              ctx.lineWidth = 0.5;
              ctx.stroke();
           }
        } else {
          if (isTransparent) {
            ctx.fillStyle = (r + c) % 2 === 0 ? bgPatternColor : (isDark ? '#0f172a' : '#ffffff');
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }

    if (showGridLines && !isBead) {
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
      }
      for (let j = 0; j <= rows; j++) {
        ctx.moveTo(0, j * cellSize);
        ctx.lineTo(cols * cellSize, j * cellSize);
      }
      ctx.stroke();
    }
  }, [boardStyle, beadSize, isDark, showGridLines]);

  useEffect(() => {
    draw();
  }, [draw, grid]); // Redraw when grid state changes (undo/redo etc)

  const getGridPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const rectWidth = rect.width;
    const rectHeight = rect.height;

    const col = Math.floor((x / rectWidth) * grid[0].length);
    const row = Math.floor((y / rectHeight) * grid.length);

    if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
      return { r: row, c: col };
    }
    return null;
  };

  const paintCell = (rowIndex: number, colIndex: number) => {
    const currentGrid = gridRef.current;
    const currentColor = currentGrid[rowIndex][colIndex];
    let targetColor = activeColor;
    
    if (tool === ToolType.ERASER) {
      targetColor = EMPTY_COLOR;
    } else if (tool === ToolType.EYEDROPPER) {
        if (currentColor !== EMPTY_COLOR) {
            setActiveColor(currentColor);
        }
        return;
    }

    if (currentColor === targetColor) return;

    // Update internal ref immediately for performance
    currentGrid[rowIndex][colIndex] = targetColor;
    
    // Request a frame to redraw canvas
    requestAnimationFrame(draw);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getGridPos(e);
    if (pos) {
      isDrawing.current = true;
      lastPos.current = pos;
      paintCell(pos.r, pos.c);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDrawing.current) return;
    const pos = getGridPos(e);
    if (pos) {
      if (!lastPos.current || lastPos.current.r !== pos.r || lastPos.current.c !== pos.c) {
        lastPos.current = pos;
        paintCell(pos.r, pos.c);
      }
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDrawing.current) {
      isDrawing.current = false;
      lastPos.current = null;
      // Now sync internal grid back to React state and history
      const finalGrid = gridRef.current.map(row => [...row]);
      setGrid(finalGrid);
      if (onStrokeEnd) onStrokeEnd();
    }
  }, [onStrokeEnd, setGrid]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseUp]); 

  // Safety check
  if (!grid || grid.length === 0 || !grid[0]) {
    return (
        <div className={`flex items-center justify-center w-64 h-64 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {t.loading}
        </div>
    );
  }

  const containerClass = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-slate-200';

  return (
    <div 
      className={`select-none inline-block shadow-2xl p-1 rounded-sm border transition-colors duration-300 ${containerClass}`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          display: 'block',
          width: 'min(600px, 86vw)', 
          aspectRatio: `${grid[0].length} / ${grid.length}`,
          cursor: tool === ToolType.EYEDROPPER ? 'crosshair' : 'default',
          imageRendering: 'pixelated', // Keep it sharp
        }}
      />
    </div>
  );
};

export default Grid;
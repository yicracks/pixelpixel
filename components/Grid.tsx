import React, { useRef, useEffect, useCallback } from 'react';
import { GridData, ToolType, EMPTY_COLOR, BoardStyle, Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface GridProps {
  grid: GridData;
  setGrid: React.Dispatch<React.SetStateAction<GridData>>;
  activeColor: string;
  setActiveColor: (c: string) => void;
  tool: ToolType;
  brushSize: number;
  showGridLines: boolean;
  boardStyle: BoardStyle;
  beadSize: number;
  onStrokeEnd?: () => void;
  lang: Language;
  theme: Theme;
  onReplaceColorSelect?: (color: string) => void;
}

const Grid: React.FC<GridProps> = ({ 
  grid, 
  setGrid, 
  activeColor, 
  setActiveColor,
  tool, 
  brushSize,
  showGridLines,
  boardStyle,
  beadSize,
  onStrokeEnd,
  lang,
  theme,
  onReplaceColorSelect
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
    const isStitch = boardStyle === BoardStyle.STITCH;
    const isWovenBead = boardStyle === BoardStyle.WOVEN_BEAD;
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
              const actualBeadSize = cellSize * (beadSize / 100);
              const radius = actualBeadSize / 2;
              const centerX = x + cellSize / 2;
              const centerY = y + cellSize / 2;

              // 1. Draw flat circle bead of the bead's color
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
              ctx.fill();

              // 2. Subtle flat contour outline to make them distinct
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
              ctx.lineWidth = 0.5;
              ctx.stroke();
           }
        } else if (isWovenBead) {
           const isWovenBeadCell = (r + c) % 2 === 0;
           if (isWovenBeadCell) {
             if (isTransparent) {
                const pegSize = cellSize * 0.25;
                ctx.fillStyle = emptyPegColor;
                ctx.beginPath();
                ctx.arc(x + cellSize/2, y + cellSize/2, pegSize/2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x + cellSize/2, y + cellSize/2, (cellSize * 1.42) / 2, 0, Math.PI * 2);
                ctx.stroke();
             } else {
                const radius = (cellSize * 1.42) / 2;
                const centerX = x + cellSize/2;
                const centerY = y + cellSize/2;

                // 1. Solid base
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();

                // 2. Radial shading for 3D sphere look
                const shadowGrad = ctx.createRadialGradient(
                  centerX, centerY, radius * 0.4,
                  centerX, centerY, radius
                );
                shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
                ctx.fillStyle = shadowGrad;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.fill();

                // 3. Realistic 3D specular highlight
                const highlightGrad = ctx.createRadialGradient(
                  centerX - radius * 0.35, centerY - radius * 0.35, 0,
                  centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4
                );
                highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
                highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = highlightGrad;
                ctx.beginPath();
                ctx.arc(centerX - radius * 0.35, centerY - radius * 0.35, radius * 0.4, 0, Math.PI * 2);
                ctx.fill();

                // 4. Subtle outer contour stroke
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.lineWidth = 0.5;
                ctx.stroke();
             }
           } else {
             // Place empty subtle canvas dot at intersections for staggered/woven spacing
             const pegSize = cellSize * 0.1;
             ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
             ctx.beginPath();
             ctx.arc(x + cellSize/2, y + cellSize/2, pegSize/2, 0, Math.PI * 2);
             ctx.fill();
           }
        } else if (isStitch) {
           if (isTransparent) {
             ctx.fillStyle = (r + c) % 2 === 0 ? bgPatternColor : (isDark ? '#0f172a' : '#ffffff');
             ctx.fillRect(x, y, cellSize, cellSize);
           } else {
             ctx.save();
             ctx.beginPath();
             ctx.rect(x, y, cellSize, cellSize);
             ctx.clip();

             // Fill background with a soft linen fabric color
             ctx.fillStyle = isDark ? '#1e293b' : '#fafaf9';
             ctx.fillRect(x, y, cellSize, cellSize);

             // Draw cross-stitch "X" lines in cell's color
             ctx.strokeStyle = color;
             ctx.lineWidth = cellSize * 0.45; // thick puffy thread lines to close gaps
             ctx.lineCap = 'round';
             ctx.beginPath();
             const pad = -0.5; // slight overlap extension to eliminate rendering gaps at boundaries
             ctx.moveTo(x + pad, y + pad);
             ctx.lineTo(x + cellSize - pad, y + cellSize - pad);
             ctx.moveTo(x + cellSize - pad, y + pad);
             ctx.lineTo(x + pad, y + cellSize - pad);
             ctx.stroke();
             ctx.stroke();

             ctx.restore();
           }
        } else if (boardStyle === BoardStyle.SQUARE) {
          if (isTransparent) {
            ctx.fillStyle = (r + c) % 2 === 0 ? bgPatternColor : (isDark ? '#0f172a' : '#ffffff');
            ctx.fillRect(x, y, cellSize, cellSize);
          } else {
            ctx.fillStyle = color;
            // Draw slightly larger with slight overlap to eliminate any anti-aliasing / subpixel gap lines
            ctx.fillRect(x - 0.25, y - 0.25, cellSize + 0.5, cellSize + 0.5);
          }
        } else {
          // BoardStyle.GRID_SQUARE
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

    // Draw little canvas holes at intersections for stitch mode
    if (boardStyle === BoardStyle.STITCH) {
      ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
      const holeSize = Math.max(1, cellSize * 0.08);
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          ctx.beginPath();
          ctx.arc(i * cellSize, j * cellSize, holeSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (showGridLines && boardStyle !== BoardStyle.SQUARE) {
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

    if (boardStyle === BoardStyle.WOVEN_BEAD) {
      const rowsCount = grid.length;
      const colsCount = grid[0].length;
      
      const colFloat = (x / rectWidth) * colsCount;
      const rowFloat = (y / rectHeight) * rowsCount;
      
      const colInt = Math.floor(colFloat);
      const rowInt = Math.floor(rowFloat);
      
      let minDsq = Infinity;
      let bestR = rowInt;
      let bestC = colInt;
      
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = rowInt + dr;
          const nc = colInt + dc;
          if (nr >= 0 && nr < rowsCount && nc >= 0 && nc < colsCount) {
            if ((nr + nc) % 2 === 0) {
              const centerR = nr + 0.5;
              const centerC = nc + 0.5;
              const distSq = Math.pow(rowFloat - centerR, 2) + Math.pow(colFloat - centerC, 2);
              if (distSq < minDsq) {
                minDsq = distSq;
                bestR = nr;
                bestC = nc;
              }
            }
          }
        }
      }
      return { r: bestR, c: bestC };
    }

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
    } else if (tool === ToolType.FLOOD_ERASE) {
      targetColor = EMPTY_COLOR;
    } else if (tool === ToolType.EYEDROPPER) {
        if (currentColor !== EMPTY_COLOR) {
            setActiveColor(currentColor);
        }
        return;
    }

    if (currentColor === targetColor) return;

    if (tool === ToolType.FILL || tool === ToolType.FLOOD_ERASE) {
      const rows = currentGrid.length;
      const cols = currentGrid[0].length;
      const queue: [number, number][] = [[rowIndex, colIndex]];
      const targetVal = currentColor;

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        if (currentGrid[r][c] === targetVal) {
          currentGrid[r][c] = targetColor;
          
          if (boardStyle === BoardStyle.WOVEN_BEAD) {
            // Diagonal neighbors for woven bead style (since bead positions are staggered checkerboard)
            const diagonals = [
              [r - 1, c - 1],
              [r - 1, c + 1],
              [r + 1, c - 1],
              [r + 1, c + 1]
            ];
            for (const [nr, nc] of diagonals) {
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && currentGrid[nr][nc] === targetVal) {
                queue.push([nr, nc]);
              }
            }
          } else {
            // Orthogonal neighbors
            if (r > 0 && currentGrid[r - 1][c] === targetVal) queue.push([r - 1, c]);
            if (r < rows - 1 && currentGrid[r + 1][c] === targetVal) queue.push([r + 1, c]);
            if (c > 0 && currentGrid[r][c - 1] === targetVal) queue.push([r, c - 1]);
            if (c < cols - 1 && currentGrid[r][c + 1] === targetVal) queue.push([r, c + 1]);
          }
        }
      }
    } else {
      // Update internal ref immediately for performance, taking brushSize into account for PEN and ERASER tools.
      const rows = currentGrid.length;
      const cols = currentGrid[0].length;
      const D = brushSize;

      if (D <= 1) {
        if (boardStyle !== BoardStyle.WOVEN_BEAD || (rowIndex + colIndex) % 2 === 0) {
          currentGrid[rowIndex][colIndex] = targetColor;
        }
      } else {
        const dSq = (D / 2) * (D / 2);
        const half = (D - 1) / 2;
        const rStart = Math.max(0, Math.floor(rowIndex - half));
        const rEnd = Math.min(rows - 1, Math.ceil(rowIndex + half));
        const cStart = Math.max(0, Math.floor(colIndex - half));
        const cEnd = Math.min(cols - 1, Math.ceil(colIndex + half));

        for (let r = rStart; r <= rEnd; r++) {
          for (let c = cStart; c <= cEnd; c++) {
            let distSq;
            if (D % 2 === 0) {
              const dr = r - (rowIndex + 0.5);
              const dc = c - (colIndex + 0.5);
              distSq = dr * dr + dc * dc;
            } else {
              const dr = r - rowIndex;
              const dc = c - colIndex;
              distSq = dr * dr + dc * dc;
            }
            if (distSq <= dSq) {
              if (boardStyle !== BoardStyle.WOVEN_BEAD || (r + c) % 2 === 0) {
                currentGrid[r][c] = targetColor;
              }
            }
          }
        }
      }
    }
    
    // Request a frame to redraw canvas
    requestAnimationFrame(draw);
  };

  const paintLine = (r0: number, c0: number, r1: number, c1: number) => {
    // Bresenham's Line Algorithm to interpolate between fast points
    const dr = Math.abs(r1 - r0);
    const dc = Math.abs(c1 - c0);
    const sr = r0 < r1 ? 1 : -1;
    const sc = c0 < c1 ? 1 : -1;
    let err = dc - dr;

    let r = r0;
    let c = c0;

    while (true) {
      paintCell(r, c);

      if (r === r1 && c === c1) break;
      const e2 = 2 * err;
      if (e2 > -dr) {
        err -= dr;
        c += sc;
      }
      if (e2 < dc) {
        err += dc;
        r += sr;
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getGridPos(e);
    if (pos) {
      if (tool === ToolType.REPLACE) {
        const currentColor = grid[pos.r][pos.c];
        if (onReplaceColorSelect) {
          onReplaceColorSelect(currentColor);
        }
        return;
      }
      isDrawing.current = true;
      lastPos.current = pos;
      paintCell(pos.r, pos.c);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDrawing.current) return;
    if (tool === ToolType.FILL || tool === ToolType.FLOOD_ERASE || tool === ToolType.EYEDROPPER) return;
    const pos = getGridPos(e);
    if (pos) {
      if (!lastPos.current || lastPos.current.r !== pos.r || lastPos.current.c !== pos.c) {
        if (lastPos.current) {
          paintLine(lastPos.current.r, lastPos.current.c, pos.r, pos.c);
        } else {
          paintCell(pos.r, pos.c);
        }
        lastPos.current = pos;
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const pos = getGridPos(e);
    if (pos) {
      if (tool === ToolType.REPLACE) {
        const currentColor = grid[pos.r][pos.c];
        if (onReplaceColorSelect) {
          onReplaceColorSelect(currentColor);
        }
        return;
      }
      // Only prevent default on touch devices when drawing/pasting/erasing to allow interaction
      if (e.cancelable) {
        e.preventDefault();
      }
      isDrawing.current = true;
      lastPos.current = pos;
      paintCell(pos.r, pos.c);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDrawing.current) return;
    if (tool === ToolType.FILL || tool === ToolType.FLOOD_ERASE || tool === ToolType.EYEDROPPER) return;
    if (e.touches.length === 0) return;
    
    if (e.cancelable) {
      e.preventDefault();
    }
    const pos = getGridPos(e);
    if (pos) {
      if (!lastPos.current || lastPos.current.r !== pos.r || lastPos.current.c !== pos.c) {
        if (lastPos.current) {
          paintLine(lastPos.current.r, lastPos.current.c, pos.r, pos.c);
        } else {
          paintCell(pos.r, pos.c);
        }
        lastPos.current = pos;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDrawing.current) {
      if (e.cancelable) {
        e.preventDefault();
      }
      handleMouseUp();
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
      className={`select-none w-full max-w-[600px] block shadow-2xl p-1 rounded-sm border transition-colors duration-300 ${containerClass}`}
    >
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: '100%',
            aspectRatio: `${grid[0].length} / ${grid.length}`,
            cursor: tool === ToolType.EYEDROPPER ? 'crosshair' : 'default',
            imageRendering: 'pixelated', // Keep it sharp
          }}
        />
      </div>
    </div>
  );
};

export default Grid;
import React, { useRef, useEffect, useCallback } from 'react';
import { GridData, ToolType, EMPTY_COLOR, BoardStyle, Language, Theme } from '../types';
import { translations } from '../utils/translations';

// Helper algorithms for pixel-art shapes
const getLinePixels = (r0: number, c0: number, r1: number, c1: number): { r: number; c: number }[] => {
  const pixels: { r: number; c: number }[] = [];
  const dr = Math.abs(r1 - r0);
  const dc = Math.abs(c1 - c0);
  const sr = r0 < r1 ? 1 : -1;
  const sc = c0 < c1 ? 1 : -1;
  let err = dc - dr;

  let r = r0;
  let c = c0;

  while (true) {
    pixels.push({ r, c });
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
  return pixels;
};

const getCirclePixels = (r0: number, c0: number, r1: number, c1: number): { r: number; c: number }[] => {
  const pixels: { r: number; c: number }[] = [];
  const radius = Math.round(Math.sqrt(Math.pow(r1 - r0, 2) + Math.pow(c1 - c0, 2)));
  if (radius === 0) {
    pixels.push({ r: r0, c: c0 });
    return pixels;
  }

  const addPixel = (r: number, c: number) => {
    pixels.push({ r, c });
  };

  let x = radius;
  let y = 0;
  let err = 1 - x;

  const drawCirclePoints = (cx: number, cy: number, x: number, y: number) => {
    addPixel(cx + x, cy + y);
    addPixel(cx - x, cy + y);
    addPixel(cx + x, cy - y);
    addPixel(cx - x, cy - y);
    addPixel(cx + y, cy + x);
    addPixel(cx - y, cy + x);
    addPixel(cx + y, cy - x);
    addPixel(cx - y, cy - x);
  };

  drawCirclePoints(r0, c0, x, y);

  while (x > y) {
    y++;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x--;
      err += 2 * (y - x) + 1;
    }
    drawCirclePoints(r0, c0, x, y);
  }

  return pixels;
};

const getEllipsePixels = (r0: number, c0: number, r1: number, c1: number): { r: number; c: number }[] => {
  const pixels: { r: number; c: number }[] = [];
  const x0 = c0;
  const y0 = r0;
  const x1 = c1;
  const y1 = r1;

  let xStart = x0;
  let xEnd = x1;
  let yStart = y0;
  let yEnd = y1;
  if (xStart > xEnd) { [xStart, xEnd] = [xEnd, xStart]; }
  if (yStart > yEnd) { [yStart, yEnd] = [yEnd, yStart]; }

  const rx = Math.round((xEnd - xStart) / 2);
  const ry = Math.round((yEnd - yStart) / 2);
  const cx = xStart + rx;
  const cy = yStart + ry;

  const addPixel = (r: number, c: number) => {
    pixels.push({ r, c });
  };

  if (rx === 0) {
    for (let r = yStart; r <= yEnd; r++) addPixel(r, cx);
    return pixels;
  }
  if (ry === 0) {
    for (let c = xStart; c <= xEnd; c++) addPixel(cy, c);
    return pixels;
  }

  let xx = 0;
  let yy = ry;
  let rx2 = rx * rx;
  let ry2 = ry * ry;
  let p = ry2 - rx2 * ry + 0.25 * rx2;

  const plotEllipsePoints = (cx: number, cy: number, x: number, y: number) => {
    addPixel(cy + y, cx + x);
    addPixel(cy + y, cx - x);
    addPixel(cy - y, cx + x);
    addPixel(cy - y, cx - x);
  };

  plotEllipsePoints(cx, cy, xx, yy);

  while (2 * ry2 * xx < 2 * rx2 * yy) {
    xx++;
    if (p < 0) {
      p += 2 * ry2 * xx + ry2;
    } else {
      yy--;
      p += 2 * ry2 * xx - 2 * rx2 * yy + ry2;
    }
    plotEllipsePoints(cx, cy, xx, yy);
  }

  p = ry2 * (xx + 0.5) * (xx + 0.5) + rx2 * (yy - 1) * (yy - 1) - rx2 * ry2;
  while (yy > 0) {
    yy--;
    if (p > 0) {
      p += -2 * rx2 * yy + rx2;
    } else {
      xx++;
      p += 2 * ry2 * xx - 2 * rx2 * yy + rx2;
    }
    plotEllipsePoints(cx, cy, xx, yy);
  }

  return pixels;
};

const getRectanglePixels = (r0: number, c0: number, r1: number, c1: number): { r: number; c: number }[] => {
  const pixels: { r: number; c: number }[] = [];
  const rMin = Math.min(r0, r1);
  const rMax = Math.max(r0, r1);
  const cMin = Math.min(c0, c1);
  const cMax = Math.max(c0, c1);

  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      if (r === rMin || r === rMax || c === cMin || c === cMax) {
        pixels.push({ r, c });
      }
    }
  }
  return pixels;
};

const getSquarePixels = (r0: number, c0: number, r1: number, c1: number): { r: number; c: number }[] => {
  const pixels: { r: number; c: number }[] = [];
  const S = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
  const sr = r1 >= r0 ? 1 : -1;
  const sc = c1 >= c0 ? 1 : -1;

  const rEnd = r0 + S * sr;
  const cEnd = c0 + S * sc;

  const rMin = Math.min(r0, rEnd);
  const rMax = Math.max(r0, rEnd);
  const cMin = Math.min(c0, cEnd);
  const cMax = Math.max(c0, cEnd);

  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      if (r === rMin || r === rMax || c === cMin || c === cMax) {
        pixels.push({ r, c });
      }
    }
  }
  return pixels;
};

const expandPointsWithBrush = (
  points: { r: number; c: number }[],
  D: number,
  rows: number,
  cols: number,
  boardStyle: BoardStyle
): { r: number; c: number }[] => {
  if (D <= 1) return points;
  const expandedMap = new Map<string, { r: number; c: number }>();
  const dSq = (D / 2) * (D / 2);
  const half = (D - 1) / 2;

  for (const pt of points) {
    const rStart = Math.max(0, Math.floor(pt.r - half));
    const rEnd = Math.min(rows - 1, Math.ceil(pt.r + half));
    const cStart = Math.max(0, Math.floor(pt.c - half));
    const cEnd = Math.min(cols - 1, Math.ceil(pt.c + half));

    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        let distSq;
        if (D % 2 === 0) {
          const dr = r - (pt.r + 0.5);
          const dc = c - (pt.c + 0.5);
          distSq = dr * dr + dc * dc;
        } else {
          const dr = r - pt.r;
          const dc = c - pt.c;
          distSq = dr * dr + dc * dc;
        }
        if (distSq <= dSq) {
          if (boardStyle !== BoardStyle.WOVEN_BEAD || (r + c) % 2 === 0) {
            expandedMap.set(`${r},${c}`, { r, c });
          }
        }
      }
    }
  }
  return Array.from(expandedMap.values());
};

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
  const startPos = useRef<{r: number, c: number} | null>(null);
  const currentDragPos = useRef<{r: number, c: number} | null>(null);
  const gridRef = useRef<GridData>(grid);

  const toolRef = useRef<ToolType>(tool);
  const activeColorRef = useRef<string>(activeColor);

  useEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    activeColorRef.current = activeColor;
  }, [activeColor]);
  
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

    // Render shape preview overlay if drawing with a shape tool
    if (isDrawing.current && startPos.current && currentDragPos.current) {
      const toolVal = toolRef.current;
      const targetColor = activeColorRef.current;
      
      const isShapeTool = 
        toolVal === ToolType.LINE ||
        toolVal === ToolType.CIRCLE ||
        toolVal === ToolType.ELLIPSE ||
        toolVal === ToolType.RECTANGLE ||
        toolVal === ToolType.SQUARE;

      if (isShapeTool) {
        let shapePts: {r: number, c: number}[] = [];
        const r0 = startPos.current.r;
        const c0 = startPos.current.c;
        const r1 = currentDragPos.current.r;
        const c1 = currentDragPos.current.c;

        if (toolVal === ToolType.LINE) {
          shapePts = getLinePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.CIRCLE) {
          shapePts = getCirclePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.ELLIPSE) {
          shapePts = getEllipsePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.RECTANGLE) {
          shapePts = getRectanglePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.SQUARE) {
          shapePts = getSquarePixels(r0, c0, r1, c1);
        }

        const finalPts = expandPointsWithBrush(shapePts, brushSize, rows, cols, boardStyle);

        for (const pt of finalPts) {
          if (pt.r >= 0 && pt.r < rows && pt.c >= 0 && pt.c < cols) {
            const x = pt.c * cellSize;
            const y = pt.r * cellSize;
            const isTransparent = targetColor === 'transparent' || targetColor === EMPTY_COLOR;

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

                  ctx.fillStyle = targetColor;
                  ctx.beginPath();
                  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                  ctx.fill();

                  ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                  ctx.lineWidth = 0.5;
                  ctx.stroke();
               }
            } else if (isWovenBead) {
               const isWovenBeadCell = (pt.r + pt.c) % 2 === 0;
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

                    ctx.fillStyle = targetColor;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    ctx.fill();

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

                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                 }
               }
            } else if (isStitch) {
               if (isTransparent) {
                 ctx.fillStyle = (pt.r + pt.c) % 2 === 0 ? bgPatternColor : (isDark ? '#0f172a' : '#ffffff');
                 ctx.fillRect(x, y, cellSize, cellSize);
               } else {
                 ctx.save();
                 ctx.beginPath();
                 ctx.rect(x, y, cellSize, cellSize);
                 ctx.clip();

                 ctx.fillStyle = isDark ? '#1e293b' : '#fafaf9';
                 ctx.fillRect(x, y, cellSize, cellSize);

                 ctx.strokeStyle = targetColor;
                 ctx.lineWidth = cellSize * 0.45;
                 ctx.lineCap = 'round';
                 ctx.beginPath();
                 const pad = -0.5;
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
                ctx.fillStyle = (pt.r + pt.c) % 2 === 0 ? bgPatternColor : (isDark ? '#0f172a' : '#ffffff');
                ctx.fillRect(x, y, cellSize, cellSize);
              } else {
                ctx.fillStyle = targetColor;
                ctx.fillRect(x - 0.25, y - 0.25, cellSize + 0.5, cellSize + 0.5);
              }
            } else {
              if (isTransparent) {
                ctx.fillStyle = (pt.r + pt.c) % 2 === 0 ? bgPatternColor : (isDark ? '#0f172a' : '#ffffff');
                ctx.fillRect(x, y, cellSize, cellSize);
              } else {
                ctx.fillStyle = targetColor;
                ctx.fillRect(x, y, cellSize, cellSize);
              }
            }
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
  }, [boardStyle, beadSize, isDark, showGridLines, brushSize]);

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
      startPos.current = pos;
      currentDragPos.current = pos;
      lastPos.current = pos;

      const isShapeTool = 
        tool === ToolType.LINE ||
        tool === ToolType.CIRCLE ||
        tool === ToolType.ELLIPSE ||
        tool === ToolType.RECTANGLE ||
        tool === ToolType.SQUARE;

      if (!isShapeTool) {
        paintCell(pos.r, pos.c);
      } else {
        requestAnimationFrame(draw);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDrawing.current) return;
    if (tool === ToolType.FILL || tool === ToolType.FLOOD_ERASE || tool === ToolType.EYEDROPPER) return;
    const pos = getGridPos(e);
    if (pos) {
      const isShapeTool = 
        tool === ToolType.LINE ||
        tool === ToolType.CIRCLE ||
        tool === ToolType.ELLIPSE ||
        tool === ToolType.RECTANGLE ||
        tool === ToolType.SQUARE;

      if (isShapeTool) {
        if (!currentDragPos.current || currentDragPos.current.r !== pos.r || currentDragPos.current.c !== pos.c) {
          currentDragPos.current = pos;
          requestAnimationFrame(draw);
        }
      } else {
        if (!lastPos.current || lastPos.current.r !== pos.r || lastPos.current.c !== pos.c) {
          if (lastPos.current) {
            paintLine(lastPos.current.r, lastPos.current.c, pos.r, pos.c);
          } else {
            paintCell(pos.r, pos.c);
          }
          lastPos.current = pos;
        }
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
      startPos.current = pos;
      currentDragPos.current = pos;
      lastPos.current = pos;

      const isShapeTool = 
        tool === ToolType.LINE ||
        tool === ToolType.CIRCLE ||
        tool === ToolType.ELLIPSE ||
        tool === ToolType.RECTANGLE ||
        tool === ToolType.SQUARE;

      if (!isShapeTool) {
        paintCell(pos.r, pos.c);
      } else {
        requestAnimationFrame(draw);
      }
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
      const isShapeTool = 
        tool === ToolType.LINE ||
        tool === ToolType.CIRCLE ||
        tool === ToolType.ELLIPSE ||
        tool === ToolType.RECTANGLE ||
        tool === ToolType.SQUARE;

      if (isShapeTool) {
        if (!currentDragPos.current || currentDragPos.current.r !== pos.r || currentDragPos.current.c !== pos.c) {
          currentDragPos.current = pos;
          requestAnimationFrame(draw);
        }
      } else {
        if (!lastPos.current || lastPos.current.r !== pos.r || lastPos.current.c !== pos.c) {
          if (lastPos.current) {
            paintLine(lastPos.current.r, lastPos.current.c, pos.r, pos.c);
          } else {
            paintCell(pos.r, pos.c);
          }
          lastPos.current = pos;
        }
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

      const toolVal = toolRef.current;
      const r0 = startPos.current?.r;
      const c0 = startPos.current?.c;
      const r1 = currentDragPos.current?.r;
      const c1 = currentDragPos.current?.c;

      const isShapeTool = 
        toolVal === ToolType.LINE ||
        toolVal === ToolType.CIRCLE ||
        toolVal === ToolType.ELLIPSE ||
        toolVal === ToolType.RECTANGLE ||
        toolVal === ToolType.SQUARE;

      if (isShapeTool && r0 !== undefined && c0 !== undefined && r1 !== undefined && c1 !== undefined) {
        let shapePts: {r: number, c: number}[] = [];
        if (toolVal === ToolType.LINE) {
          shapePts = getLinePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.CIRCLE) {
          shapePts = getCirclePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.ELLIPSE) {
          shapePts = getEllipsePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.RECTANGLE) {
          shapePts = getRectanglePixels(r0, c0, r1, c1);
        } else if (toolVal === ToolType.SQUARE) {
          shapePts = getSquarePixels(r0, c0, r1, c1);
        }

        const rows = gridRef.current.length;
        const cols = gridRef.current[0].length;
        const finalPts = expandPointsWithBrush(shapePts, brushSize, rows, cols, boardStyle);
        const targetColor = activeColorRef.current;

        for (const pt of finalPts) {
          if (pt.r >= 0 && pt.r < rows && pt.c >= 0 && pt.c < cols) {
            gridRef.current[pt.r][pt.c] = targetColor;
          }
        }
      }

      startPos.current = null;
      currentDragPos.current = null;
      lastPos.current = null;

      // Now sync internal grid back to React state and history
      const finalGrid = gridRef.current.map(row => [...row]);
      setGrid(finalGrid);
      if (onStrokeEnd) onStrokeEnd();
    }
  }, [onStrokeEnd, setGrid, brushSize, boardStyle]);

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
      className={`select-none w-full max-w-[900px] block shadow-2xl p-1 rounded-sm border transition-colors duration-300 ${containerClass}`}
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
import { GridData, Language, EMPTY_COLOR } from '../types';

// Helper to determine text color based on background
export function getContrastColor(hexcolor: string) {
  if (hexcolor === 'transparent') return '#000000';
  const hex = hexcolor.replace("#", "");
  if (hex.length < 6) return 'black';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}

export interface BlueprintAnalysis {
  processedGrid: { color: string; index: number | null }[][];
  uniqueColors: { hex: string; index: number; count: number }[];
  totalColors: number;
  rows: number;
  cols: number;
}

export function analyzeGrid(grid: GridData): BlueprintAnalysis {
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
}

export function downloadBlueprintPNG(analysis: BlueprintAnalysis, lang: Language) {
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
  link.download = `blueprint_${analysis.rows}x${analysis.cols}_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

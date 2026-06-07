import { GridData, EMPTY_COLOR } from '../types';

/**
 * Encodes a 2D grid of colors into a coordinate-based text blueprint.
 * First line: "{rows}*{cols}" (e.g. "15*15")
 * Subsequent lines: "#color:r1,c1;r2,c2;...;rn,cn" (all coordinates use 1-based index)
 */
export function compressGrid(grid: GridData): string {
  const rows = grid.length;
  if (rows === 0) return '0*0';
  const cols = grid[0].length;
  
  const colorCoords: { [color: string]: string[] } = {};
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c];
      // Only process actual drawn colors (filter out transparent/empty)
      if (color && color !== 'transparent' && color !== EMPTY_COLOR && color !== '#ffffff00' && color !== '') {
        if (!colorCoords[color]) {
          colorCoords[color] = [];
        }
        colorCoords[color].push(`${r + 1},${c + 1}`);
      }
    }
  }
  
  const lines: string[] = [`${rows}*${cols}`];
  for (const [color, coords] of Object.entries(colorCoords)) {
    lines.push(`${color}:${coords.join(';')}`);
  }
  
  return lines.join('\n');
}

/**
 * Decodes a coordinate-based text blueprint back into a 2D grid of colors.
 */
export function decompressGrid(compressedText: string): GridData | null {
  try {
    const lines = compressedText
      .replace(/\r/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
      
    if (lines.length === 0) return null;
    
    const sizeLine = lines[0];
    const parts = sizeLine.split('*');
    if (parts.length !== 2) return null;
    
    const rows = parseInt(parts[0], 10);
    const cols = parseInt(parts[1], 10);
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) return null;
    
    // Create clean base grid with default transparent slots
    const grid: GridData = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => 'transparent')
    );
    
    // Fill coordinates
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const color = line.substring(0, colonIndex).trim();
      const coordsString = line.substring(colonIndex + 1).trim();
      if (!color || !coordsString) continue;
      
      const coords = coordsString.split(';');
      for (const coord of coords) {
        const cParts = coord.split(',');
        if (cParts.length !== 2) continue;
        
        const rIndex = parseInt(cParts[0], 10) - 1; // Convert 1-based index to 0-based index
        const cIndex = parseInt(cParts[1], 10) - 1;
        
        if (rIndex >= 0 && rIndex < rows && cIndex >= 0 && cIndex < cols) {
          grid[rIndex][cIndex] = color;
        }
      }
    }
    
    return grid;
  } catch (error) {
    console.error('Failed to decompress coordinate-based grid:', error);
    return null;
  }
}

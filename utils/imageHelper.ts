import { GridData } from '../types';
import { rgbToHex } from './colorUtils';

/**
 * Processes an uploaded image file and converts it into a pixel grid.
 * It resizes the image to fit within the target grid dimensions while maintaining aspect ratio.
 */
export const processImageToGrid = (
  file: File,
  rows: number,
  cols: number
): Promise<GridData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to the grid dimensions
        canvas.width = cols;
        canvas.height = rows;

        // Clear canvas to ensure transparent background
        ctx.clearRect(0, 0, cols, rows);

        // Calculate scale to fit within dimensions while maintaining aspect ratio
        const scale = Math.min(cols / img.width, rows / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        
        // Calculate centered position
        const x = (cols - w) / 2;
        const y = (rows - h) / 2;

        // Draw image centered and scaled
        ctx.drawImage(img, x, y, w, h);

        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, cols, rows);
        const data = imageData.data;
        const newGrid: GridData = [];

        for (let rIndex = 0; rIndex < rows; rIndex++) {
          const row: string[] = [];
          for (let cIndex = 0; cIndex < cols; cIndex++) {
            const index = (rIndex * cols + cIndex) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // If fully transparent (or close to it), use transparent string, else hex
            if (a < 50) {
              row.push('transparent');
            } else {
              row.push(rgbToHex(r, g, b));
            }
          }
          newGrid.push(row);
        }
        resolve(newGrid);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Exports the current grid to a high-res PNG image.
 */
export const exportGridToImage = (grid: GridData, scale: number = 20) => {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const canvas = document.createElement('canvas');
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  grid.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    });
  });

  const link = document.createElement('a');
  link.download = `pixel-art-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
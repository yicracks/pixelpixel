import { GridData } from '../types';
import { rgbToHex } from './colorUtils';

/**
 * Processes an uploaded image file and converts it into a pixel grid.
 * It resizes the image to match the target grid dimensions.
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

        // Draw and resize image
        ctx.drawImage(img, 0, 0, cols, rows);

        // Extract pixel data
        const imageData = ctx.getImageData(0, 0, cols, rows);
        const data = imageData.data;
        const newGrid: GridData = [];

        for (let y = 0; y < rows; y++) {
          const row: string[] = [];
          for (let x = 0; x < cols; x++) {
            const index = (y * cols + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            const a = data[index + 3];

            // If fully transparent, use transparent string, else hex
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

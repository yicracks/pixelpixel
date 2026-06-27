import { GridData, BoardStyle, EMPTY_COLOR } from '../types';
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

        const S_FACTOR = 16; // 16px representative block per grid cell for high quality calculation
        const canvasWidth = cols * S_FACTOR;
        const canvasHeight = rows * S_FACTOR;

        // Set high-resolution scaling canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Check if original image exceeds 50k pixels and downscale it if necessary
        let source: HTMLImageElement | HTMLCanvasElement = img;
        const totalPixels = img.width * img.height;
        if (totalPixels > 50000) {
          const downScale = Math.sqrt(50000 / totalPixels);
          const targetWidth = Math.max(1, Math.floor(img.width * downScale));
          const targetHeight = Math.max(1, Math.floor(img.height * downScale));
          
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = targetWidth;
          tempCanvas.height = targetHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
            source = tempCanvas;
          }
        }

        // Aspect ratio correct scaling & centering to fit inside the grid
        const imgScale = Math.min(canvasWidth / source.width, canvasHeight / source.height);
        const w = source.width * imgScale;
        const h = source.height * imgScale;
        const xOffset = (canvasWidth - w) / 2;
        const yOffset = (canvasHeight - h) / 2;

        ctx.drawImage(source, xOffset, yOffset, w, h);

        // Extract high-resolution pixel data
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
        const newGrid: GridData = [];

        // Helper to convert RGB to Saturation and Value in HSV color space
        const rgbToHsv = (r: number, g: number, b: number) => {
          const rNorm = r / 255;
          const gNorm = g / 255;
          const bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const d = max - min;
          const s = max === 0 ? 0 : d / max;
          const v = max;
          return { s, v };
        };

        for (let rIndex = 0; rIndex < rows; rIndex++) {
          const row: string[] = [];
          for (let cIndex = 0; cIndex < cols; cIndex++) {
            const startX = cIndex * S_FACTOR;
            const endX = (cIndex + 1) * S_FACTOR;
            const startY = rIndex * S_FACTOR;
            const endY = (rIndex + 1) * S_FACTOR;

            const centerX = startX + S_FACTOR / 2;
            const centerY = startY + S_FACTOR / 2;

            let sumRed = 0;
            let sumGreen = 0;
            let sumBlue = 0;
            let sumAlpha = 0;
            let sumWeight = 0;

            const sigmaX = S_FACTOR / 4.5;
            const sigmaY = S_FACTOR / 4.5;
            const sPower = 1.5;
            const vPower = 1.5;
            const baseWeight = 0.05;

            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                // Ensure array index bounds are respected
                if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;

                const index = (y * canvasWidth + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];

                sumAlpha += a;

                // Skip transparent background pixels
                if (a < 15) continue;

                const { s, v } = rgbToHsv(r, g, b);
                const dx = x + 0.5 - centerX;
                const dy = y + 0.5 - centerY;

                // Calculate space/Gaussian weight (sigma tightened to 4.5 to focus on the center)
                const spaceWeight = Math.pow(Math.exp(-(dx * dx + dy * dy) / (2 * sigmaX * sigmaY)), 1.8);
                
                // Color weight (Saturation and Value power scale + baseline weight)
                const colorWeight = Math.pow(s, sPower) * Math.pow(v, vPower) + baseWeight;

                const alphaRatio = a / 255;
                const combinedWeight = spaceWeight * colorWeight * alphaRatio;

                sumRed += r * combinedWeight;
                sumGreen += g * combinedWeight;
                sumBlue += b * combinedWeight;
                sumWeight += combinedWeight;
              }
            }

            // Determine transparency based on average alpha in the cell block
            const avgAlpha = sumAlpha / (S_FACTOR * S_FACTOR);
            if (avgAlpha < 50 || sumWeight === 0) {
              row.push('transparent');
            } else {
              const finalR = Math.max(0, Math.min(255, Math.round(sumRed / sumWeight)));
              const finalG = Math.max(0, Math.min(255, Math.round(sumGreen / sumWeight)));
              const finalB = Math.max(0, Math.min(255, Math.round(sumBlue / sumWeight)));
              row.push(rgbToHex(finalR, finalG, finalB));
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
 * Processes an image URL and converts it into a pixel grid.
 * If targetCol and targetRow are not specified, it will auto-detect from the natural dimensions.
 */
export const processImageUrlToGrid = (
  url: string,
  targetCols?: number,
  targetRows?: number
): Promise<GridData> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let cols = targetCols;
      let rows = targetRows;

      if (!cols || !rows) {
        if (img.naturalWidth <= 200 && img.naturalHeight <= 200) {
          cols = img.naturalWidth;
          rows = img.naturalHeight;
        } else {
          const maxDim = 48;
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 1) {
            cols = maxDim;
            rows = Math.max(1, Math.round(maxDim / ratio));
          } else {
            rows = maxDim;
            cols = Math.max(1, Math.round(maxDim * ratio));
          }
        }
      }

      cols = Math.max(1, cols);
      rows = Math.max(1, rows);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const isPixelPerfect = img.naturalWidth === cols && img.naturalHeight === rows;

      if (isPixelPerfect) {
        canvas.width = cols;
        canvas.height = rows;
        ctx.drawImage(img, 0, 0);
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

            if (a < 50) {
              row.push('transparent');
            } else {
              row.push(rgbToHex(r, g, b));
            }
          }
          newGrid.push(row);
        }
        resolve(newGrid);
      } else {
        const S_FACTOR = 16;
        const canvasWidth = cols * S_FACTOR;
        const canvasHeight = rows * S_FACTOR;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        const imgScale = Math.min(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
        const w = img.naturalWidth * imgScale;
        const h = img.naturalHeight * imgScale;
        const xOffset = (canvasWidth - w) / 2;
        const yOffset = (canvasHeight - h) / 2;

        ctx.drawImage(img, xOffset, yOffset, w, h);

        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        const data = imageData.data;
        const newGrid: GridData = [];

        for (let rIndex = 0; rIndex < rows; rIndex++) {
          const row: string[] = [];
          for (let cIndex = 0; cIndex < cols; cIndex++) {
            const startX = cIndex * S_FACTOR;
            const endX = (cIndex + 1) * S_FACTOR;
            const startY = rIndex * S_FACTOR;
            const endY = (rIndex + 1) * S_FACTOR;
            const centerX = startX + S_FACTOR / 2;
            const centerY = startY + S_FACTOR / 2;

            let sumRed = 0;
            let sumGreen = 0;
            let sumBlue = 0;
            let sumAlpha = 0;
            let sumWeight = 0;

            const sigmaX = S_FACTOR / 4.5;
            const sigmaY = S_FACTOR / 4.5;
            const sPower = 1.5;
            const vPower = 1.5;
            const baseWeight = 0.05;

            for (let y = startY; y < endY; y++) {
              for (let x = startX; x < endX; x++) {
                if (x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight) continue;
                const index = (y * canvasWidth + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];

                sumAlpha += a;
                if (a < 15) continue;

                const rNorm = r / 255;
                const gNorm = g / 255;
                const bNorm = b / 255;
                const max = Math.max(rNorm, gNorm, bNorm);
                const min = Math.min(rNorm, gNorm, bNorm);
                const d = max - min;
                const s = max === 0 ? 0 : d / max;
                const v = max;

                const dx = x + 0.5 - centerX;
                const dy = y + 0.5 - centerY;
                const spaceWeight = Math.pow(Math.exp(-(dx * dx + dy * dy) / (2 * sigmaX * sigmaY)), 1.8);
                const colorWeight = Math.pow(s, sPower) * Math.pow(v, vPower) + baseWeight;
                const alphaRatio = a / 255;
                const combinedWeight = spaceWeight * colorWeight * alphaRatio;

                sumRed += r * combinedWeight;
                sumGreen += g * combinedWeight;
                sumBlue += b * combinedWeight;
                sumWeight += combinedWeight;
              }
            }

            const avgAlpha = sumAlpha / (S_FACTOR * S_FACTOR);
            if (avgAlpha < 50 || sumWeight === 0) {
              row.push('transparent');
            } else {
              const finalR = Math.max(0, Math.min(255, Math.round(sumRed / sumWeight)));
              const finalG = Math.max(0, Math.min(255, Math.round(sumGreen / sumWeight)));
              const finalB = Math.max(0, Math.min(255, Math.round(sumBlue / sumWeight)));
              row.push(rgbToHex(finalR, finalG, finalB));
            }
          }
          newGrid.push(row);
        }
        resolve(newGrid);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };

    img.src = url;
  });
};

/**
 * Exports the current grid to a high-res PNG image, faithfully representing styles and textures.
 */
export const exportGridToImage = (
  grid: GridData,
  scale: number = 20,
  boardStyle: BoardStyle = BoardStyle.SQUARE,
  beadSize: number = 100,
  isDark: boolean = false
) => {
  const rows = grid.length;
  const cols = grid[0].length;
  
  const canvas = document.createElement('canvas');
  canvas.width = cols * scale;
  canvas.height = rows * scale;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isBead = boardStyle === BoardStyle.BEAD;
  
  grid.forEach((row, r) => {
    row.forEach((color, c) => {
      if (color !== 'transparent' && color !== EMPTY_COLOR) {
        const x = c * scale;
        const y = r * scale;
        
        if (isBead) {
          const actualBeadSize = scale * (beadSize / 100);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x + scale / 2, y + scale / 2, actualBeadSize / 2, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = Math.max(0.5, scale * 0.05);
          ctx.stroke();
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, scale, scale);
        }
      }
    });
  });

  const link = document.createElement('a');
  link.download = `pixel-art-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
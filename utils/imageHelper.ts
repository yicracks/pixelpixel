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
  const isStitch = boardStyle === BoardStyle.STITCH;
  const isWovenBead = boardStyle === BoardStyle.WOVEN_BEAD;
  
  // Pre-fill entire fabric/beadboard background if Stitch or Woven Bead styles are active
  if (isStitch || isWovenBead) {
    ctx.fillStyle = isDark ? '#0f172a' : '#ffffff'; // base background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * scale;
        const y = r * scale;

        if (isStitch) {
          // Fill each cell with a soft linen fabric background
          ctx.fillStyle = isDark ? '#1e293b' : '#fafaf9';
          ctx.fillRect(x, y, scale, scale);
        } else if (isWovenBead) {
          // Draw subtle empty pegs or guides for the checkerboard beads
          const isWovenBeadCell = (r + c) % 2 === 0;
          if (!isWovenBeadCell) {
            const pegSize = scale * 0.1;
            ctx.fillStyle = isDark ? '#1e293b' : '#cbd5e1';
            ctx.beginPath();
            ctx.arc(x + scale / 2, y + scale / 2, pegSize / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x + scale / 2, y + scale / 2, (scale * 1.42) / 2, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }

    // Draw little canvas holes at intersections for stitch mode
    if (isStitch) {
      ctx.fillStyle = isDark ? '#475569' : '#cbd5e1';
      const holeSize = Math.max(1, scale * 0.08);
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          ctx.beginPath();
          ctx.arc(i * scale, j * scale, holeSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  grid.forEach((row, r) => {
    row.forEach((color, c) => {
      if (color !== 'transparent' && color !== EMPTY_COLOR) {
        const x = c * scale;
        const y = r * scale;
        
        if (isBead) {
          const actualBeadSize = scale * (beadSize / 100);
          const radius = actualBeadSize / 2;
          const centerX = x + scale / 2;
          const centerY = y + scale / 2;

          // 1. Draw flat circle bead of the bead's color
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();

          // 2. Subtle flat contour outline to make them distinct
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.lineWidth = Math.max(0.5, scale * 0.02);
          ctx.stroke();
        } else if (isWovenBead) {
          const isWovenBeadCell = (r + c) % 2 === 0;
          if (isWovenBeadCell) {
            const radius = (scale * 1.42) / 2;
            const centerX = x + scale / 2;
            const centerY = y + scale / 2;

            // 1. Solid base
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // 2. Radial shading
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

            // 3. Highlight
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

            // 4. Contour stroke
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = Math.max(0.5, scale * 0.05);
            ctx.stroke();
          }
        } else if (isStitch) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, scale, scale);
          ctx.clip();

          // Draw cross-stitch "X" lines in cell's color
          ctx.strokeStyle = color;
          ctx.lineWidth = scale * 0.45; // thick puffy thread lines to close gaps
          ctx.lineCap = 'round';
          ctx.beginPath();
          const pad = -0.5; // slight overlap extension to eliminate rendering gaps at boundaries
          ctx.moveTo(x + pad, y + pad);
          ctx.lineTo(x + scale - pad, y + scale - pad);
          ctx.moveTo(x + scale - pad, y + pad);
          ctx.lineTo(x + pad, y + scale - pad);
          ctx.stroke();
          ctx.stroke();

          ctx.restore();
        } else if (boardStyle === BoardStyle.SQUARE) {
          ctx.fillStyle = color;
          // Use overlap to guarantee perfect integration/seamlessness with zero faint subpixel gaps
          ctx.fillRect(x - 0.25, y - 0.25, scale + 0.5, scale + 0.5);
        } else {
          // BoardStyle.GRID_SQUARE
          ctx.fillStyle = color;
          ctx.fillRect(x, y, scale, scale);

          // Draw a subtle tile boundary line to keep them distinct as individual square tiles
          ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.7)';
          ctx.lineWidth = Math.max(0.5, scale * 0.03);
          ctx.strokeRect(x, y, scale, scale);
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
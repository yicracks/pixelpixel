import { COLOR_CSV_DATA } from './colorData';

// Converts RGB to Hex
export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Converts Hex to RGB
export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

interface RGB { r: number; g: number; b: number; }
interface Lab { l: number; a: number; b: number; }

// Converts RGB to Lab color space
const rgbToLab = (r: number, g: number, b: number): Lab => {
    // RGB to XYZ
    let rL = r / 255;
    let gL = g / 255;
    let bL = b / 255;

    rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
    gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
    bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

    rL *= 100;
    gL *= 100;
    bL *= 100;

    // Based on D65 illuminant
    const x = rL * 0.4124 + gL * 0.3576 + bL * 0.1805;
    const y = rL * 0.2126 + gL * 0.7152 + bL * 0.0722;
    const z = rL * 0.0193 + gL * 0.1192 + bL * 0.9505;

    // XYZ to Lab
    const xN = 95.047;
    const yN = 100.000;
    const zN = 108.883;

    let xR = x / xN;
    let yR = y / yN;
    let zR = z / zN;

    const f = (t: number) => t > (216 / 24389) ? Math.pow(t, 1 / 3) : (841 / 108) * t + (4 / 29);

    const l = 116 * f(yR) - 16;
    const a = 500 * (f(xR) - f(yR));
    const b_ = 200 * (f(yR) - f(zR));

    return { l, a, b: b_ };
};

/**
 * CIEDE2000 Color Difference formula implementation.
 * Returns a value where 1.0 is a "Just Noticeable Difference" (JND).
 * Smaller is more similar.
 */
const deltaE2000 = (lab1: Lab, lab2: Lab): number => {
    const { l: l1, a: a1, b: b1 } = lab1;
    const { l: l2, a: a2, b: b2 } = lab2;

    const kL = 1, kC = 1, kH = 1;

    const deltaLPrime = l2 - l1;
    const lBar = (l1 + l2) / 2;

    const c1 = Math.sqrt(a1 * a1 + b1 * b1);
    const c2 = Math.sqrt(a2 * a2 + b2 * b2);

    const cBar = (c1 + c2) / 2;
    const g = 0.5 * (1 - Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));

    const a1Prime = a1 * (1 + g);
    const a2Prime = a2 * (1 + g);

    const c1Prime = Math.sqrt(a1Prime * a1Prime + b1 * b1);
    const c2Prime = Math.sqrt(a2Prime * a2Prime + b2 * b2);

    const cBarPrime = (c1Prime + c2Prime) / 2;
    const deltaCPrime = c2Prime - c1Prime;

    const h1Prime = (Math.atan2(b1, a1Prime) * 180 / Math.PI + 360) % 360;
    const h2Prime = (Math.atan2(b2, a2Prime) * 180 / Math.PI + 360) % 360;

    let deltaHPrime = h2Prime - h1Prime;
    if (Math.abs(deltaHPrime) > 180) {
        if (h2Prime <= h1Prime) deltaHPrime += 360;
        else deltaHPrime -= 360;
    }

    const deltaLargeHPrime = 2 * Math.sqrt(c1Prime * c2Prime) * Math.sin(deltaHPrime * Math.PI / 360);

    let hBarPrime = (h1Prime + h2Prime) / 2;
    if (Math.abs(h1Prime - h2Prime) > 180) {
        if (h1Prime + h2Prime < 360) hBarPrime += 180;
        else hBarPrime -= 180;
    }

    const t = 1 - 0.17 * Math.cos((hBarPrime - 30) * Math.PI / 180) + 0.24 * Math.cos((2 * hBarPrime) * Math.PI / 180) +
        0.32 * Math.cos((3 * hBarPrime + 6) * Math.PI / 180) - 0.20 * Math.cos((4 * hBarPrime - 63) * Math.PI / 180);

    const deltaTheta = 30 * Math.exp(-Math.pow((hBarPrime - 275) / 25, 2));
    const rC = 2 * Math.sqrt(Math.pow(cBarPrime, 7) / (Math.pow(cBarPrime, 7) + Math.pow(25, 7)));
    const rT = -Math.sin(2 * deltaTheta * Math.PI / 180) * rC;

    const sL = 1 + (0.015 * Math.pow(lBar - 50, 2)) / Math.sqrt(20 + Math.pow(lBar - 50, 2));
    const sC = 1 + 0.045 * cBarPrime;
    const sH = 1 + 0.015 * cBarPrime * t;

    const deltaE = Math.sqrt(
        Math.pow(deltaLPrime / (kL * sL), 2) +
        Math.pow(deltaCPrime / (kC * sC), 2) +
        Math.pow(deltaLargeHPrime / (kH * sH), 2) +
        rT * (deltaCPrime / (kC * sC)) * (deltaLargeHPrime / (kH * sH))
    );

    return deltaE;
};

/**
 * Calculates color distance using CIEDE2000.
 */
const calculateDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    const lab1 = rgbToLab(r1, g1, b1);
    const lab2 = rgbToLab(r2, g2, b2);
    return deltaE2000(lab1, lab2);
};

// Reference point structure derived from CSV
interface ColorReference {
  r: number;
  g: number;
  b: number;
  lab: Lab;
  labelId: string;
}

// Parse CSV content into usable reference points
const parseReferencePoints = (csv: string): ColorReference[] => {
  const lines = csv.trim().split('\n');
  const refs: ColorReference[] = [];
  // Determine start index based on header presence
  const startIndex = lines[0].startsWith('R,G,B') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;
    
    const r = parseInt(parts[0], 10);
    const g = parseInt(parts[1], 10);
    const b = parseInt(parts[2], 10);
    // Label ID is at index 5
    const labelId = parts[5].trim();
    
    if (!isNaN(r)) {
        refs.push({ r, g, b, lab: rgbToLab(r, g, b), labelId });
    }
  }
  return refs;
};

// Load reference points into memory immediately
const REFERENCE_POINTS = parseReferencePoints(COLOR_CSV_DATA);

/**
 * Reduces the grid colors by matching each pixel to the nearest neighbor
 * found in the provided CSV dataset (categorization).
 * Uses a cache to avoid redundant distance calculations for the same color.
 */
export const reduceGridToAverageColors = (grid: string[][]): string[][] => {
  const newGrid = grid.map(row => [...row]);
  const rows = newGrid.length;
  if (rows === 0) return newGrid;
  const cols = newGrid[0].length;

  const groups: Record<string, { r: number, g: number, b: number, row: number, col: number }[]> = {};
  const cache = new Map<string, string>(); // color -> bestLabel

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = newGrid[r][c];
      if (color === 'transparent') continue;

      let bestLabel = cache.get(color);
      
      if (!bestLabel) {
        const rgb = hexToRgb(color);
        if (!rgb) continue;

        const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
        let minDist = Infinity;
        bestLabel = 'unknown';

        for (const ref of REFERENCE_POINTS) {
          const dist = deltaE2000(lab, ref.lab);
          if (dist < minDist) {
            minDist = dist;
            bestLabel = ref.labelId;
          }
        }
        cache.set(color, bestLabel);
      }
      
      const rgb = hexToRgb(color);
      if (!rgb) continue;
      
      if (!groups[bestLabel]) {
        groups[bestLabel] = [];
      }
      groups[bestLabel].push({ r: rgb.r, g: rgb.g, b: rgb.b, row: r, col: c });
    }
  }

  // Calculate average for each group and apply to grid
  Object.keys(groups).forEach(label => {
      const pixels = groups[label];
      if (pixels.length === 0) return;

      const total = pixels.reduce((acc, p) => ({ 
          r: acc.r + p.r, 
          g: acc.g + p.g, 
          b: acc.b + p.b 
      }), { r: 0, g: 0, b: 0 });

      const avgR = Math.round(total.r / pixels.length);
      const avgG = Math.round(total.g / pixels.length);
      const avgB = Math.round(total.b / pixels.length);

      const avgHex = rgbToHex(avgR, avgG, avgB);

      pixels.forEach(p => {
          newGrid[p.row][p.col] = avgHex;
      });
  });

  return newGrid;
};

/**
 * Identifies the top K dominant average colors using K-Means clustering.
 * Optimized by downsampling to unique colors or subset of pixels if needed.
 */
export const getDominantColors = (grid: string[][], k: number = 5): string[] => {
  // 1. Extract all valid RGB values, using a Map to count occurrences of unique colors
  const colorCounts = new Map<string, number>();
  grid.forEach(row => {
    row.forEach(color => {
      if (color !== 'transparent') {
        colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
      }
    });
  });

  const uniqueColors = Array.from(colorCounts.keys());
  if (uniqueColors.length === 0) return [];
  
  const pixels: (RGB & { count: number, lab: Lab })[] = uniqueColors.map(hex => {
      const rgb = hexToRgb(hex);
      if (!rgb) return null;
      return { ...rgb, count: colorCounts.get(hex)!, lab: rgbToLab(rgb.r, rgb.g, rgb.b) };
  }).filter(p => p !== null) as (RGB & { count: number, lab: Lab })[];

  if (pixels.length === 0) return [];

  if (pixels.length <= k) {
      return pixels.map(p => rgbToHex(p.r, p.g, p.b));
  }

  // 2. Initialize Centroids
  let centroids: (RGB & { lab: Lab })[] = [];
  const sortedByCount = [...pixels].sort((a, b) => b.count - a.count);
  centroids = sortedByCount.slice(0, k).map(p => ({ r: p.r, g: p.g, b: p.b, lab: p.lab }));

  // 3. K-Means Loop
  const maxIterations = 10;
  for (let iter = 0; iter < maxIterations; iter++) {
      const clusters: (RGB & { count: number, lab: Lab })[][] = Array.from({ length: k }, () => []);

      pixels.forEach(p => {
          let minDist = Infinity;
          let clusterIndex = 0;
          
          centroids.forEach((c, idx) => {
              const dist = deltaE2000(p.lab, c.lab);
              if (dist < minDist) {
                  minDist = dist;
                  clusterIndex = idx;
              }
          });
          clusters[clusterIndex].push(p);
      });

      let converged = true;
      clusters.forEach((cluster, idx) => {
          if (cluster.length === 0) return;

          let totalWeight = 0;
          const sum = cluster.reduce((acc, p) => {
              totalWeight += p.count;
              return { 
                r: acc.r + (p.r * p.count), 
                g: acc.g + (p.g * p.count), 
                b: acc.b + (p.b * p.count) 
              };
          }, { r: 0, g: 0, b: 0 });

          const newR = sum.r / totalWeight;
          const newG = sum.g / totalWeight;
          const newB = sum.b / totalWeight;

          if (Math.abs(newR - centroids[idx].r) > 0.5 || 
              Math.abs(newG - centroids[idx].g) > 0.5 || 
              Math.abs(newB - centroids[idx].b) > 0.5) {
              converged = false;
          }

          centroids[idx] = { 
            r: newR, 
            g: newG, 
            b: newB, 
            lab: rgbToLab(newR, newG, newB) 
          };
      });

      if (converged) break;
  }

  return centroids.map(c => rgbToHex(Math.round(c.r), Math.round(c.g), Math.round(c.b)));
};

/**
 * Replaces every pixel in the grid with the nearest color from the provided palette.
 * Optimized with caching.
 */
export const applyPaletteToGrid = (grid: string[][], palette: string[]): string[][] => {
  if (!palette || palette.length === 0) return grid;

  const paletteInfos = palette.map(hex => {
      const rgb = hexToRgb(hex);
      return rgb ? { ...rgb, hex, lab: rgbToLab(rgb.r, rgb.g, rgb.b) } : null;
  }).filter(item => item !== null) as {r: number, g: number, b: number, hex: string, lab: Lab}[];

  if (paletteInfos.length === 0) return grid;

  const cache = new Map<string, string>(); // originalHex -> nearestPaletteHex
  const newGrid = grid.map(row => {
    return row.map(color => {
      if (color === 'transparent') return color;
      if (palette.includes(color)) return color;

      let nearestHex = cache.get(color);
      if (!nearestHex) {
        const currentRgb = hexToRgb(color);
        if (!currentRgb) return color;

        const currentLab = rgbToLab(currentRgb.r, currentRgb.g, currentRgb.b);
        let minDist = Infinity;
        nearestHex = color;

        for (const p of paletteInfos) {
          const dist = deltaE2000(currentLab, p.lab);
          if (dist < minDist) {
            minDist = dist;
            nearestHex = p.hex;
          }
        }
        cache.set(color, nearestHex);
      }
      return nearestHex;
    });
  });

  return newGrid;
};

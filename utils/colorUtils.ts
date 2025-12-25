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

// Converts RGB to HSV
// H: 0-360, S: 0-1, V: 0-1
const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s, v };
};

/**
 * Calculates the weighted distance between two colors based on the user-specified formula.
 * Formula: Similarity = 1 - (0.6*H_dist + 0.2*SV_dist + 0.2*RGB_dist)
 * We return the weighted Distance (the part in parentheses), so smaller is better.
 */
const calculateHybridDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    // 1. RGB Distance (Euclidean, Normalized to 0-1)
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    // Max euclidean distance in RGB is sqrt(255^2 * 3) ≈ 441.67
    const distRGB = Math.sqrt(dr*dr + dg*dg + db*db) / 441.67; 

    // 2. HSV Calculations
    const hsv1 = rgbToHsv(r1, g1, b1);
    const hsv2 = rgbToHsv(r2, g2, b2);

    // 3. Hue Distance (Circular, Normalized to 0-1)
    let dh = Math.abs(hsv1.h - hsv2.h);
    if (dh > 180) dh = 360 - dh; // Shortest path around the circle
    const distH = dh / 180;

    // 4. S/V Distance (Euclidean in SV plane, Normalized to 0-1)
    // Max distance in unit square (0-1, 0-1) is sqrt(1^2 + 1^2) = sqrt(2) ≈ 1.414
    const ds = hsv1.s - hsv2.s;
    const dv = hsv1.v - hsv2.v;
    const distSV = Math.sqrt(ds*ds + dv*dv) / 1.414;

    // 5. Weighted Sum
    // 0.6 * H distance + 0.2 * SV distance + 0.2 * RGB distance
    return (0.6 * distH) + (0.2 * distSV) + (0.2 * distRGB);
};

interface RGB { r: number; g: number; b: number; }

// Reference point structure derived from CSV
interface ColorReference {
  r: number;
  g: number;
  b: number;
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
        refs.push({ r, g, b, labelId });
    }
  }
  return refs;
};

// Load reference points into memory immediately
const REFERENCE_POINTS = parseReferencePoints(COLOR_CSV_DATA);

/**
 * Reduces the grid colors by matching each pixel to the nearest neighbor
 * found in the provided CSV dataset (categorization).
 * Uses the Hybrid HSV+RGB distance metric.
 */
export const reduceGridToAverageColors = (grid: string[][]): string[][] => {
  const newGrid = grid.map(row => [...row]);
  const rows = newGrid.length;
  if (rows === 0) return newGrid;
  const cols = newGrid[0].length;

  const groups: Record<string, { r: number, g: number, b: number, row: number, col: number }[]> = {};

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = newGrid[r][c];
      if (color === 'transparent') continue;

      const rgb = hexToRgb(color);
      if (!rgb) continue;

      const { r: R, g: G, b: B } = rgb;
      
      let minDist = Infinity;
      let bestLabel = 'unknown';

      // Find nearest neighbor in CSV reference points
      for (const ref of REFERENCE_POINTS) {
        // Use Hybrid Distance
        const dist = calculateHybridDistance(R, G, B, ref.r, ref.g, ref.b);
        
        if (dist < minDist) {
          minDist = dist;
          bestLabel = ref.labelId;
        }
      }
      
      if (!groups[bestLabel]) {
        groups[bestLabel] = [];
      }
      groups[bestLabel].push({ r: R, g: G, b: B, row: r, col: c });
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
 * Uses Hybrid HSV+RGB distance metric for assignment.
 */
export const getDominantColors = (grid: string[][], k: number = 5): string[] => {
  // 1. Flatten grid and extract all valid RGB values
  const pixels: RGB[] = [];
  grid.forEach(row => {
    row.forEach(color => {
      if (color !== 'transparent') {
        const rgb = hexToRgb(color);
        if (rgb) pixels.push(rgb);
      }
    });
  });

  const totalPixels = pixels.length;
  if (totalPixels === 0) return [];

  if (totalPixels <= k) {
      const unique = Array.from(new Set(pixels.map(p => rgbToHex(p.r, p.g, p.b))));
      return unique;
  }

  // 2. Initialize Centroids (Pick random pixels to start)
  let centroids: RGB[] = [];
  const usedIndices = new Set<number>();
  while (centroids.length < k && centroids.length < totalPixels) {
      const idx = Math.floor(Math.random() * totalPixels);
      if (!usedIndices.has(idx)) {
          centroids.push({ ...pixels[idx] });
          usedIndices.add(idx);
      }
  }

  // 3. K-Means Loop
  const maxIterations = 15;
  let clusters: RGB[][] = Array.from({ length: k }, () => []);

  for (let iter = 0; iter < maxIterations; iter++) {
      clusters = Array.from({ length: k }, () => []);

      // Assign pixels to nearest centroid using Hybrid Distance
      pixels.forEach(p => {
          let minDist = Infinity;
          let clusterIndex = 0;
          
          centroids.forEach((c, idx) => {
              const dist = calculateHybridDistance(p.r, p.g, p.b, c.r, c.g, c.b);
              if (dist < minDist) {
                  minDist = dist;
                  clusterIndex = idx;
              }
          });
          clusters[clusterIndex].push(p);
      });

      // Recalculate centroids (Arithmetic Mean in RGB space is still a robust estimator)
      let converged = true;
      clusters.forEach((cluster, idx) => {
          if (cluster.length === 0) return;

          const sum = cluster.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
          const newR = sum.r / cluster.length;
          const newG = sum.g / cluster.length;
          const newB = sum.b / cluster.length;

          // Convergence check
          if (Math.abs(newR - centroids[idx].r) > 1 || 
              Math.abs(newG - centroids[idx].g) > 1 || 
              Math.abs(newB - centroids[idx].b) > 1) {
              converged = false;
          }

          centroids[idx] = { r: newR, g: newG, b: newB };
      });

      if (converged) break;
  }

  // 4. Sort clusters by size
  const sortedClusters = clusters
      .filter(c => c.length > 0)
      .sort((a, b) => b.length - a.length);

  // 5. Filter thresholds: > 0.5% total and > 5 pixels
  const threshold = Math.ceil(totalPixels * 0.005);
  const significantClusters = sortedClusters.filter(c => c.length >= threshold && c.length > 5);

  const dominantHexColors = significantClusters.slice(0, k).map(cluster => {
      const sum = cluster.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
      const avgR = Math.round(sum.r / cluster.length);
      const avgG = Math.round(sum.g / cluster.length);
      const avgB = Math.round(sum.b / cluster.length);
      return rgbToHex(avgR, avgG, avgB);
  });

  return dominantHexColors;
};

/**
 * Replaces every pixel in the grid with the nearest color from the provided palette.
 * Uses Hybrid HSV+RGB distance metric.
 */
export const applyPaletteToGrid = (grid: string[][], palette: string[]): string[][] => {
  if (!palette || palette.length === 0) return grid;

  const paletteRgb = palette.map(hex => {
      const rgb = hexToRgb(hex);
      return rgb ? { ...rgb, hex } : null;
  }).filter(item => item !== null) as {r: number, g: number, b: number, hex: string}[];

  if (paletteRgb.length === 0) return grid;

  const newGrid = grid.map(row => [...row]);
  const rows = newGrid.length;
  if (rows === 0) return newGrid;
  const cols = newGrid[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = newGrid[r][c];
      if (color === 'transparent') continue;

      if (palette.includes(color)) continue;

      const currentRgb = hexToRgb(color);
      if (!currentRgb) continue;

      let minDist = Infinity;
      let nearestHex = color;

      for (const p of paletteRgb) {
        // Use Hybrid Distance
        const dist = calculateHybridDistance(currentRgb.r, currentRgb.g, currentRgb.b, p.r, p.g, p.b);
        
        if (dist < minDist) {
          minDist = dist;
          nearestHex = p.hex;
        }
      }
      newGrid[r][c] = nearestHex;
    }
  }

  return newGrid;
};

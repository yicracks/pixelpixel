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

// Converts Lab color space back to RGB
const labToRgb = (l: number, a: number, b: number): RGB => {
    let y = (l + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    const finv = (t: number): number => {
        return t > 6 / 29 ? t * t * t : (t - 16 / 116) * (108 / 841);
    };

    const xR = finv(x);
    const yR = finv(y);
    const zR = finv(z);

    // D65 reference points:
    const X = xR * 95.047;
    const Y = yR * 100.000;
    const Z = zR * 108.883;

    // XYZ to RGB (sRGB, D65)
    const xL = X / 100;
    const yL = Y / 100;
    const zL = Z / 100;

    let rL = xL * 3.2406 + yL * -1.5372 + zL * -0.4986;
    let gL = xL * -0.9689 + yL * 1.8758 + zL * 0.0415;
    let bL = xL * 0.0557 + yL * -0.2040 + zL * 1.0570;

    // Gamma correction
    rL = rL > 0.0031308 ? 1.055 * Math.pow(rL, 1 / 2.4) - 0.055 : 12.92 * rL;
    gL = gL > 0.0031308 ? 1.055 * Math.pow(gL, 1 / 2.4) - 0.055 : 12.92 * gL;
    bL = bL > 0.0031308 ? 1.055 * Math.pow(bL, 1 / 2.4) - 0.055 : 12.92 * bL;

    // Clamp & convert to 0-255
    const r = Math.max(0, Math.min(255, Math.round(rL * 255)));
    const g = Math.max(0, Math.min(255, Math.round(gL * 255)));
    const bVal = Math.max(0, Math.min(255, Math.round(bL * 255)));

    return { r, g, b: bVal };
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
  hex: string;
}

// Parse CSV content into usable reference points
const parseReferencePoints = (csv: string): ColorReference[] => {
  const lines = csv.trim().split('\n');
  const refs: ColorReference[] = [];
  // Determine start index based on header presence
  const startIndex = lines[0].includes('R') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 4) continue;
    
    const r = parseInt(parts[0], 10);
    const g = parseInt(parts[1], 10);
    const b = parseInt(parts[2], 10);
    const hex = parts[3].trim();
    
    if (!isNaN(r)) {
        refs.push({ r, g, b, lab: rgbToLab(r, g, b), hex });
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
  const cache = new Map<string, string>(); // color -> bestLabel (closest hex)

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
            bestLabel = ref.hex;
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
 * Calculates Euclidean distance in Lab color space.
 */
const euclideanLabDist = (lab1: Lab, lab2: Lab): number => {
    const dl = lab1.l - lab2.l;
    const da = lab1.a - lab2.a;
    const db = lab1.b - lab2.b;
    return Math.sqrt(dl * dl + da * da + db * db);
};

/**
 * Connected components DBSCAN with minPts = 0, eps = 9 to group Lab colors.
 */
const dbscanWithMinPts0 = (
    points: { count: number; lab: Lab }[],
    eps: number = 50
): number[] => {
    const n = points.length;
    const labels = new Array(n).fill(-1);
    let clusterId = 0;

    for (let i = 0; i < n; i++) {
        if (labels[i] !== -1) continue;

        const queue: number[] = [i];
        labels[i] = clusterId;

        let head = 0;
        while (head < queue.length) {
            const curr = queue[head++];
            for (let j = 0; j < n; j++) {
                if (labels[j] === -1) {
                    const dist = euclideanLabDist(points[curr].lab, points[j].lab);
                    if (dist <= eps) {
                        labels[j] = clusterId;
                        queue.push(j);
                    }
                }
            }
        }
        clusterId++;
    }

    return labels;
};

export interface DominantColorsResult {
  allColors: string[];
  defaultSelected: string[];
  debugInfo?: {
    totalPixels: number;
    transparentPixels: number;
    rawVoxelCount: number;
    retainedVoxelCount: number;
    voxels: {
      index: number;
      count: number;
      avgLab: { l: number; a: number; b: number };
      hex: string;
      clusterId: number;
      isClusterRepresentative: boolean;
    }[];
    dbscanEps: number;
    dbscanMinPts: number;
  };
}

/**
 * Identifies dominant colors using CIELAB voxel segmentation and DBSCAN cluster representatives.
 */
export const getDominantColors = (grid: string[][]): DominantColorsResult => {
  const voxels = new Map<string, { key: string; lIdx: number; aIdx: number; bIdx: number; count: number; sumL: number; sumA: number; sumB: number }>();
  let totalPixels = 0;
  let transparentPixels = 0;

  grid.forEach(row => {
    row.forEach(color => {
      if (color === 'transparent') {
        transparentPixels++;
      } else {
        totalPixels++;
        const rgb = hexToRgb(color);
        if (rgb) {
          const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
          // Map L to [0, 100] with 4 blocks of size 25
          const lIdx = Math.max(0, Math.min(3, Math.floor(lab.l / 25)));
          // Map a to [-128, 128] with 16 blocks of size 16
          const aIdx = Math.max(0, Math.min(15, Math.floor((lab.a + 128) / 16)));
          // Map b to [-128, 128] with 16 blocks of size 16
          const bIdx = Math.max(0, Math.min(15, Math.floor((lab.b + 128) / 16)));
          
          const key = `${lIdx}_${aIdx}_${bIdx}`;
          if (!voxels.has(key)) {
            voxels.set(key, { key, lIdx, aIdx, bIdx, count: 0, sumL: 0, sumA: 0, sumB: 0 });
          }
          const v = voxels.get(key)!;
          v.count++;
          v.sumL += lab.l;
          v.sumA += lab.a;
          v.sumB += lab.b;
        }
      }
    });
  });

  const rawVoxelCount = voxels.size;

  // Sort descend by pixel count, and keep at most the top 50 to limit space size
  const sortedVoxels = Array.from(voxels.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  if (sortedVoxels.length === 0) {
    return {
      allColors: [],
      defaultSelected: [],
      debugInfo: {
        totalPixels,
        transparentPixels,
        rawVoxelCount,
        retainedVoxelCount: 0,
        voxels: [],
        dbscanEps: 9,
        dbscanMinPts: 0
      }
    };
  }

  // Record voxel representative colors as average of all pixels in the voxel (directly in LAB coordinates, NO conversion to RGB yet)
  const retainedColors = sortedVoxels.map(v => {
    const L_avg = v.sumL / v.count;
    const a_avg = v.sumA / v.count;
    const b_avg = v.sumB / v.count;
    return {
      count: v.count,
      lab: { l: L_avg, a: a_avg, b: b_avg }
    };
  });

  // --- Start of Adaptive DBSCAN EPS calculation ---
  let eps = 14.0; // Dynamic default fallback
  const N = retainedColors.length;

  if (N > 1) {
    // 1. Calculate the density profiling (average nearest neighbor distance) in LAB space
    let sumMinDist = 0;
    for (let i = 0; i < N; i++) {
      let minDist = Infinity;
      for (let j = 0; j < N; j++) {
        if (i !== j) {
          const dist = euclideanLabDist(retainedColors[i].lab, retainedColors[j].lab);
          if (dist < minDist) {
            minDist = dist;
          }
        }
      }
      sumMinDist += minDist;
    }
    const avgMinDist = sumMinDist / N;

    // 2. Compute a base eps value based on the total quantity of colors (N)
    let baseEps = 14.0;
    if (N <= 5) {
      baseEps = 12.0;
    } else if (N <= 15) {
      baseEps = 12.0 + (N - 5) * 0.5; // at N=15, baseEps is 17.0
    } else if (N <= 30) {
      baseEps = 17.0 - (N - 15) * 0.25; // at N=30, baseEps is 13.25
    } else {
      baseEps = Math.max(9.0, 13.25 - (N - 30) * 0.05);
    }

    // 3. Scale baseEps adaptively with density factor (avgMinDist)
    // Scale avgMinDist relative to a baseline of 16.0
    const densityFactor = Math.max(0.7, Math.min(1.4, avgMinDist / 16.0));
    eps = baseEps * densityFactor;

    // 4. Clamping parameters based on physical separation and voxel dimensions
    // We lowered the clamping range to [11.0, 22.0] so clusters are finer and capture differences more precisely.
    eps = Math.max(11.0, Math.min(22.0, eps));
  }
  // --- End of Adaptive DBSCAN EPS calculation ---

  // Cluster retained colors using DBSCAN (with dynamically calculated adaptive eps) in LAB space
  let labels = dbscanWithMinPts0(retainedColors, eps);

  // If the image color is very rich and we produce more than 20 distinct classes,
  // we adaptively increase the EPS radius to merge similar colors and keep final classes <= 20 if possible.
  let uniqueClassCount = new Set(labels).size;
  if (uniqueClassCount > 20) {
    let currentEps = eps;
    while (uniqueClassCount > 20 && currentEps < 65.0) {
      currentEps += 1.0;
      labels = dbscanWithMinPts0(retainedColors, currentEps);
      uniqueClassCount = new Set(labels).size;
    }
    eps = currentEps; // Keep the updated eps in debug logs
  }
  
  const allColors: string[] = [];

  // Convert LAB points to RGB/Hex color space ONLY after running DBSCAN
  for (let i = 0; i < retainedColors.length; i++) {
    const item = retainedColors[i];
    const rgb = labToRgb(item.lab.l, item.lab.a, item.lab.b);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    allColors.push(hex);
  }

  // Find the representative voxel with the largest pixel count in each cluster
  const bestPointIndexByCluster = new Map<number, number>();
  for (let i = 0; i < retainedColors.length; i++) {
    const clusterId = labels[i];
    if (!bestPointIndexByCluster.has(clusterId)) {
      bestPointIndexByCluster.set(clusterId, i);
    } else {
      const currentBestIdx = bestPointIndexByCluster.get(clusterId)!;
      if (retainedColors[i].count > retainedColors[currentBestIdx].count) {
        bestPointIndexByCluster.set(clusterId, i);
      }
    }
  }

  // Default selected colors should be the unique hex values of these best points
  const defaultSelectedSet = new Set<string>();
  bestPointIndexByCluster.forEach((bestIdx) => {
    defaultSelectedSet.add(allColors[bestIdx]);
  });
  const defaultSelected = Array.from(defaultSelectedSet);

  // Compile detailed debug info
  const debugVoxels = retainedColors.map((item, i) => {
    const clusterId = labels[i];
    const isRep = bestPointIndexByCluster.get(clusterId) === i;
    return {
      index: i,
      count: item.count,
      avgLab: item.lab,
      hex: allColors[i],
      clusterId,
      isClusterRepresentative: isRep
    };
  });

  return {
    allColors,
    defaultSelected,
    debugInfo: {
      totalPixels,
      transparentPixels,
      rawVoxelCount,
      retainedVoxelCount: retainedColors.length,
      voxels: debugVoxels,
      dbscanEps: Number(eps.toFixed(2)),
      dbscanMinPts: 0
    }
  };
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

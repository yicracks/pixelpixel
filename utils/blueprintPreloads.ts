import { GridData } from '../types';
import { decompressGrid } from './compressHelper';

export interface PreloadBlueprint {
  id: string;
  nameZh: string;
  nameEn: string;
  gridData?: GridData; // Optional, can be resolved dynamically for images
  isImage: boolean;
  imageSrc?: string;
  targetCols?: number;
  targetRows?: number;
}

function parseRawToGrid(rawText: string): GridData {
  const result = decompressGrid(rawText);
  if (result) return result;
  
  // Return empty fallback matrix if decoding fails
  return Array.from({ length: 16 }, () => 
    Array.from({ length: 16 }, () => 'transparent')
  );
}

// Dynamically fetch and import all .txt files inside the blueprints directory as raw strings
const blueprintsGlob = import.meta.glob('../blueprints/*.txt', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Dynamically fetch and import all image files inside the blueprints directory as assets
const imagesGlob = import.meta.glob('../blueprints/*.{png,jpg,jpeg,svg,webp}', {
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const ADMIN_BLUEPRINTS: PreloadBlueprint[] = [];

// 1. Process Text Blueprints
Object.entries(blueprintsGlob).forEach(([filePath, content]) => {
  const fileName = filePath.split('/').pop()?.replace('.txt', '') || 'blueprint';
  
  // Create a clean readable representation by replacing dashes/underscores with spaces & capitalizing
  const displayName = fileName
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  ADMIN_BLUEPRINTS.push({
    id: fileName,
    nameZh: displayName,
    nameEn: displayName,
    gridData: parseRawToGrid(content),
    isImage: false,
  });
});

// 2. Process Image Blueprints
Object.entries(imagesGlob).forEach(([filePath, imageSrc]) => {
  const fileName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'blueprint';
  
  // Parse dimensions like _39x23 or 51x58 from file name
  let targetCols: number | undefined;
  let targetRows: number | undefined;
  const parts = fileName.split(/[_-]/);
  for (const part of parts) {
    const match = part.match(/^(\d+)x(\d+)$/i);
    if (match) {
      targetCols = parseInt(match[1], 10);
      targetRows = parseInt(match[2], 10);
      break;
    }
  }

  const displayName = fileName
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  ADMIN_BLUEPRINTS.push({
    id: fileName,
    nameZh: displayName,
    nameEn: displayName,
    isImage: true,
    imageSrc,
    targetCols,
    targetRows,
  });
});


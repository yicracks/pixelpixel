import { GridData } from '../types';
import { decompressGrid } from './compressHelper';

export interface PreloadBlueprint {
  id: string;
  nameZh: string;
  nameEn: string;
  gridData: GridData;
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

export const ADMIN_BLUEPRINTS: PreloadBlueprint[] = Object.entries(blueprintsGlob).map(([filePath, content]) => {
  // Extract file name with no extension (e.g. "../blueprints/classic-heart.txt" -> "classic-heart")
  const fileName = filePath.split('/').pop()?.replace('.txt', '') || 'blueprint';
  
  // Create a clean readable representation by replacing dashes and capitalizing (e.g., "classic-heart" -> "Classic Heart")
  const displayName = fileName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id: fileName,
    nameZh: displayName,
    nameEn: displayName,
    gridData: parseRawToGrid(content)
  };
});


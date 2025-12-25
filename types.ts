
export type GridData = string[][];

export interface Dimensions {
  rows: number;
  cols: number;
}

export enum ToolType {
  PEN = 'PEN',
  ERASER = 'ERASER',
  FILL = 'FILL',
  EYEDROPPER = 'EYEDROPPER'
}

export enum BoardStyle {
  SQUARE = 'SQUARE',
  BEAD = 'BEAD'
}

export type Language = 'zh' | 'en';
export type Theme = 'dark' | 'light';

export const DEFAULT_COLOR = '#000000';
export const EMPTY_COLOR = 'transparent'; // Represents an erased/empty cell

export const APP_CONFIG = {
  DEFAULT_GRID_SIZE: 40,
  MIN_GRID_SIZE: 8,
  MAX_GRID_SIZE: 100,
  DEFAULT_BEAD_SIZE: 85,
  PRESETS: [20, 40, 60]
};

// Deprecated: usage should move to APP_CONFIG.PRESETS, keeping for backward compatibility if needed temporarily
export const PRESETS = APP_CONFIG.PRESETS;

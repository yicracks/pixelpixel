
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
export const PRESETS = [8, 16, 32];

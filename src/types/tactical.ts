export type CalculatorId = 'azimuth' | 'pace' | 'range' | 'grid';

export type AzimuthDirectionMode = 'gridToMagnetic' | 'magneticToGrid';
export type DeclinationHemisphere = 'E' | 'W';

export type TerrainId = 'road' | 'open' | 'woods' | 'steep' | 'night';

export interface TerrainProfile {
  id: TerrainId;
  label: string;
  paceMultiplier: number;
  baseSpeedKmh: number;
  note: string;
}

export type RangeSolveTarget = 'distance' | 'size' | 'mils';

export interface TargetPreset {
  id: string;
  label: string;
  sizeMeters: number;
  dimensionLabel: string;
}

export type GridPrecision = 6 | 8;

export interface SavedLogEntry {
  id: string;
  timestamp: string;
  calculator: CalculatorId;
  label: string;
  summary: string;
  primaryMetric: string;
  distanceMeters?: number;
  estimatedMinutes?: number;
}

export interface PracticeDrillQuestion {
  id: string;
  category: CalculatorId;
  prompt: string;
  hint: string;
  unit: string;
  correctAnswer: number;
  tolerance: number;
  explanation: string;
}

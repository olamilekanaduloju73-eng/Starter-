import {
  AzimuthDirectionMode,
  DeclinationHemisphere,
  GridPrecision,
  PracticeDrillQuestion,
  TargetPreset,
  TerrainId,
  TerrainProfile,
} from '../types/tactical';

export const TERRAIN_PROFILES: TerrainProfile[] = [
  {
    id: 'road',
    label: 'Paved Road or Hard Trail',
    paceMultiplier: 1.0,
    baseSpeedKmh: 4.8,
    note: 'Standard calibrated stride with minimal footing obstacles.',
  },
  {
    id: 'open',
    label: 'Open Field or Meadow',
    paceMultiplier: 1.08,
    baseSpeedKmh: 4.0,
    note: 'Uneven grass shortens stride slightly (+8% paces).',
  },
  {
    id: 'woods',
    label: 'Moderate Woods or Brush',
    paceMultiplier: 1.2,
    baseSpeedKmh: 3.0,
    note: 'Detours around trees and undergrowth (+20% paces).',
  },
  {
    id: 'steep',
    label: 'Steep Slope or Heavy Brush',
    paceMultiplier: 1.35,
    baseSpeedKmh: 2.0,
    note: 'Shortened steps and slower cadence (+35% paces).',
  },
  {
    id: 'night',
    label: 'Night or Low Visibility',
    paceMultiplier: 1.25,
    baseSpeedKmh: 2.2,
    note: 'Deliberate foot placement reduces stride length (+25% paces).',
  },
];

export const TARGET_PRESETS: TargetPreset[] = [
  {
    id: 'person-height',
    label: 'Standing Person (Height)',
    sizeMeters: 1.75,
    dimensionLabel: 'Height',
  },
  {
    id: 'person-width',
    label: 'Person Shoulders (Width)',
    sizeMeters: 0.5,
    dimensionLabel: 'Width',
  },
  {
    id: 'doorway',
    label: 'Standard Doorway (Width)',
    sizeMeters: 0.9,
    dimensionLabel: 'Width',
  },
  {
    id: 'sedan',
    label: 'Passenger Vehicle (Length)',
    sizeMeters: 4.5,
    dimensionLabel: 'Length',
  },
  {
    id: 'container',
    label: '20ft Cargo Container',
    sizeMeters: 6.06,
    dimensionLabel: 'Length',
  },
  {
    id: 'utility-pole',
    label: 'Utility Pole (Height)',
    sizeMeters: 9.0,
    dimensionLabel: 'Height',
  },
];

export function normalizeDegrees(deg: number): number {
  const normalized = ((deg % 360) + 360) % 360;
  return Number(normalized.toFixed(1));
}

export function degreesToNatoMils(deg: number): number {
  const normalized = normalizeDegrees(deg);
  return Math.round((normalized * 6400) / 360) % 6400;
}

export function formatBearing(deg: number): string {
  const rounded = Math.round(normalizeDegrees(deg)) % 360;
  return String(rounded).padStart(3, '0') + '°';
}

export function calculateAzimuthResult(params: {
  inputAzimuth: number;
  declinationDegrees: number;
  declinationHemisphere: DeclinationHemisphere;
  mode: AzimuthDirectionMode;
}) {
  const input = normalizeDegrees(params.inputAzimuth);
  const decl = Math.max(0, Math.min(45, params.declinationDegrees));

  let gridAzimuth: number;
  let magneticAzimuth: number;
  let formulaStep: string;
  let ruleLabel: string;

  if (params.mode === 'gridToMagnetic') {
    gridAzimuth = input;
    if (params.declinationHemisphere === 'E') {
      // East is Least (subtract East declination from Grid to get Magnetic)
      magneticAzimuth = normalizeDegrees(gridAzimuth - decl);
      ruleLabel = 'East is Least (Grid − East Declination = Magnetic)';
      formulaStep = `${gridAzimuth.toFixed(1)}° − ${decl.toFixed(1)}° = ${magneticAzimuth.toFixed(1)}°`;
    } else {
      // West is Best (add West declination to Grid to get Magnetic)
      magneticAzimuth = normalizeDegrees(gridAzimuth + decl);
      ruleLabel = 'West is Best (Grid + West Declination = Magnetic)';
      formulaStep = `${gridAzimuth.toFixed(1)}° + ${decl.toFixed(1)}° = ${magneticAzimuth.toFixed(1)}°`;
    }
  } else {
    magneticAzimuth = input;
    if (params.declinationHemisphere === 'E') {
      gridAzimuth = normalizeDegrees(magneticAzimuth + decl);
      ruleLabel = 'Reverse East Rule (Magnetic + East Declination = Grid)';
      formulaStep = `${magneticAzimuth.toFixed(1)}° + ${decl.toFixed(1)}° = ${gridAzimuth.toFixed(1)}°`;
    } else {
      gridAzimuth = normalizeDegrees(magneticAzimuth - decl);
      ruleLabel = 'Reverse West Rule (Magnetic − West Declination = Grid)';
      formulaStep = `${magneticAzimuth.toFixed(1)}° − ${decl.toFixed(1)}° = ${gridAzimuth.toFixed(1)}°`;
    }
  }

  const outputAzimuth =
    params.mode === 'gridToMagnetic' ? magneticAzimuth : gridAzimuth;
  const backAzimuth = normalizeDegrees(
    outputAzimuth < 180 ? outputAzimuth + 180 : outputAzimuth - 180,
  );
  const backAzimuthGrid = normalizeDegrees(
    gridAzimuth < 180 ? gridAzimuth + 180 : gridAzimuth - 180,
  );

  return {
    gridAzimuth,
    magneticAzimuth,
    outputAzimuth,
    outputMils: degreesToNatoMils(outputAzimuth),
    backAzimuth,
    backAzimuthMils: degreesToNatoMils(backAzimuth),
    backAzimuthGrid,
    ruleLabel,
    formulaStep,
  };
}

export function calculatePaceAndTravel(params: {
  distanceMeters: number;
  pacesPer100m: number;
  terrainId: TerrainId;
  elevationGainMeters: number;
}) {
  const distance = Math.max(0, params.distanceMeters);
  const basePaces = Math.max(20, params.pacesPer100m);
  const terrain =
    TERRAIN_PROFILES.find((t) => t.id === params.terrainId) ?? TERRAIN_PROFILES[0];
  const elevationGain = Math.max(0, params.elevationGainMeters);

  const effectivePacesPer100m = basePaces * terrain.paceMultiplier;
  const totalDoublePaces = Math.round((distance / 100) * effectivePacesPer100m);
  const totalSingleSteps = totalDoublePaces * 2;

  const horizontalMinutes = ((distance / 1000) / terrain.baseSpeedKmh) * 60;
  // Naismith's Rule: +10 minutes per 100m of ascent
  const climbMinutes = elevationGain / 10;
  const totalMinutes = horizontalMinutes + climbMinutes;

  const slopePercent = distance > 0 ? (elevationGain / distance) * 100 : 0;

  return {
    terrain,
    effectivePacesPer100m: Number(effectivePacesPer100m.toFixed(1)),
    totalDoublePaces,
    totalSingleSteps,
    horizontalMinutes: Number(horizontalMinutes.toFixed(1)),
    climbMinutes: Number(climbMinutes.toFixed(1)),
    totalMinutes: Number(totalMinutes.toFixed(1)),
    slopePercent: Number(slopePercent.toFixed(1)),
  };
}

export function formatDurationMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
}

export function calculateMilRange(params: {
  solveFor: 'distance' | 'size' | 'mils';
  targetSizeMeters: number;
  apparentMils: number;
  distanceMeters: number;
}) {
  const size = Math.max(0.05, params.targetSizeMeters);
  const mils = Math.max(0.2, params.apparentMils);
  const distance = Math.max(10, params.distanceMeters);

  if (params.solveFor === 'distance') {
    const computedDistance = (size * 1000) / mils;
    return {
      distanceMeters: Number(computedDistance.toFixed(0)),
      targetSizeMeters: size,
      apparentMils: mils,
      formulaText: `(${size.toFixed(2)} m × 1000) ÷ ${mils.toFixed(1)} mils = ${Math.round(computedDistance)} m`,
    };
  }

  if (params.solveFor === 'size') {
    const computedSize = (distance * mils) / 1000;
    return {
      distanceMeters: distance,
      targetSizeMeters: Number(computedSize.toFixed(2)),
      apparentMils: mils,
      formulaText: `(${distance.toFixed(0)} m × ${mils.toFixed(1)} mils) ÷ 1000 = ${computedSize.toFixed(2)} m`,
    };
  }

  const computedMils = (size * 1000) / distance;
  return {
    distanceMeters: distance,
    targetSizeMeters: size,
    apparentMils: Number(computedMils.toFixed(2)),
    formulaText: `(${size.toFixed(2)} m × 1000) ÷ ${distance.toFixed(0)} m = ${computedMils.toFixed(1)} mils`,
  };
}

export function calculateGridVector(params: {
  precision: GridPrecision;
  startEasting: number;
  startNorthing: number;
  targetEasting: number;
  targetNorthing: number;
}) {
  const unitMeters = params.precision === 8 ? 10 : 100;
  const maxVal = params.precision === 8 ? 9999 : 999;

  const sE = Math.max(0, Math.min(maxVal, Math.round(params.startEasting)));
  const sN = Math.max(0, Math.min(maxVal, Math.round(params.startNorthing)));
  const tE = Math.max(0, Math.min(maxVal, Math.round(params.targetEasting)));
  const tN = Math.max(0, Math.min(maxVal, Math.round(params.targetNorthing)));

  const deltaEastingMeters = (tE - sE) * unitMeters;
  const deltaNorthingMeters = (tN - sN) * unitMeters;
  const distanceMeters = Math.hypot(deltaEastingMeters, deltaNorthingMeters);

  let bearingDeg = 0;
  if (distanceMeters > 0) {
    bearingDeg = normalizeDegrees(
      (Math.atan2(deltaEastingMeters, deltaNorthingMeters) * 180) / Math.PI,
    );
  }

  const padLen = params.precision / 2;
  const startCode = `${String(sE).padStart(padLen, '0')} ${String(sN).padStart(padLen, '0')}`;
  const targetCode = `${String(tE).padStart(padLen, '0')} ${String(tN).padStart(padLen, '0')}`;

  return {
    unitMeters,
    maxVal,
    deltaEastingMeters,
    deltaNorthingMeters,
    distanceMeters: Number(distanceMeters.toFixed(0)),
    bearingDeg,
    bearingMils: degreesToNatoMils(bearingDeg),
    backBearingDeg: normalizeDegrees(bearingDeg < 180 ? bearingDeg + 180 : bearingDeg - 180),
    startCode,
    targetCode,
  };
}

export function generatePracticeDrill(indexSeed?: number): PracticeDrillQuestion {
  const seed = indexSeed ?? Math.floor(Math.random() * 1000);
  const kind = seed % 4;

  if (kind === 0) {
    const grid = 40 + ((seed * 37) % 280);
    const decl = 4 + ((seed * 13) % 14);
    const isEast = seed % 2 === 0;
    const answer = isEast
      ? normalizeDegrees(grid - decl)
      : normalizeDegrees(grid + decl);
    return {
      id: `drill-${seed}`,
      category: 'azimuth',
      prompt: `Your map shows a Grid Azimuth of ${formatBearing(grid)} and the local magnetic declination is ${decl}° ${isEast ? 'East' : 'West'}. What Magnetic Azimuth should you dial on your compass?`,
      hint: isEast
        ? 'East is Least: subtract East declination from Grid Azimuth.'
        : 'West is Best: add West declination to Grid Azimuth.',
      unit: '°',
      correctAnswer: answer,
      tolerance: 0.5,
      explanation: isEast
        ? `East declination means Magnetic North lies ${decl}° clockwise of Grid North, so ${grid}° − ${decl}° = ${answer}°. Remember: East is Least (Grid to Magnetic).`
        : `West declination means Magnetic North lies ${decl}° counter-clockwise of Grid North, so ${grid}° + ${decl}° = ${answer}°. Remember: West is Best (Grid to Magnetic).`,
    };
  }

  if (kind === 1) {
    const pacePer100 = 60 + ((seed * 3) % 10);
    const dist = (3 + (seed % 6)) * 100;
    const answer = Math.round((dist / 100) * pacePer100);
    return {
      id: `drill-${seed}`,
      category: 'pace',
      prompt: `Your calibrated pace count is ${pacePer100} double-paces per 100 meters on flat trail. How many double-paces should you count to cover ${dist} meters?`,
      hint: 'Divide total distance by 100 m, then multiply by your 100 m pace count.',
      unit: 'paces',
      correctAnswer: answer,
      tolerance: 2,
      explanation: `(${dist} m ÷ 100 m) × ${pacePer100} paces = ${answer} double-paces.`,
    };
  }

  if (kind === 2) {
    const presets = [
      { name: 'standing person (1.8 m tall)', size: 1.8, mils: 4.5 },
      { name: 'vehicle (4.5 m long)', size: 4.5, mils: 9 },
      { name: 'utility pole (9.0 m tall)', size: 9.0, mils: 15 },
      { name: 'doorway (0.9 m wide)', size: 0.9, mils: 3 },
    ];
    const p = presets[seed % presets.length];
    const answer = Math.round((p.size * 1000) / p.mils);
    return {
      id: `drill-${seed}`,
      category: 'range',
      prompt: `Through your reticle, a ${p.name} measures ${p.mils} mils. Using the Mil-Relation formula, what is the estimated distance in meters?`,
      hint: 'WORM formula: Distance = (Target Size in meters × 1000) ÷ Apparent Mils.',
      unit: 'm',
      correctAnswer: answer,
      tolerance: 10,
      explanation: `(${p.size} m × 1000) ÷ ${p.mils} mils = ${answer} meters.`,
    };
  }

  // Grid Pythagorean leg
  const legOptions = [
    { dE: 3, dN: 4, dist: 500 },
    { dE: 6, dN: 8, dist: 1000 },
    { dE: 5, dN: 12, dist: 1300 },
    { dE: 8, dN: 15, dist: 1700 },
  ];
  const leg = legOptions[seed % legOptions.length];
  const sE = 210;
  const sN = 320;
  const tE = sE + leg.dE;
  const tN = sN + leg.dN;
  return {
    id: `drill-${seed}`,
    category: 'grid',
    prompt: `In a 6-digit grid (100 m per unit), you start at ${sE} ${sN} and move to ${tE} ${tN}. What is the straight-line grid distance in meters?`,
    hint: 'Find ΔE and ΔN in meters (×100), then apply √(ΔE² + ΔN²).',
    unit: 'm',
    correctAnswer: leg.dist,
    tolerance: 5,
    explanation: `ΔE = ${leg.dE * 100} m and ΔN = ${leg.dN * 100} m. Distance = √(${leg.dE * 100}² + ${leg.dN * 100}²) = ${leg.dist} m.`,
  };
}

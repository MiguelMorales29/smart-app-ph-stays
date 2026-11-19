/**
 * Philippine provinces (and Metro Manila) with their region, for the property address
 * (onboarding step 1 and settings). The owner picks a province; the region is filled in for them
 * (Tesler's law, Phase 4 plan section 5). Region names follow the PSA's short forms.
 */
export interface PhProvince {
  readonly name: string;
  readonly region: string;
}

const BY_REGION: Readonly<Record<string, readonly string[]>> = {
  NCR: ['Metro Manila'],
  CAR: ['Abra', 'Apayao', 'Benguet', 'Ifugao', 'Kalinga', 'Mountain Province'],
  'Region I': ['Ilocos Norte', 'Ilocos Sur', 'La Union', 'Pangasinan'],
  'Region II': ['Batanes', 'Cagayan', 'Isabela', 'Nueva Vizcaya', 'Quirino'],
  'Region III': ['Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 'Pampanga', 'Tarlac', 'Zambales'],
  'Region IV-A': ['Batangas', 'Cavite', 'Laguna', 'Quezon', 'Rizal'],
  MIMAROPA: ['Marinduque', 'Occidental Mindoro', 'Oriental Mindoro', 'Palawan', 'Romblon'],
  'Region V': ['Albay', 'Camarines Norte', 'Camarines Sur', 'Catanduanes', 'Masbate', 'Sorsogon'],
  'Region VI': ['Aklan', 'Antique', 'Capiz', 'Guimaras', 'Iloilo'],
  NIR: ['Negros Occidental', 'Negros Oriental', 'Siquijor'],
  'Region VII': ['Bohol', 'Cebu'],
  'Region VIII': ['Biliran', 'Eastern Samar', 'Leyte', 'Northern Samar', 'Samar', 'Southern Leyte'],
  'Region IX': ['Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay'],
  'Region X': ['Bukidnon', 'Camiguin', 'Lanao del Norte', 'Misamis Occidental', 'Misamis Oriental'],
  'Region XI': [
    'Davao de Oro',
    'Davao del Norte',
    'Davao del Sur',
    'Davao Occidental',
    'Davao Oriental',
  ],
  'Region XII': ['Cotabato', 'Sarangani', 'South Cotabato', 'Sultan Kudarat'],
  Caraga: [
    'Agusan del Norte',
    'Agusan del Sur',
    'Dinagat Islands',
    'Surigao del Norte',
    'Surigao del Sur',
  ],
  BARMM: [
    'Basilan',
    'Lanao del Sur',
    'Maguindanao del Norte',
    'Maguindanao del Sur',
    'Sulu',
    'Tawi-Tawi',
  ],
};

export const PH_PROVINCES: readonly PhProvince[] = Object.entries(BY_REGION)
  .flatMap(([region, names]) => names.map((name) => ({ name, region })))
  .sort((a, b) => a.name.localeCompare(b.name));

/** The region for a province name, or null if it is not on the list. */
export function regionForProvince(province: string): string | null {
  return PH_PROVINCES.find((item) => item.name === province)?.region ?? null;
}

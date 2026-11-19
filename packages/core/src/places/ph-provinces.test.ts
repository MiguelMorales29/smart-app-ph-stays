import { describe, expect, it } from 'vitest';
import { PH_PROVINCES, regionForProvince } from './ph-provinces.js';

describe('PH provinces', () => {
  it('lists every province once, sorted, with a region', () => {
    const names = PH_PROVINCES.map((item) => item.name);
    expect(new Set(names).size).toBe(names.length);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
    expect(PH_PROVINCES.length).toBeGreaterThanOrEqual(80);
  });

  it('fills in the region', () => {
    expect(regionForProvince('Cavite')).toBe('Region IV-A');
    expect(regionForProvince('Metro Manila')).toBe('NCR');
    expect(regionForProvince('Benguet')).toBe('CAR');
    expect(regionForProvince('Atlantis')).toBeNull();
  });
});

import { z } from 'zod';

export const PROPERTY_STATUSES = ['draft', 'published', 'unpublished'] as const;
export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

export const CANCELLATION_PRESETS = [
  'flexible',
  'moderate',
  'firm',
  'dp_rebook',
  'non_refundable',
  'custom',
] as const;
export const cancellationPresetSchema = z.enum(CANCELLATION_PRESETS);
export type CancellationPreset = z.infer<typeof cancellationPresetSchema>;

export const UNIT_MODES = ['short_stay', 'long_term'] as const;
export const unitModeSchema = z.enum(UNIT_MODES);
export type UnitMode = z.infer<typeof unitModeSchema>;

export const UNIT_TYPES = ['entire_place', 'private_room', 'bed_space'] as const;
export const unitTypeSchema = z.enum(UNIT_TYPES);
export type UnitType = z.infer<typeof unitTypeSchema>;

/** Who may stay in a shared room (R-1b): PH bedspace listings lead with this. */
export const ROOM_GUESTS = ['anyone', 'ladies', 'gents'] as const;
export const roomGuestsSchema = z.enum(ROOM_GUESTS);
export type RoomGuests = z.infer<typeof roomGuestsSchema>;

/** Where the bathroom of a shared room is (R-1b). */
export const ROOM_BATHROOMS = ['shared', 'in_room'] as const;
export const roomBathroomSchema = z.enum(ROOM_BATHROOMS);
export type RoomBathroom = z.infer<typeof roomBathroomSchema>;

/** How the down payment is set (R-3, D93): a share of the total or a fixed peso amount. */
export const DOWN_PAYMENT_KINDS = ['percent', 'fixed'] as const;
export const downPaymentKindSchema = z.enum(DOWN_PAYMENT_KINDS);
export type DownPaymentKind = z.infer<typeof downPaymentKindSchema>;

export const UNIT_STATUSES = ['draft', 'listed', 'unlisted'] as const;
export const unitStatusSchema = z.enum(UNIT_STATUSES);
export type UnitStatus = z.infer<typeof unitStatusSchema>;

export const AMENITY_GROUPS = [
  'essentials',
  'comfort',
  'kitchen',
  'bathroom',
  'safety',
  'outdoor',
  'other',
] as const;
export const amenityGroupSchema = z.enum(AMENITY_GROUPS);
export type AmenityGroup = z.infer<typeof amenityGroupSchema>;

export const FONT_PAIRS = [
  'malinaw',
  'friendly',
  'street',
  'cafe',
  'elegant',
  'bakery',
  'playful',
  'modern',
  'bold',
  'homey',
] as const;
export const fontPairSchema = z.enum(FONT_PAIRS);
export type FontPair = z.infer<typeof fontPairSchema>;

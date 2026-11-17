import { z } from 'zod';

import { uuidSchema } from '../../ids/index.js';
import { centavosSchema } from '../../money/index.js';
import { calendarDateSchema, nightsBetween } from '../../time/index.js';

export const isoTimestampSchema = z.iso.datetime({ offset: true });

export const wallTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, 'Expected wall time in HH:MM or HH:MM:SS.');

export const positiveCentavosSchema = centavosSchema.refine((value) => value > 0, {
  message: 'Amount in centavos must be above zero.',
});

export const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Expected a 6-digit hex color such as #1A2B3C.');

export const jsonRecordSchema = z.record(z.string(), z.unknown());

export const boundedDateRangeSchema = z
  .object({
    start: calendarDateSchema,
    end: calendarDateSchema,
  })
  .refine((range) => nightsBetween(range.start, range.end) > 0, {
    message: 'Date range end must be after start.',
  });

export type BoundedDateRange = z.infer<typeof boundedDateRangeSchema>;

export const occupancyDateRangeSchema = z
  .object({
    start: calendarDateSchema,
    end: calendarDateSchema.nullable(),
  })
  .refine((range) => range.end === null || nightsBetween(range.start, range.end) > 0, {
    message: 'Occupancy date range end must be after start when set.',
  });

export type OccupancyDateRange = z.infer<typeof occupancyDateRangeSchema>;

export const dailyTimeRangeSchema = z
  .object({
    start: wallTimeSchema,
    end: wallTimeSchema,
  })
  .refine((range) => range.end > range.start, {
    message: 'Time range end must be after start and not past midnight.',
  });

export const weeklyHoursSchema = z.object({
  mon: z.array(dailyTimeRangeSchema).max(4),
  tue: z.array(dailyTimeRangeSchema).max(4),
  wed: z.array(dailyTimeRangeSchema).max(4),
  thu: z.array(dailyTimeRangeSchema).max(4),
  fri: z.array(dailyTimeRangeSchema).max(4),
  sat: z.array(dailyTimeRangeSchema).max(4),
  sun: z.array(dailyTimeRangeSchema).max(4),
  closed_dates: z.array(calendarDateSchema),
});

export type WeeklyHours = z.infer<typeof weeklyHoursSchema>;

export const propertyContactSchema = z.object({
  phone: z.string().max(40).nullable(),
  messenger: z.string().max(200).nullable(),
  facebook: z.string().max(200).nullable(),
  instagram: z.string().max(200).nullable(),
  tiktok: z.string().max(200).nullable(),
  viber: z.string().max(80).nullable(),
  whatsapp: z.string().max(80).nullable(),
  google_review_url: z.string().max(500).nullable(),
});

export type PropertyContact = z.infer<typeof propertyContactSchema>;

export const propertyPageBannerSchema = z.object({
  photo: uuidSchema,
  alt: z.string().min(1).max(120),
  title: z.string().max(40).nullable(),
  line: z.string().max(90).nullable(),
  link: z.string().max(500).nullable(),
});

export const propertyPageAnnouncementSchema = z.object({
  text: z.string().min(1).max(200),
  tone: z.enum(['info', 'warning', 'success']),
  end_date: calendarDateSchema.nullable(),
});

export const propertyPageDraftSchema = z.object({
  logo: uuidSchema.nullable(),
  tagline: z.string().max(80).nullable(),
  about: z.string().max(600).nullable(),
  look: z.object({
    brand_color: hexColorSchema,
    page_color: hexColorSchema,
    card_color: hexColorSchema,
    logo_shape: z.enum(['circle', 'rounded']),
    font_pair: z.string().min(1).max(40),
    banners: z.array(propertyPageBannerSchema).max(3),
    banner_seconds: z.int().min(3).max(10),
    announcement: propertyPageAnnouncementSchema.nullable(),
    sections: z.record(z.string(), z.boolean()),
  }),
  install: z.object({
    home_screen_name: z.string().min(1).max(12),
    splash_color: hexColorSchema,
    splash_animation: z.boolean(),
    show_name: z.boolean(),
    show_tagline: z.boolean(),
  }),
  hero: z.object({
    cover: uuidSchema.nullable(),
    photos: z.array(uuidSchema).max(5),
  }),
  host: z.object({
    display_name: z.string().min(1).max(80),
    photo_file: uuidSchema.nullable(),
    languages: z.array(z.string().min(1).max(40)),
  }),
  units: z.array(uuidSchema).max(4),
  highlights: z.array(uuidSchema).max(6),
  faq: z
    .array(
      z.object({
        question: z.string().min(1).max(200),
        answer: z.string().min(1).max(1000),
      }),
    )
    .max(10),
  seo: z.object({
    title: z.string().max(60).nullable(),
    description: z.string().max(155).nullable(),
    share_picture_file: uuidSchema.nullable(),
    hide_from_search: z.boolean(),
  }),
});

export type PropertyPageDraft = z.infer<typeof propertyPageDraftSchema>;

export const profileAvatarSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('initials'), text: z.string().min(1).max(3) }),
  z.object({ kind: z.literal('preset'), preset_id: z.string().min(1).max(40) }),
  z.object({ kind: z.literal('photo'), file_id: uuidSchema }),
]);

export type ProfileAvatar = z.infer<typeof profileAvatarSchema>;

export const memberNotifyPrefsSchema = z.object({
  new_booking: z.boolean(),
  payment_to_check: z.boolean(),
  storage_80: z.boolean(),
  storage_full: z.boolean(),
  plan_due: z.boolean(),
  send_to: z.email().nullable(),
});

export type MemberNotifyPrefs = z.infer<typeof memberNotifyPrefsSchema>;

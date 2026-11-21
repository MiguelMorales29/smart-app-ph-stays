import { z } from 'zod';

import { propertyPageDraftSchema } from '../schemas/tables/common.js';
import { editorPartSchema } from './changes.js';

/**
 * Preview channel messages between the dashboard Editor and the storefront `/<slug>/preview` frame
 * (Feature blueprint §7a step 1, decision T72 / E13).
 * Ported from the food app's `packages/core/src/schemas/editor.ts` and
 * `apps/storefront/src/features/preview/preview-messages.ts`, with `shop` renamed to `property`.
 */
export const EDITOR_CHANNEL = 'smartapp-property-editor';
const channelSchema = z.literal(EDITOR_CHANNEL);

export const PREVIEW_PAGES = ['home', 'unit', 'book', 'info'] as const;
export const previewPageSchema = z.enum(PREVIEW_PAGES);
export type PreviewPage = z.infer<typeof previewPageSchema>;

export const BANNER_TEXT_FIELDS = ['title', 'line'] as const;
export const bannerTextFieldSchema = z.enum(BANNER_TEXT_FIELDS);
export type BannerTextField = z.infer<typeof bannerTextFieldSchema>;

export const BANNER_TEXT_MAX: Readonly<Record<BannerTextField, number>> = {
  title: 40,
  line: 90,
};

/**
 * Dashboard Editor → Storefront Preview frame messages.
 * Supports the prompt's canonical message types (`draft`, `select-part`, `hover-part`, `go-to-page`)
 * plus banner slide selection and splash opening preview triggers.
 */
export const editorToPreviewMessageSchema = z.discriminatedUnion('type', [
  z.object({
    channel: channelSchema,
    type: z.literal('draft'),
    draft: propertyPageDraftSchema,
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('select-part'),
    part: editorPartSchema.nullable(),
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('hover-part'),
    part: editorPartSchema.nullable(),
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('go-to-page'),
    page: previewPageSchema,
    unitSlug: z.string().min(1).max(60).nullable().optional(),
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('banner'),
    index: z.int().min(0).max(2),
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('opening'),
    run: z.int().min(1),
  }),
]);
export type EditorToPreviewMessage = z.infer<typeof editorToPreviewMessageSchema>;

/**
 * Storefront Preview frame → Dashboard Editor messages (`ready`, `part-clicked`, `go-to-page`, `banner-text`).
 */
export const previewToEditorMessageSchema = z.discriminatedUnion('type', [
  z.object({
    channel: channelSchema,
    type: z.literal('ready'),
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('part-clicked'),
    part: editorPartSchema,
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('go-to-page'),
    page: previewPageSchema,
    unitSlug: z.string().min(1).max(60).nullable().optional(),
  }),
  z.object({
    channel: channelSchema,
    type: z.literal('banner-text'),
    index: z.int().min(0).max(2),
    field: bannerTextFieldSchema,
    value: z.string().max(BANNER_TEXT_MAX.line),
  }),
]);
export type PreviewToEditorMessage = z.infer<typeof previewToEditorMessageSchema>;

/** Minimal shape of a cross-window `MessageEvent` so pure core helpers need no DOM global types. */
export interface PreviewMessageEventLike {
  readonly origin: string;
  readonly source: unknown;
  readonly data: unknown;
}

/** Minimal shape of a `Window` target that can receive `postMessage`. */
export interface PostMessageTargetLike {
  postMessage: (message: unknown, targetOrigin: string) => void;
}

/**
 * Validates an incoming message from the dashboard Editor in the storefront preview frame.
 * Returns `null` when the origin, source window, channel or Zod payload does not match.
 */
export function readEditorMessage(
  event: PreviewMessageEventLike,
  dashboardOrigin: string,
  expectedParent: unknown,
): EditorToPreviewMessage | null {
  if (event.origin !== dashboardOrigin) return null;
  if (expectedParent === null || expectedParent === undefined || event.source !== expectedParent) {
    return null;
  }
  const parsed = editorToPreviewMessageSchema.safeParse(event.data);
  return parsed.success ? parsed.data : null;
}

/**
 * Validates an incoming message from the storefront preview frame in the dashboard Editor.
 * Returns `null` when the origin, frame window, channel or Zod payload does not match.
 */
export function readPreviewMessage(
  event: PreviewMessageEventLike,
  storefrontOrigin: string,
  expectedFrameWindow: unknown,
): PreviewToEditorMessage | null {
  if (event.origin !== storefrontOrigin) return null;
  if (
    expectedFrameWindow === null ||
    expectedFrameWindow === undefined ||
    event.source !== expectedFrameWindow
  ) {
    return null;
  }
  const parsed = previewToEditorMessageSchema.safeParse(event.data);
  return parsed.success ? parsed.data : null;
}

/** Sends a validated message from the preview frame to the framing Editor window. */
export function tellEditor(
  message: PreviewToEditorMessage,
  dashboardOrigin: string,
  parentWindow: PostMessageTargetLike | null,
  currentWindow?: unknown,
): void {
  if (parentWindow === null || (currentWindow !== undefined && parentWindow === currentWindow)) {
    return;
  }
  const valid = previewToEditorMessageSchema.parse(message);
  parentWindow.postMessage(valid, dashboardOrigin);
}

/** Sends a validated message from the dashboard Editor to the storefront preview iframe. */
export function tellPreview(
  message: EditorToPreviewMessage,
  storefrontOrigin: string,
  frameWindow: PostMessageTargetLike | null,
): void {
  if (frameWindow === null) return;
  const valid = editorToPreviewMessageSchema.parse(message);
  frameWindow.postMessage(valid, storefrontOrigin);
}

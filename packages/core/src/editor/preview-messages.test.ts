import { describe, expect, it } from 'vitest';

import { DEMO_IDS } from '../demo/ids.js';
import type { PropertyPageDraft } from '../schemas/tables/common.js';
import {
  EDITOR_CHANNEL,
  editorToPreviewMessageSchema,
  previewToEditorMessageSchema,
  readEditorMessage,
  readPreviewMessage,
  tellEditor,
  tellPreview,
} from './preview-messages.js';

const sampleDraft: PropertyPageDraft = {
  logo: DEMO_IDS.ulapSuites.logoFile,
  tagline: 'Your weekend above the clouds',
  about: 'Cozy Tagaytay staycations.',
  look: {
    brandColor: '#6167C6',
    pageColor: '#F9FAFF',
    cardColor: '#E8ECFF',
    accentColor: '#E68B3C',
    logoShape: 'rounded',
    fontPair: 'cafe',
    banners: [],
    bannerSeconds: 5,
    announcement: null,
    sections: { about: true },
  },
  install: {
    homeScreenName: 'Ulap Suites',
    splashColor: '#3A3C83',
    splashAnimation: true,
    showName: true,
    showTagline: true,
  },
  hero: { cover: null, photos: [] },
  host: { displayName: 'Marco Villanueva', photoFile: null, languages: ['Tagalog', 'English'] },
  units: [],
  highlights: [],
  faq: [],
  seo: { title: null, description: null, sharePictureFile: null, hideFromSearch: false },
};

describe('preview-messages channel schema', () => {
  it('parses all Editor → Preview messages (draft, select-part, hover-part, go-to-page)', () => {
    expect(
      editorToPreviewMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'draft',
        draft: sampleDraft,
      }).success,
    ).toBe(true);

    expect(
      editorToPreviewMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'select-part',
        part: 'banners',
      }).success,
    ).toBe(true);

    expect(
      editorToPreviewMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'hover-part',
        part: null,
      }).success,
    ).toBe(true);

    expect(
      editorToPreviewMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'go-to-page',
        page: 'unit',
        unitSlug: 'studio-fog',
      }).success,
    ).toBe(true);
  });

  it('parses all Preview → Editor messages (ready, part-clicked, go-to-page, banner-text)', () => {
    expect(
      previewToEditorMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'ready',
      }).success,
    ).toBe(true);

    expect(
      previewToEditorMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'part-clicked',
        part: 'style',
      }).success,
    ).toBe(true);

    expect(
      previewToEditorMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'go-to-page',
        page: 'info',
      }).success,
    ).toBe(true);

    expect(
      previewToEditorMessageSchema.safeParse({
        channel: EDITOR_CHANNEL,
        type: 'banner-text',
        index: 1,
        field: 'title',
        value: 'Sunrise view',
      }).success,
    ).toBe(true);
  });

  it('rejects untagged messages, wrong origin, wrong source window, or invalid parts', () => {
    const parentWin = { id: 'parent' };
    const frameWin = { id: 'frame' };
    const dashboardOrigin = 'http://localhost:5174';
    const storefrontOrigin = 'http://localhost:3100';

    const validMsg = {
      channel: EDITOR_CHANNEL,
      type: 'select-part' as const,
      part: 'faq' as const,
    };

    expect(
      readEditorMessage(
        { origin: dashboardOrigin, source: parentWin, data: validMsg },
        dashboardOrigin,
        parentWin,
      ),
    ).toEqual(validMsg);

    // Wrong origin ignored
    expect(
      readEditorMessage(
        { origin: 'https://evil.example', source: parentWin, data: validMsg },
        dashboardOrigin,
        parentWin,
      ),
    ).toBeNull();

    // Wrong source window ignored
    expect(
      readEditorMessage(
        { origin: dashboardOrigin, source: { id: 'other' }, data: validMsg },
        dashboardOrigin,
        parentWin,
      ),
    ).toBeNull();

    // Missing channel ignored
    expect(
      readEditorMessage(
        { origin: dashboardOrigin, source: parentWin, data: { type: 'select-part', part: 'faq' } },
        dashboardOrigin,
        parentWin,
      ),
    ).toBeNull();

    // Preview -> Editor verification
    const clickedMsg = {
      channel: EDITOR_CHANNEL,
      type: 'part-clicked' as const,
      part: 'hero' as const,
    };
    expect(
      readPreviewMessage(
        { origin: storefrontOrigin, source: frameWin, data: clickedMsg },
        storefrontOrigin,
        frameWin,
      ),
    ).toEqual(clickedMsg);

    expect(
      readPreviewMessage(
        { origin: 'https://wrong.origin', source: frameWin, data: clickedMsg },
        storefrontOrigin,
        frameWin,
      ),
    ).toBeNull();
  });

  it('sends validated messages via tellEditor and tellPreview and skips self-parent windows', () => {
    const sent: { message: unknown; origin: string }[] = [];
    const target = {
      postMessage(message: unknown, targetOrigin: string) {
        sent.push({ message, origin: targetOrigin });
      },
    };

    // Standalone window (parent === self) sends nothing
    tellEditor({ channel: EDITOR_CHANNEL, type: 'ready' }, 'http://localhost:5174', target, target);
    expect(sent).toHaveLength(0);

    tellEditor({ channel: EDITOR_CHANNEL, type: 'ready' }, 'http://localhost:5174', target, {});
    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual({
      message: { channel: EDITOR_CHANNEL, type: 'ready' },
      origin: 'http://localhost:5174',
    });

    tellPreview(
      { channel: EDITOR_CHANNEL, type: 'hover-part', part: 'units' },
      'http://localhost:3100',
      target,
    );
    expect(sent).toHaveLength(2);
  });
});

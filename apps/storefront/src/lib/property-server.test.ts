import { createDefaultSwitchState, serializeSwitchStateCookie } from '@smartapp/data/switches';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeAll, describe, expect, it } from 'vitest';

describe('resolveServerProperty and paused server render', () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_APP_ENV = 'development';
    process.env.NEXT_PUBLIC_DATA_SOURCE = 'memory';
    process.env.NEXT_PUBLIC_STOREFRONT_ORIGIN = 'http://localhost:3100';
  });

  it('resolves the qa pack paused owner and renders the contact-only view on the server', async () => {
    const { resolveServerProperty } = await import('./property-server');
    const { ConversationFrame } = await import('../components/frames/ConversationFrame');
    const { PropertyFrame } = await import('../components/frames/PropertyFrame');

    const qaState = {
      ...createDefaultSwitchState(),
      pack: 'qa' as const,
      as: 'guest' as const,
    };
    const qaCookie = encodeURIComponent(JSON.stringify(qaState));
    expect(serializeSwitchStateCookie(qaState)).toContain('smartapp.dev.switches=');

    const pausedProperty = await resolveServerProperty('casa-soriano-paused', qaCookie);
    expect(pausedProperty).not.toBeNull();
    expect(pausedProperty?.account.is_paused).toBe(true);

    if (!pausedProperty) {
      return;
    }

    const propertyHtml = renderToStaticMarkup(
      createElement(PropertyFrame, {
        propertyView: pausedProperty,
        children: createElement('p', null, 'Booking action content'),
      }),
    );
    expect(propertyHtml).toContain('is temporarily paused');
    expect(propertyHtml).toContain('Online bookings are paused right now.');
    expect(propertyHtml).not.toContain('Booking action content');
    expect(propertyHtml).not.toContain('/casa-soriano-paused/book');
    expect(propertyHtml).not.toContain('/casa-soriano-paused/inquire');

    const conversationHtml = renderToStaticMarkup(
      createElement(ConversationFrame, {
        propertyView: pausedProperty,
        children: createElement('p', null, 'Thread reply box'),
      }),
    );
    expect(conversationHtml).toContain('is temporarily paused');
    expect(conversationHtml).not.toContain('Thread reply box');
  });

  it('returns null for an unknown property slug', async () => {
    const { resolveServerProperty } = await import('./property-server');
    const missing = await resolveServerProperty('does-not-exist', null);
    expect(missing).toBeNull();
  });
});

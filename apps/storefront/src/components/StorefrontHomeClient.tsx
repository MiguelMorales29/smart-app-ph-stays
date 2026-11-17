'use client';

import { manilaToday, type PropertyView } from '@smartapp/core';
import { mediaUrl } from '@smartapp/data';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { env } from '@/env';
import { loadStorefrontClient } from '@/lib/storefront-client';

type LoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'empty'; readonly pack: string; readonly as: string }
  | { readonly kind: 'offline'; readonly message: string }
  | { readonly kind: 'error'; readonly code: string; readonly message: string }
  | {
      readonly kind: 'ready';
      readonly pack: string;
      readonly as: string;
      readonly today: string;
      readonly hasBookingLink: boolean;
      readonly activeSearch: string;
      readonly properties: readonly PropertyView[];
    };

export function StorefrontHomeClient() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [reloadNonce, setReloadNonce] = useState(0);

  const searchString = searchParams.toString();
  const normalizedSearch = searchString.length > 0 ? `?${searchString}` : '';

  const refresh = useCallback(() => {
    setState({ kind: 'loading' });
    setReloadNonce((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const onSwitchChange = () => {
      refresh();
    };
    window.addEventListener('smartapp:switch-change', onSwitchChange);
    return () => {
      window.removeEventListener('smartapp:switch-change', onSwitchChange);
    };
  }, [refresh]);

  useEffect(() => {
    let active = true;

    async function fetchProperties() {
      try {
        const search = window.location.search || normalizedSearch;
        const client = await loadStorefrontClient(search);
        if (!active) return;

        if (client.propertySlugs.length === 0) {
          setState({ kind: 'empty', pack: client.pack, as: client.as });
          return;
        }

        const results = await Promise.all(
          client.propertySlugs.map((slug) => client.source.getProperty({ slug }, client.session)),
        );
        if (!active) return;

        const failed = results.find((res) => !res.ok);
        if (failed && !failed.ok) {
          if (failed.error.details?.offline === true) {
            setState({ kind: 'offline', message: failed.error.message });
          } else {
            setState({
              kind: 'error',
              code: failed.error.code,
              message: failed.error.message,
            });
          }
          return;
        }

        const loadedProperties = results.flatMap((res) => (res.ok ? [res.data] : []));
        if (loadedProperties.length === 0) {
          setState({ kind: 'empty', pack: client.pack, as: client.as });
          return;
        }

        setState({
          kind: 'ready',
          pack: client.pack,
          as: client.as,
          today: manilaToday(client.clock),
          hasBookingLink: client.hasBookingLink,
          activeSearch: search,
          properties: loadedProperties,
        });
      } catch (caught: unknown) {
        if (!active) return;
        const message = caught instanceof Error ? caught.message : String(caught);
        setState({ kind: 'error', code: 'unavailable', message });
      }
    }

    void fetchProperties();
    return () => {
      active = false;
    };
  }, [normalizedSearch, reloadNonce]);

  return (
    <main>
      <h1>Smart App PH · Stays and Rentals</h1>

      {state.kind === 'loading' ? <p role="status">Loading stays…</p> : null}

      {state.kind === 'offline' ? (
        <section role="alert">
          <h2>Offline</h2>
          <p>{state.message}</p>
          <button type="button" onClick={refresh}>
            Retry
          </button>
        </section>
      ) : null}

      {state.kind === 'error' ? (
        <section role="alert">
          <h2>Something went wrong ({state.code})</h2>
          <p>{state.message}</p>
          <button type="button" onClick={refresh}>
            Retry
          </button>
        </section>
      ) : null}

      {state.kind === 'empty' ? (
        <section>
          <h2>No stays listed</h2>
          <p>
            Active scenario ({state.pack}) has no published properties yet (viewing as {state.as}).
          </p>
        </section>
      ) : null}

      {state.kind === 'ready' ? (
        <section>
          <p>
            Scenario: <strong>{state.pack}</strong> · Viewing as: <strong>{state.as}</strong> ·
            Manila date: <strong>{state.today}</strong>
            {state.hasBookingLink ? ' · Booking link token active' : ''}
          </p>
          <ul>
            {state.properties.map((item) => {
              const coverPhoto = item.photos[0];
              const fallbackUrl = coverPhoto
                ? mediaUrl(
                    {
                      bucket: 'listing-media',
                      path: coverPhoto.url.replace(/^\/demo-media\//, 'demo-media/'),
                    },
                    { mode: 'memory', storefrontOrigin: env.STOREFRONT_ORIGIN },
                  )
                : null;
              const coverSrc = coverPhoto?.url ?? fallbackUrl;

              return (
                <li key={item.property.id}>
                  <h2>
                    <Link href={`/${item.property.slug}${state.activeSearch}`}>
                      {item.property.name}
                    </Link>
                  </h2>
                  <p>
                    {item.property.city}, {item.property.province} — {item.property.tagline}
                  </p>
                  <p>
                    Units: {item.units.length} · Page version: v{item.page.version}
                  </p>
                  {coverSrc ? (
                    <Image
                      src={coverSrc}
                      alt={coverPhoto?.alt_text ?? item.property.name}
                      width={320}
                      height={180}
                      unoptimized
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

'use client';

import { manilaToday, type PropertyView } from '@smartapp/core';
import { mediaUrl } from '@smartapp/data';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { ErrorState } from '@smartapp/ui/compositions/error-state';
import { LoadingState } from '@smartapp/ui/compositions/loading-state';

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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          Stays and rentals
        </h1>
        <p className="text-sm text-muted-foreground">
          Places to stay, booked straight from the owner. Sample properties for now.
        </p>
      </div>

      {state.kind === 'loading' ? <LoadingState layout="cards" label="Loading stays…" /> : null}

      {state.kind === 'offline' ? (
        <ErrorState title="You are offline" message={state.message} onRetry={refresh} />
      ) : null}

      {state.kind === 'error' ? (
        <ErrorState
          title={`Something went wrong (${state.code})`}
          message={state.message}
          onRetry={refresh}
        />
      ) : null}

      {state.kind === 'empty' ? (
        <EmptyState
          title="No stays listed yet"
          description={`The ${state.pack} scenario has no published properties (viewing as ${state.as}).`}
        />
      ) : null}

      {state.kind === 'ready' ? (
        <section aria-label="Properties" className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">
            Scenario {state.pack} · viewing as {state.as} · Manila date{' '}
            <span className="tabular">{state.today}</span>
            {state.hasBookingLink ? ' · booking link token active' : ''}
          </p>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              const unitCount = item.units.length;

              return (
                <li key={item.property.id}>
                  <Link
                    href={`/${item.property.slug}${state.activeSearch}`}
                    className="group pressable flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-[4/3] w-full bg-muted">
                      {coverSrc ? (
                        <Image
                          src={coverSrc}
                          alt={coverPhoto?.alt_text ?? item.property.name}
                          fill
                          sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="flex flex-1 flex-col gap-1 p-4">
                      <h2 className="font-heading text-base font-semibold group-hover:underline">
                        {item.property.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {item.property.city}, {item.property.province}
                      </p>
                      <p className="line-clamp-2 text-sm">{item.property.tagline}</p>
                      <p className="mt-auto pt-2 text-xs text-muted-foreground">
                        {unitCount} {unitCount === 1 ? 'unit' : 'units'}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

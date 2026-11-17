'use client';

import {
  addDays,
  formatPeso,
  manilaToday,
  type PropertyView,
  type StayQuoteView,
} from '@smartapp/core';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { loadStorefrontClient } from '@/lib/storefront-client';

type DetailLoadState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'empty'; readonly slug: string }
  | { readonly kind: 'offline'; readonly message: string }
  | { readonly kind: 'error'; readonly code: string; readonly message: string }
  | {
      readonly kind: 'ready';
      readonly pack: string;
      readonly as: string;
      readonly today: string;
      readonly activeSearch: string;
      readonly propertyView: PropertyView;
      readonly quoteUnitName: string | null;
      readonly quoteCheckIn: string | null;
      readonly quoteCheckOut: string | null;
      readonly quoteResult: StayQuoteView | null;
      readonly quoteNote: string | null;
    };

export function StorefrontPropertyClient() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const [state, setState] = useState<DetailLoadState>({ kind: 'loading' });
  const [reloadNonce, setReloadNonce] = useState(0);

  const slug = typeof params.slug === 'string' ? params.slug : '';
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

    async function fetchDetail() {
      if (!slug) {
        setState({ kind: 'empty', slug });
        return;
      }

      try {
        const search = window.location.search || normalizedSearch;
        const client = await loadStorefrontClient(search);
        if (!active) return;

        const propRes = await client.source.getProperty({ slug }, client.session);
        if (!active) return;

        if (!propRes.ok) {
          if (propRes.error.details?.offline === true) {
            setState({ kind: 'offline', message: propRes.error.message });
          } else if (propRes.error.code === 'not_found' && client.pack !== 'error') {
            setState({ kind: 'empty', slug });
          } else {
            setState({
              kind: 'error',
              code: propRes.error.code,
              message: propRes.error.message,
            });
          }
          return;
        }

        const propertyView = propRes.data;
        const today = manilaToday(client.clock);
        const stayUnit = propertyView.units.find((unit) => unit.mode === 'short_stay');

        if (!stayUnit) {
          setState({
            kind: 'ready',
            pack: client.pack,
            as: client.as,
            today,
            activeSearch: search,
            propertyView,
            quoteUnitName: null,
            quoteCheckIn: null,
            quoteCheckOut: null,
            quoteResult: null,
            quoteNote: 'Monthly rental property — no nightly stay quote needed.',
          });
          return;
        }

        const checkIn = addDays(today, 2);
        const checkOut = addDays(today, 4);
        const quoteRes = await client.source.quoteStay(
          {
            unitId: stayUnit.id,
            checkIn,
            checkOut,
            adults: stayUnit.stay_terms?.base_guests ?? 2,
            children: 0,
          },
          client.session,
        );
        if (!active) return;

        if (!quoteRes.ok) {
          if (quoteRes.error.details?.offline === true) {
            setState({ kind: 'offline', message: quoteRes.error.message });
            return;
          }
          setState({
            kind: 'ready',
            pack: client.pack,
            as: client.as,
            today,
            activeSearch: search,
            propertyView,
            quoteUnitName: stayUnit.name,
            quoteCheckIn: checkIn,
            quoteCheckOut: checkOut,
            quoteResult: null,
            quoteNote: `Sample quote (${quoteRes.error.code}): ${quoteRes.error.message}`,
          });
          return;
        }

        setState({
          kind: 'ready',
          pack: client.pack,
          as: client.as,
          today,
          activeSearch: search,
          propertyView,
          quoteUnitName: stayUnit.name,
          quoteCheckIn: checkIn,
          quoteCheckOut: checkOut,
          quoteResult: quoteRes.data,
          quoteNote: null,
        });
      } catch (caught: unknown) {
        if (!active) return;
        const message = caught instanceof Error ? caught.message : String(caught);
        setState({ kind: 'error', code: 'unavailable', message });
      }
    }

    void fetchDetail();
    return () => {
      active = false;
    };
  }, [slug, normalizedSearch, reloadNonce]);

  const backSearch = state.kind === 'ready' ? state.activeSearch : normalizedSearch;

  return (
    <main>
      <p>
        <Link href={`/${backSearch}`}>← All properties</Link>
      </p>

      {state.kind === 'loading' ? <p role="status">Loading property…</p> : null}

      {state.kind === 'offline' ? (
        <section role="alert">
          <h1>Offline</h1>
          <p>{state.message}</p>
          <button type="button" onClick={refresh}>
            Retry
          </button>
        </section>
      ) : null}

      {state.kind === 'error' ? (
        <section role="alert">
          <h1>Could not load property ({state.code})</h1>
          <p>{state.message}</p>
          <button type="button" onClick={refresh}>
            Retry
          </button>
        </section>
      ) : null}

      {state.kind === 'empty' ? (
        <section>
          <h1>Property not found</h1>
          <p>No published property matches slug “{state.slug}”.</p>
        </section>
      ) : null}

      {state.kind === 'ready' ? (
        <article>
          <h1>{state.propertyView.property.name}</h1>
          <p>
            {state.propertyView.property.city}, {state.propertyView.property.province} · Scenario:{' '}
            <strong>{state.pack}</strong> · Viewing as: <strong>{state.as}</strong> · Manila date:{' '}
            <strong>{state.today}</strong>
          </p>
          <p>{state.propertyView.property.description}</p>

          <section>
            <h2>Units ({state.propertyView.units.length})</h2>
            <ul>
              {state.propertyView.units.map((unit) => (
                <li key={unit.id}>
                  <strong>{unit.name}</strong> ({unit.mode}) — max {unit.max_guests} guests
                  {unit.stay_terms
                    ? ` · base ${formatPeso(unit.stay_terms.base_nightly_centavos)}/night`
                    : ''}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Sample stay quote</h2>
            {state.quoteUnitName && state.quoteCheckIn && state.quoteCheckOut ? (
              <p>
                {state.quoteUnitName}: {state.quoteCheckIn} to {state.quoteCheckOut}
              </p>
            ) : null}
            {state.quoteResult ? (
              <div>
                <p>
                  {state.quoteResult.nights} nights · Total:{' '}
                  <strong>{formatPeso(state.quoteResult.total_centavos)}</strong> · Down payment
                  required: <strong>{formatPeso(state.quoteResult.required_centavos)}</strong>
                </p>
                <ul>
                  {state.quoteResult.lines.map((line, index) => (
                    <li key={`${line.kind}-${index}`}>
                      {line.label}: {formatPeso(line.amount_centavos)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {state.quoteNote ? <p>{state.quoteNote}</p> : null}
          </section>
        </article>
      ) : null}
    </main>
  );
}

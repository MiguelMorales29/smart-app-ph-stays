import type { FontPair, PropertyView } from '@smartapp/core';
import { Badge } from '@smartapp/ui/components/badge';
import { Banner, BannerIcon, BannerTitle } from '@smartapp/ui/components/banner';
import { Button } from '@smartapp/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@smartapp/ui/components/empty';
import { Input } from '@smartapp/ui/components/input';
import { Separator } from '@smartapp/ui/components/separator';
import { PropertyTheme, type PropertyLogoShape } from '@smartapp/ui/compositions/property-theme';
import { MapPinOffIcon, WifiOffIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { DemoBanner } from '@/components/DemoBanner';
import { PausedPropertyContent } from '@/components/frames/PausedPropertyContent';
import { PropertyFrame } from '@/components/frames/PropertyFrame';
import { PlaceholderPageContent } from '@/components/PlaceholderPageContent';
import { resolveServerProperty } from '@/lib/property-server';

import { StorefrontKitUi1Section } from './StorefrontKitUi1Section';
import { StorefrontKitUi2Section } from './StorefrontKitUi2Section';

export const STOREFRONT_KIT_LOOKS = [
  'ulap-suites',
  'bahay-batis',
  'ilaw-residences',
  'tita-lorna-dorm',
  'worst-case',
] as const;

export type StorefrontKitLookKey = (typeof STOREFRONT_KIT_LOOKS)[number];

interface LookMeta {
  readonly key: StorefrontKitLookKey;
  readonly label: string;
  readonly brandColor: string;
  readonly pageColor: string | null;
  readonly cardColor: string | null;
  readonly accentColor: string | null;
  readonly fontPair: FontPair;
  readonly logoShape: PropertyLogoShape;
  readonly propertyView: PropertyView;
}

function KitRuleLines({ useFor, dont }: { readonly useFor: string; readonly dont: string }) {
  return (
    <div className="space-y-0.5 text-xs text-muted-foreground">
      <p>
        <strong className="font-medium text-foreground">Use for:</strong> {useFor}
      </p>
      <p>
        <strong className="font-medium text-foreground">Don&apos;t:</strong> {dont}
      </p>
    </div>
  );
}

function KitSection({
  title,
  useFor,
  dont,
  children,
}: {
  readonly title: string;
  readonly useFor: string;
  readonly dont: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <KitRuleLines useFor={useFor} dont={dont} />
      </div>
      <Separator />
      <div>{children}</div>
    </section>
  );
}

function normalizeLookKey(raw: string | undefined): StorefrontKitLookKey {
  if (
    raw === 'ulap-suites' ||
    raw === 'bahay-batis' ||
    raw === 'ilaw-residences' ||
    raw === 'tita-lorna-dorm' ||
    raw === 'worst-case'
  ) {
    return raw;
  }
  return 'ulap-suites';
}

export async function StorefrontKitView({
  lookParam,
  switchQuery,
}: {
  readonly lookParam?: string | undefined;
  readonly switchQuery?: string | undefined;
}) {
  const cookiePayload = encodeURIComponent(
    JSON.stringify({
      as: 'guest',
      pack: 'marketing',
      clock: 'golden',
      errorCode: 'not_allowed',
      latencyMs: 2000,
    }),
  );

  const slugs = ['ulap-suites', 'bahay-batis', 'ilaw-residences', 'tita-lorna-dorm'] as const;
  const loaded = await Promise.all(slugs.map((slug) => resolveServerProperty(slug, cookiePayload)));

  const brandViews = new Map<string, PropertyView>();
  slugs.forEach((slug, idx) => {
    const view = loaded[idx];
    if (view) brandViews.set(slug, view);
  });

  const ulap = brandViews.get('ulap-suites');
  if (!ulap || !ulap.page.published) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-destructive">Could not load demo brands for storefront kit.</p>
      </main>
    );
  }

  const looks: LookMeta[] = [];
  for (const slug of slugs) {
    const pv = brandViews.get(slug);
    if (!pv?.page.published) continue;
    const look = pv.page.published.look;
    looks.push({
      key: slug,
      label: pv.property.name,
      brandColor: look.brandColor,
      pageColor: look.pageColor,
      cardColor: look.cardColor,
      accentColor: look.accentColor,
      fontPair: look.fontPair,
      logoShape: look.logoShape,
      propertyView: pv,
    });
  }

  const worstCaseView: PropertyView = {
    ...ulap,
    property: {
      ...ulap.property,
      name: 'Worst-case #FFE600 Look',
    },
    page: {
      ...ulap.page,
      published: {
        ...ulap.page.published,
        look: {
          ...ulap.page.published.look,
          brandColor: '#FFE600',
          pageColor: '#F9FAFD',
          cardColor: '#FFFFFF',
          accentColor: '#FFE600',
          fontPair: 'malinaw',
          logoShape: 'rounded',
        },
      },
    },
  };

  looks.push({
    key: 'worst-case',
    label: 'Worst case (#FFE600)',
    brandColor: '#FFE600',
    pageColor: '#F9FAFD',
    cardColor: '#FFFFFF',
    accentColor: '#FFE600',
    fontPair: 'malinaw',
    logoShape: 'rounded',
    propertyView: worstCaseView,
  });

  const selectedKey = normalizeLookKey(lookParam);
  const activeLook = looks.find((item) => item.key === selectedKey) ?? looks[0];
  if (!activeLook) {
    return null;
  }

  const pausedSampleView: PropertyView = {
    ...activeLook.propertyView,
    account: {
      ...activeLook.propertyView.account,
      is_paused: true,
    },
  };

  const extraSuffix = switchQuery ? `&${switchQuery}` : '';

  return (
    <div data-kit-marker="__SMARTAPP_DEV_KIT__">
      <PropertyTheme
        brandColor={activeLook.brandColor}
        pageColor={activeLook.pageColor}
        cardColor={activeLook.cardColor}
        accentColor={activeLook.accentColor}
        fontPair={activeLook.fontPair}
        logoShape={activeLook.logoShape}
        withPortals
      >
        <PropertyFrame
          propertyView={activeLook.propertyView}
          actionBar={
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Sticky action-bar slot</p>
                <p className="font-heading text-sm font-semibold tabular">₱3,800 / night</p>
              </div>
              <Button className="min-h-11 px-5">Reserve dates</Button>
            </div>
          }
        >
          <div className="space-y-6">
            <header className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">Storefront kit</Badge>
                <Badge variant="secondary">{activeLook.fontPair}</Badge>
                <Badge variant="secondary">{activeLook.logoShape}</Badge>
              </div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                {activeLook.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                Live storefront frame and shared guest compositions rendered through{' '}
                <code>PropertyTheme</code> (`60 / 30 / 10` palette + contrast guard).
              </p>
            </header>

            <nav aria-label="Property look switcher" className="flex flex-wrap gap-2">
              {looks.map((item) => {
                const isSelected = item.key === activeLook.key;
                return (
                  <Button
                    key={item.key}
                    variant={isSelected ? 'default' : 'outline'}
                    className="min-h-11"
                    nativeButton={false}
                    render={<Link href={`/kit?look=${item.key}${extraSuffix}`} />}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>

            <KitSection
              title="60 / 30 / 10 Palette & PropertyTheme"
              useFor="Every guest-facing page inside /[slug] so each property carries its own logo shape, colours, and font pair."
              dont="Use dark mode on the storefront or pick raw hex colours without passing through propertyPalette()."
            >
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-medium">Page (60)</p>
                  <p className="text-xs text-muted-foreground">--background</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs font-medium">Card (30)</p>
                  <p className="text-xs text-muted-foreground">--card</p>
                </div>
                <div className="rounded-lg bg-primary p-3 text-primary-foreground">
                  <p className="text-xs font-medium">Button (10)</p>
                  <p className="text-xs">--primary</p>
                </div>
                <div className="rounded-lg bg-brand-accent p-3 text-brand-accent-foreground">
                  <p className="text-xs font-medium">Brand accent</p>
                  <p className="text-xs">--brand-accent</p>
                </div>
              </div>
            </KitSection>

            <KitSection
              title="Storefront ribbons (Banner)"
              useFor="Demo-account disclosure and offline status at the top of guest pages."
              dont="Use modal dialogs for passive notices or hide the demo indicator on demo properties."
            >
              <div className="space-y-3 overflow-hidden rounded-lg border border-border">
                <DemoBanner isDemo />
                <Banner
                  variant="warning"
                  dismissible={false}
                  className="rounded-none border-x-0 border-t-0 px-4 py-2"
                >
                  <BannerIcon>
                    <WifiOffIcon className="size-4" />
                  </BannerIcon>
                  <BannerTitle>
                    You appear to be offline. Some details may be out of date.
                  </BannerTitle>
                </Banner>
              </div>
            </KitSection>

            <KitSection
              title="Action & form controls"
              useFor="Guest booking CTAs, filters, and 16 px+ inputs to prevent iOS Safari zoom."
              dont="Render sub-44 px touch targets on mobile or unlabelled icon buttons."
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button className="min-h-11">Primary CTA</Button>
                  <Button variant="secondary" className="min-h-11">
                    Secondary
                  </Button>
                  <Button variant="outline" className="min-h-11">
                    Outline
                  </Button>
                  <Button variant="ghost" className="min-h-11">
                    Ghost
                  </Button>
                  <Button variant="destructive" className="min-h-11">
                    Cancel booking
                  </Button>
                </div>
                <div className="max-w-sm space-y-1.5">
                  <label htmlFor="kit-guest-name" className="text-xs font-medium">
                    Guest full name (16 px minimum input)
                  </label>
                  <Input id="kit-guest-name" placeholder="Juan Dela Cruz" className="min-h-11" />
                </div>
              </div>
            </KitSection>

            <KitSection
              title="Placeholder & empty guest states"
              useFor="Not-found, paused owner, and empty-search states in the property's own theme."
              dont="Show raw 404 errors or expose booking actions on paused accounts."
            >
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-lg border border-border bg-background p-4">
                  <PlaceholderPageContent title="Unit details" phase={4} detail="cloud-loft" />
                  <Separator className="my-4" />
                  <Empty className="border border-dashed border-border bg-card py-6">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <MapPinOffIcon />
                      </EmptyMedia>
                      <EmptyTitle>No dates selected</EmptyTitle>
                      <EmptyDescription>Pick check-in and check-out dates first.</EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button size="sm" variant="outline" className="min-h-11 sm:min-h-9">
                        Choose dates
                      </Button>
                    </EmptyContent>
                  </Empty>
                </div>
                <div className="rounded-lg border border-border bg-background p-4">
                  <PausedPropertyContent propertyView={pausedSampleView} />
                </div>
              </div>
            </KitSection>

            <KitSection
              title="Guest reactions, status rings & brand marks (UI-1)"
              useFor="HeartToggle for saved stays, StatusLogo for open/busy/paused property rings, BrandLockup for platform branding, MessengerIcon for Messenger buttons, and theme-coloured celebration effects."
              dont="Use MessengerIcon outside Messenger buttons or fire celebrations under reduced motion."
            >
              <StorefrontKitUi1Section
                propertyName={activeLook.propertyView.property.name}
                logoSrc={activeLook.propertyView.page_media.logo?.url ?? null}
              />
            </KitSection>

            <KitSection
              title="Photo grids, comparisons & member pictures (UI-2)"
              useFor="Masonry variable-height photo galleries, before/after CompareSlider, and PersonAvatar / FacePicker with on-screen DiceBear credit (D84)."
              dont="Load DiceBear JS on first paint or omit the CC-BY-4.0 credit line where faces are picked."
            >
              <StorefrontKitUi2Section />
            </KitSection>
          </div>
        </PropertyFrame>
      </PropertyTheme>
    </div>
  );
}

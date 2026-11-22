'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Autoplay from 'embla-carousel-autoplay';
import { PauseIcon, PlayIcon } from 'lucide-react';
import { cn } from 'cn';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@smartapp/ui/components/carousel';

import { useReducedMotion } from '../hooks/use-reduced-motion';
import { cssVars } from '../lib/css-vars';
import { BANNER_SLIDE, BannerFrame, type BannerCarouselProps } from './banner-carousel';

const MIN_SECONDS = 3;
const MAX_SECONDS = 10;

function clampSeconds(seconds: number | undefined): number {
  const value = seconds ?? 5;
  return Math.min(MAX_SECONDS, Math.max(MIN_SECONDS, Math.round(value)));
}

const ARROW =
  'hidden size-10 bg-card/90 opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-base hover-hover:md:flex group-hover/banner:opacity-100 focus-visible:opacity-100';

/**
 * Lazy-loaded carousel body for 2+ promo banners (ported from the food app).
 * Timer dots fill over `--banner-delay`, autoplay pauses on hover, drag, focus and off-screen,
 * a Pause/Play toggle stops autoplay explicitly, and nothing auto-moves under reduced motion.
 */
export default function BannerCarouselSlides({
  slides,
  seconds,
  sizes = '(min-width: 1280px) 1024px, 100vw',
  labels,
  renderImage,
  className,
  show,
}: BannerCarouselProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [timerRun, setTimerRun] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const delay = clampSeconds(seconds) * 1000;
  const autoplays = !reducedMotion && !paused && !focusPaused;

  const plugins = useMemo(
    () =>
      !reducedMotion && !paused
        ? [
            Autoplay({
              delay,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: true,
            }),
          ]
        : [],
    [reducedMotion, paused, delay],
  );

  const opts = useMemo(
    () => ({ loop: true, align: 'start' as const, duration: reducedMotion ? 10 : 25 }),
    [reducedMotion],
  );

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setSelected(api.selectedScrollSnap());
      api.plugins().autoplay?.reset();
    };
    const onTimerSet = () => {
      setRunning(true);
      setTimerRun((run) => run + 1);
    };
    const onTimerStopped = () => setRunning(false);
    onSelect();
    api.on('select', onSelect);
    api.on('autoplay:timerset', onTimerSet);
    api.on('autoplay:timerstopped', onTimerStopped);
    return () => {
      api.off('select', onSelect);
      api.off('autoplay:timerset', onTimerSet);
      api.off('autoplay:timerstopped', onTimerStopped);
    };
  }, [api]);

  const showIndex = show?.index;
  const showAt = show?.at;
  useEffect(() => {
    if (api && showIndex !== undefined) api.scrollTo(showIndex);
  }, [api, showIndex, showAt]);

  useEffect(() => {
    const root = rootRef.current;
    if (!api || !root || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      const autoplay = api.plugins().autoplay;
      if (!autoplay) return;
      if (entry?.isIntersecting) autoplay.play();
      else autoplay.stop();
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [api, plugins]);

  return (
    <div
      ref={rootRef}
      data-slot="banner-carousel"
      data-paused={running && autoplays ? undefined : ''}
      style={cssVars({ '--banner-delay': `${delay}ms` })}
      className={cn('group/banner flex flex-col gap-3', className)}
      onFocusCapture={() => {
        setFocusPaused(true);
        api?.plugins().autoplay?.stop();
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          rootRef.current &&
          (!(nextTarget instanceof Node) || !rootRef.current.contains(nextTarget))
        ) {
          setFocusPaused(false);
          if (!paused && !reducedMotion) {
            api?.plugins().autoplay?.play();
          }
        }
      }}
    >
      <Carousel setApi={setApi} opts={opts} plugins={plugins} aria-label={labels.region}>
        <CarouselContent className="-ml-3">
          {slides.map((slide, index) => (
            <CarouselItem
              key={slide.id ?? `${index}-${slide.alt}`}
              data-banner-slide=""
              data-active={selected === index ? '' : undefined}
              className={BANNER_SLIDE}
              aria-label={labels.slideOf(index + 1, slides.length)}
            >
              <BannerFrame
                slide={slide}
                sizes={sizes}
                priority={index === 0}
                zoom={selected === index && autoplays}
                renderImage={renderImage}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious aria-label={labels.previous} className={cn(ARROW, 'left-3')} />
        <CarouselNext aria-label={labels.next} className={cn(ARROW, 'right-3')} />
      </Carousel>

      <div className="flex min-h-7 items-center justify-center gap-3">
        <div className="flex items-center gap-1">
          {slides.map((slide, index) => {
            const active = selected === index;
            return (
              <button
                key={`dot-${slide.id ?? index}-${slide.alt}`}
                type="button"
                aria-label={labels.showBanner(index + 1)}
                aria-current={active ? 'true' : undefined}
                onClick={() => api?.scrollTo(index)}
                className="relative flex h-6 min-w-6 items-center justify-center rounded-full outline-none after:absolute after:-inset-2.5 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    'block h-2 w-2 overflow-hidden rounded-full bg-muted-foreground/30 transition-[width,background-color] duration-base ease-enter',
                    active && 'w-6 bg-primary/25',
                  )}
                >
                  {active ? (
                    <span
                      key={`${index}-${timerRun}`}
                      className={cn(
                        'block h-full rounded-full bg-primary',
                        autoplays && 'banner-fill',
                      )}
                    />
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        {reducedMotion ? null : (
          <button
            type="button"
            aria-label={paused ? labels.play : labels.pause}
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
            className="relative flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors duration-base outline-none after:absolute after:-inset-2 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring hover-hover:hover:bg-muted hover-hover:hover:text-foreground"
          >
            {paused ? (
              <PlayIcon aria-hidden="true" className="size-3.5 fill-current" />
            ) : (
              <PauseIcon aria-hidden="true" className="size-3.5 fill-current" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

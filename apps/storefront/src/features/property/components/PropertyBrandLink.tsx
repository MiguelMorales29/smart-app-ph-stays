'use client';

import { Avatar, AvatarFallback } from '@smartapp/ui/components/avatar';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? 'P';
  const second = words[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export interface PropertyBrandLinkProps {
  readonly slug: string;
  readonly propertyName: string;
  readonly logoSrc: string | null;
}

/**
 * Logo + property name in the top bar (D79):
 * On `/<slug>`, tapping scrolls back to the top; on sub-routes, navigates home to `/<slug>`.
 */
export function PropertyBrandLink({ slug, propertyName, logoSrc }: PropertyBrandLinkProps) {
  const pathname = usePathname();
  const basePath = `/${slug}`;
  const isHome = pathname === basePath;

  return (
    <Link
      href={basePath}
      onClick={(event) => {
        if (!isHome) return;
        event.preventDefault();
        const reduced =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      }}
      className="flex min-h-11 min-w-0 items-center gap-2.5 rounded-lg font-heading text-base font-semibold tracking-tight text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3"
    >
      {logoSrc ? (
        <span
          className="relative size-9 shrink-0 overflow-hidden border border-border/60 bg-card"
          style={{ borderRadius: 'var(--logo-radius)' }}
        >
          <Image src={logoSrc} alt="" fill sizes="36px" className="object-cover" />
        </span>
      ) : (
        <Avatar className="size-9 shrink-0" style={{ borderRadius: 'var(--logo-radius)' }}>
          <AvatarFallback
            className="bg-primary text-xs font-bold text-primary-foreground"
            style={{ borderRadius: 'var(--logo-radius)' }}
          >
            {initialsOf(propertyName)}
          </AvatarFallback>
        </Avatar>
      )}
      <span className="truncate">{propertyName}</span>
    </Link>
  );
}

import type { ComponentProps } from 'react';
import { cn } from 'cn';
import { Button } from '@smartapp/ui/components/button';

const GOOGLE_YELLOW = '#FFC107'; // brand-guard-ignore: Google's required sign-in brand colour
const GOOGLE_RED = '#FF3D00'; // brand-guard-ignore: Google's required sign-in brand colour
const GOOGLE_GREEN = '#4CAF50'; // brand-guard-ignore: Google's required sign-in brand colour
const GOOGLE_BLUE = '#1976D2'; // brand-guard-ignore: Google's required sign-in brand colour

/**
 * Google's "G" mark. Its four colours are Google's own brand colours, which their sign-in
 * branding guidelines require us to keep (https://developers.google.com/identity/branding-guidelines),
 * so this one file is exempt from the token rule.
 */
function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5 shrink-0">
      <path
        fill={GOOGLE_YELLOW}
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill={GOOGLE_RED}
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill={GOOGLE_GREEN}
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill={GOOGLE_BLUE}
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

/** "Continue with Google" (D58): outline, full width, 44 px. */
export function GoogleButton({
  className,
  children = 'Continue with Google',
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      type="button"
      variant="outline"
      data-slot="google-button"
      className={cn('min-h-11 w-full gap-2.5 text-sm font-medium', className)}
      {...props}
    >
      <GoogleMark />
      {children}
    </Button>
  );
}

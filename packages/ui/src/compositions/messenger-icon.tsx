import type { SVGProps } from 'react';
import { siMessenger } from 'simple-icons';

/**
 * The Messenger brand icon from `simple-icons` (CC0), styled like a Lucide icon (`currentColor`).
 * Reserved strictly for Messenger action buttons.
 */
export function MessengerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...props}>
      <path d={siMessenger.path} />
    </svg>
  );
}

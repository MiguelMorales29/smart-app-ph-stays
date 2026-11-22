import { cn } from 'cn';

/**
 * A check mark that draws itself (`draw-check` utility; instant under reduced motion).
 * Mount fresh (with a key) to replay.
 */
export function DrawnCheckIcon({ className }: { readonly className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden="true"
      className={cn('size-4', className)}
    >
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        pathLength={1}
        className="draw-check"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

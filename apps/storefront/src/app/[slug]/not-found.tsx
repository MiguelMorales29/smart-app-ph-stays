import Link from 'next/link';
import { MapPinOff } from 'lucide-react';

import { Button } from '@smartapp/ui/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@smartapp/ui/components/empty';

export default function PropertyNotFound() {
  return (
    <main className="mx-auto flex min-h-[60dvh] w-full max-w-2xl items-center justify-center px-4 py-12">
      <Empty className="w-full border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinOff />
          </EmptyMedia>
          <EmptyTitle>Property not found</EmptyTitle>
          <EmptyDescription>
            This property is unavailable, unpublished, or the link is no longer active.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />} nativeButton={false}>
            Browse properties
          </Button>
        </EmptyContent>
      </Empty>
    </main>
  );
}

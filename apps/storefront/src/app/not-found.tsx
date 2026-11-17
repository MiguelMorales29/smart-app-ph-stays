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

import { LandingFrame } from '@/components/frames/LandingFrame';

export default function RootNotFound() {
  return (
    <LandingFrame>
      <Empty className="border border-border bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MapPinOff />
          </EmptyMedia>
          <EmptyTitle>Page not found</EmptyTitle>
          <EmptyDescription>
            This stay or page could not be found. Check the link or return to the Smart App PH home
            page.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/" />} nativeButton={false}>
            Back to home
          </Button>
        </EmptyContent>
      </Empty>
    </LandingFrame>
  );
}

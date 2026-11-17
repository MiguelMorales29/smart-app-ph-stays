import { Link } from '@tanstack/react-router';
import { MapPinOffIcon } from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { useDocumentTitle } from '@/app/page-meta';
import { DashboardSwitchGate } from '@/components/DashboardSwitchGate';
import { PreviewRibbon } from '@/components/PreviewRibbon';

export function NotFoundPage() {
  useDocumentTitle('Page not found');

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <DashboardSwitchGate />
      <PreviewRibbon />
      <main className="mx-auto flex min-h-[70dvh] max-w-xl items-center px-4 py-12">
        <EmptyState
          icon={<MapPinOffIcon />}
          title="Page not found"
          description="This dashboard or admin route does not exist or is not enabled in this environment."
          action={
            <Button
              className="min-h-11 sm:min-h-9"
              nativeButton={false}
              render={<Link to="/home" />}
            >
              Back to dashboard
            </Button>
          }
        />
      </main>
    </div>
  );
}

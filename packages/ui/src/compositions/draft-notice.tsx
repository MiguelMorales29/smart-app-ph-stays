import { HistoryIcon } from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';

/** "We kept the changes you didn't save." Shown when useFormDraft finds a draft. */
export function DraftNotice({
  onKeep,
  onDiscard,
}: {
  readonly onKeep: () => void;
  readonly onDiscard: () => void;
}) {
  return (
    <Alert data-slot="draft-notice" className="bg-info-tint">
      <HistoryIcon aria-hidden="true" className="text-info" />
      <AlertTitle>We kept the changes you didn't save</AlertTitle>
      <AlertDescription>
        Pick up where you left off, or start over from what's saved.
      </AlertDescription>
      <AlertAction className="flex gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onDiscard}>
          Start over
        </Button>
        <Button type="button" size="sm" onClick={onKeep}>
          Keep them
        </Button>
      </AlertAction>
    </Alert>
  );
}

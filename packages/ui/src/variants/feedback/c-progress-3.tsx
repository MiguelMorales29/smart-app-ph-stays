import { Progress, ProgressLabel, ProgressValue } from '@smartapp/ui/components/progress';

export function Pattern() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Progress value={70} className="**:data-[slot=progress-track]:h-3">
        <ProgressLabel>Large progress</ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  );
}

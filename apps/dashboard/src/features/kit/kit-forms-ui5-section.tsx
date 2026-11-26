import { useState } from 'react';
import { EmojiPicker, EmojiPickerPanel } from '@smartapp/ui/components/reui/emoji-picker';
import {
  SignaturePad,
  SignaturePadArea,
  SignaturePadClear,
  SignaturePadControls,
  SignaturePadPlaceholder,
  SignaturePadPreview,
  SignaturePadSave,
  type SignaturePadStroke,
} from '@smartapp/ui/components/reui/signature-pad';

import { DualSurfaceShowcase } from './kit-base-tab';

function EmojiDemo() {
  const [picked, setPicked] = useState('🏝️');
  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">
        Amenity group icon: <span className="text-xl">{picked}</span>
      </p>
      <div className="rounded-xl border border-border bg-card p-2">
        <EmojiPicker onEmojiSelect={(selection) => setPicked(selection.value)}>
          <EmojiPickerPanel className="h-80 w-full" />
        </EmojiPicker>
      </div>
    </div>
  );
}

function SignatureDemo() {
  const [saved, setSaved] = useState<SignaturePadStroke[]>([]);
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Tenant signs the monthly rental agreement</p>
      <SignaturePad>
        <SignaturePadArea variant="muted" className="h-44">
          <SignaturePadPlaceholder>Sign here</SignaturePadPlaceholder>
          <SignaturePadControls position="bottom-end">
            <SignaturePadClear />
            <SignaturePadSave format="json" onSave={(_, strokes) => setSaved(strokes)} />
          </SignaturePadControls>
        </SignaturePadArea>
      </SignaturePad>
      <div role="status" className="min-h-8">
        {saved.length > 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            Signature saved
            <SignaturePadPreview strokes={saved} className="h-8 w-auto" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** UI-5 form inputs: emoji icons for owner-made groups and tenant signatures. */
export function KitFormsUi5Section() {
  return (
    <div className="space-y-6">
      <DualSurfaceShowcase
        title="EmojiPicker"
        source="ReUI · via food app · data self-hosted at /emojibase/17.0.0 (UI-5)"
        useFor="An icon for custom amenity groups and unit categories the owner creates."
        dont="Fetch emoji data from a CDN; the files ship in public/ (pnpm --filter @smartapp/tooling emojibase)."
        render={() => <EmojiDemo />}
      />
      <DualSurfaceShowcase
        title="SignaturePad"
        source="ReUI · offline install (UI-5)"
        useFor="Tenant or guest signature on a rental agreement or house-rules acknowledgement."
        dont="Treat a drawn signature as identity proof; it records agreement only."
        render={() => <SignatureDemo />}
      />
    </div>
  );
}

import { useState } from 'react';
import { Button } from '@smartapp/ui/components/button';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@smartapp/ui/components/responsive-dialog';
import { Field, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { GoogleButton } from '@smartapp/ui/compositions/google-button';

/** The demo owner the sample data knows (signs straight in). */
const DEMO_OWNER = { email: 'owner.ulap-suites@demo.invalid', name: 'Ulap Suites owner' };

/**
 * Sample data only: stands in for Google's account chooser until real sign-in (Phase 11). It
 * returns the demo credential the memory data layer understands (`demo-google:<email>:<name>`).
 */
export function DemoGoogleButton({
  onCredential,
  disabled,
  label,
}: {
  readonly onCredential: (credential: string) => void;
  readonly disabled?: boolean | undefined;
  readonly label?: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('maria.santos@gmail.com');
  const [name, setName] = useState('Maria Santos');

  function choose(chosenEmail: string, chosenName: string) {
    setOpen(false);
    onCredential(`demo-google:${chosenEmail.trim().toLowerCase()}:${chosenName.trim()}`);
  }

  return (
    <>
      <GoogleButton disabled={disabled} onClick={() => setOpen(true)}>
        {label ?? 'Continue with Google'}
      </GoogleButton>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Choose a Google account</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Sample data: this stands in for Google until real sign-in is switched on.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="flex flex-col gap-4">
            <Button
              variant="outline"
              className="min-h-11 justify-start"
              onClick={() => choose(DEMO_OWNER.email, DEMO_OWNER.name)}
            >
              {DEMO_OWNER.email} (has an account)
            </Button>
            <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Someone new</p>
              <Field>
                <FieldLabel htmlFor="demo-google-name">Name</FieldLabel>
                <Input
                  id="demo-google-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="demo-google-email">Gmail address</FieldLabel>
                <Input
                  id="demo-google-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>
            </div>
          </div>
          <ResponsiveDialogFooter>
            <Button
              className="min-h-11"
              disabled={!email.includes('@') || !name.trim()}
              onClick={() => choose(email, name)}
            >
              Continue as {name.trim() || 'this person'}
            </Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}

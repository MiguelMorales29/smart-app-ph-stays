import { useState } from 'react';
import { KeyRoundIcon, LogOutIcon, Trash2Icon } from 'lucide-react';
import { changePasswordFormSchema, type OwnerAccountView } from '@smartapp/core';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { Textarea } from '@smartapp/ui/components/textarea';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { RowButton, RowGroup } from '@smartapp/ui/compositions/grouped-rows';
import {
  AvatarSeedPicker,
  OwnerAvatar,
  type OwnerAvatarValue,
} from '@smartapp/ui/compositions/owner-avatar';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { SaveBar } from '@smartapp/ui/compositions/save-bar';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { notify } from '@smartapp/ui/lib/notify';
import { THEME_MODES, useTheme, type ThemeMode } from '@/app/theme';
import { useRequestPasswordCodeMutation } from '@/data/auth/writes';
import { useProfileQuery } from '@/data/settings/reads';
import {
  useChangePasswordMutation,
  useRequestAccountDeletionMutation,
  useSignOutEverywhereMutation,
  useUpdateProfileMutation,
} from '@/data/settings/writes';
import { extractAppError } from '@/data/shared';
import { SettingsPane } from './settings-nav';
import { SettingsError, SettingsSkeleton, useOfflineSave, useSaveState } from './settings-shared';

const THEME_LABEL: Record<ThemeMode, string> = { light: 'Light', dark: 'Dark', system: 'System' };

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });

/** /settings/account (OW-25): picture, name, look, password, sessions and deletion. */
export function AccountSettingsPage() {
  const profile = useProfileQuery();
  return (
    <SettingsPane title="Account">
      {profile.isPending ? (
        <SettingsSkeleton />
      ) : profile.isError ? (
        <SettingsError error={profile.error} onRetry={() => void profile.refetch()} />
      ) : (
        <AccountForm key={profile.data.profile.id} view={profile.data} />
      )}
    </SettingsPane>
  );
}

function AccountForm({ view }: { readonly view: OwnerAccountView }) {
  const update = useUpdateProfileMutation();
  const [state, setState] = useSaveState();
  const { offline, message } = useOfflineSave();
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState({
    name: view.profile.full_name,
    avatar: view.profile.avatar,
  });
  const [name, setName] = useState(saved.name);
  const [avatar, setAvatar] = useState<OwnerAvatarValue | null>(saved.avatar);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'picture' | 'password' | 'signout' | 'delete' | null>(null);
  const dirty = name !== saved.name || JSON.stringify(avatar) !== JSON.stringify(saved.avatar);
  const email = view.account.contact_email;
  const deletion = view.deletion_request;

  async function onSave() {
    if (!name.trim()) {
      setNameError('Enter your name.');
      return;
    }
    setNameError(null);
    setState('busy');
    try {
      await update.mutateAsync({
        expectedUpdatedAt: view.profile.updated_at,
        fullName: name.trim(),
        avatar,
        notifyEmail: view.account.notify_email,
        notify: view.member.notify,
      });
      setSaved({ name: name.trim(), avatar });
      setState('done');
    } catch (caught) {
      setState('idle');
      setNameError(extractAppError(caught).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <OwnerAvatar name={name || 'You'} avatar={avatar} size="lg" className="size-16" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-lg font-semibold">{name || 'Your name'}</p>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </div>
        <Button variant="outline" className="min-h-11" onClick={() => setSheet('picture')}>
          Change picture
        </Button>
      </div>

      <Field data-invalid={nameError ? true : undefined}>
        <FieldLabel htmlFor="acct-name">Your name</FieldLabel>
        <Input
          id="acct-name"
          autoComplete="name"
          value={name}
          maxLength={120}
          aria-invalid={nameError ? true : undefined}
          onChange={(event) => setName(event.target.value)}
        />
        <FieldDescription>Guests see it on messages and receipts.</FieldDescription>
        <FieldError>{nameError ?? undefined}</FieldError>
      </Field>

      <section aria-labelledby="acct-look" className="flex flex-col gap-1.5">
        <h2 id="acct-look" className="px-1 text-sm font-medium text-muted-foreground">
          Appearance
        </h2>
        <SegmentedControl
          aria-labelledby="acct-look"
          value={theme}
          onValueChange={setTheme}
          options={THEME_MODES.map((mode) => ({ value: mode, label: THEME_LABEL[mode] }))}
        />
        <p className="px-1 text-sm text-muted-foreground">Saved on this device.</p>
      </section>

      <RowGroup title="Sign-in">
        <RowButton
          label="Change password"
          hint="We email you a code first"
          icon={<KeyRoundIcon />}
          onClick={() => setSheet('password')}
        />
        <RowButton
          label="Sign out everywhere"
          hint="Other phones and computers sign out. This one stays."
          icon={<LogOutIcon />}
          onClick={() => setSheet('signout')}
        />
      </RowGroup>

      <RowGroup
        title="Delete account"
        footer={
          deletion.status === 'scheduled' && deletion.scheduled_for
            ? `We delete your account on ${longDate(deletion.scheduled_for)}. You can cancel until then.`
            : 'We wait 7 days before deleting, and you can cancel in that time.'
        }
      >
        <RowButton
          label={
            <span className="text-destructive">
              {deletion.status === 'scheduled' ? 'Cancel deletion' : 'Ask to delete account'}
            </span>
          }
          icon={<Trash2Icon className="text-destructive" />}
          onClick={() => setSheet('delete')}
        />
      </RowGroup>

      <AppSheet
        open={sheet === 'picture'}
        onOpenChange={(open) => !open && setSheet(null)}
        size="md"
        title="Pick a picture"
        description="Or keep your initials."
        footer={
          <Button className="min-h-11" onClick={() => setSheet(null)}>
            Done
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <AvatarSeedPicker
            value={avatar?.kind === 'preset' ? avatar.preset_id : null}
            onValueChange={(presetId) => setAvatar({ kind: 'preset', preset_id: presetId })}
          />
          <Button variant="outline" className="min-h-11 self-start" onClick={() => setAvatar(null)}>
            Use my initials
          </Button>
        </div>
      </AppSheet>
      <PasswordSheet email={email} open={sheet === 'password'} onClose={() => setSheet(null)} />
      <SignOutSheet open={sheet === 'signout'} onClose={() => setSheet(null)} />
      <DeleteSheet
        scheduled={deletion.status === 'scheduled'}
        open={sheet === 'delete'}
        onClose={() => setSheet(null)}
      />

      <SaveBar
        dirty={dirty}
        state={state}
        canSave={!offline}
        message={message}
        onSave={() => void onSave()}
        onDiscard={() => {
          setName(saved.name);
          setAvatar(saved.avatar);
          setNameError(null);
          notify.info('Changes discarded');
        }}
      />
    </div>
  );
}

function PasswordSheet({
  email,
  open,
  onClose,
}: {
  readonly email: string;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const requestCode = useRequestPasswordCodeMutation();
  const change = useChangePasswordMutation();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function reset() {
    setSent(false);
    setCode('');
    setPassword('');
    setConfirm('');
    setErrors({});
  }

  async function submit() {
    if (!sent) {
      try {
        await requestCode.mutateAsync({ email });
        setSent(true);
      } catch (caught) {
        setErrors({ form: extractAppError(caught).message });
      }
      return;
    }
    const parsed = changePasswordFormSchema.safeParse({
      code,
      newPassword: password,
      confirmPassword: confirm,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    try {
      await change.mutateAsync({ code, newPassword: password });
      notify.success('Password changed');
      reset();
      onClose();
    } catch (caught) {
      setErrors({ form: extractAppError(caught).message });
    }
  }

  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          reset();
          onClose();
        }
      }}
      height="full"
      size="sm"
      title="Change password"
      description={
        sent ? `We sent a 6-digit code to ${email}.` : `We'll email a 6-digit code to ${email}.`
      }
      footer={
        <AsyncButton
          className="min-h-11"
          state={requestCode.isPending || change.isPending ? 'busy' : 'idle'}
          onClick={() => void submit()}
        >
          {sent ? 'Change password' : 'Send code'}
        </AsyncButton>
      }
    >
      {sent ? (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {errors.form ? (
            <Alert variant="destructive">
              <AlertDescription>{errors.form}</AlertDescription>
            </Alert>
          ) : null}
          <Field data-invalid={errors.code ? true : undefined}>
            <FieldLabel htmlFor="pw-code">Code</FieldLabel>
            <Input
              id="pw-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            />
            <FieldError>{errors.code}</FieldError>
          </Field>
          <Field data-invalid={errors.newPassword ? true : undefined}>
            <FieldLabel htmlFor="pw-new">New password</FieldLabel>
            <PasswordInput
              id="pw-new"
              autoComplete="new-password"
              value={password}
              invalid={errors.newPassword !== undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldError>{errors.newPassword}</FieldError>
          </Field>
          <Field data-invalid={errors.confirmPassword ? true : undefined}>
            <FieldLabel htmlFor="pw-confirm">Type it again</FieldLabel>
            <PasswordInput
              id="pw-confirm"
              autoComplete="new-password"
              value={confirm}
              invalid={errors.confirmPassword !== undefined}
              onChange={(event) => setConfirm(event.target.value)}
            />
            <FieldError>{errors.confirmPassword}</FieldError>
          </Field>
        </form>
      ) : errors.form ? (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      ) : null}
    </AppSheet>
  );
}

function SignOutSheet({ open, onClose }: { readonly open: boolean; readonly onClose: () => void }) {
  const signOut = useSignOutEverywhereMutation();
  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      size="sm"
      title="Sign out everywhere?"
      description="Every other phone and computer signs out. You stay signed in here."
      footer={
        <>
          <Button data-sheet-cancel="" variant="outline" className="min-h-11" onClick={onClose}>
            Cancel
          </Button>
          <AsyncButton
            className="min-h-11"
            state={signOut.isPending ? 'busy' : 'idle'}
            onClick={() =>
              void signOut
                .mutateAsync({})
                .then(() => {
                  notify.success('Signed out everywhere else');
                  onClose();
                })
                .catch((caught: unknown) => notify.error(extractAppError(caught).message))
            }
          >
            Sign out everywhere
          </AsyncButton>
        </>
      }
    >
      {null}
    </AppSheet>
  );
}

function DeleteSheet({
  scheduled,
  open,
  onClose,
}: {
  readonly scheduled: boolean;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const request = useRequestAccountDeletionMutation();
  const [reason, setReason] = useState('');
  async function submit() {
    try {
      await request.mutateAsync({
        action: scheduled ? 'cancel' : 'request',
        reason: scheduled || !reason.trim() ? null : reason.trim(),
      });
      notify.success(scheduled ? 'Deletion cancelled' : 'Deletion requested');
      setReason('');
      onClose();
    } catch (caught) {
      notify.error(extractAppError(caught).message);
    }
  }
  return (
    <AppSheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      size="sm"
      title={scheduled ? 'Cancel deletion?' : 'Delete your account?'}
      description={
        scheduled
          ? 'Your account, page and bookings stay as they are.'
          : 'In 7 days we delete your page, units, photos and bookings. Until then you can cancel here.'
      }
      footer={
        <>
          <Button data-sheet-cancel="" variant="outline" className="min-h-11" onClick={onClose}>
            Keep my account
          </Button>
          <AsyncButton
            variant={scheduled ? 'default' : 'destructive'}
            className="min-h-11"
            state={request.isPending ? 'busy' : 'idle'}
            onClick={() => void submit()}
          >
            {scheduled ? 'Cancel deletion' : 'Ask to delete account'}
          </AsyncButton>
        </>
      }
    >
      {scheduled ? null : (
        <Field>
          <FieldLabel htmlFor="delete-reason">Why are you leaving? (optional)</FieldLabel>
          <Textarea
            id="delete-reason"
            rows={3}
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      )}
    </AppSheet>
  );
}

import { useRef, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ImagePlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  QrCodeIcon,
} from 'lucide-react';
import {
  BANKS,
  formatPhMobile,
  isValidBankAccount,
  isValidPhMobile,
  normalizeBankAccount,
  normalizePhMobile,
  readErrorDetails,
  words,
  type Bank,
  type PaymentAccountMethod,
  type PaymentAccountsRow,
} from '@smartapp/core';
import { compressImage } from '@smartapp/data/compress-image';
import { Alert, AlertDescription } from '@smartapp/ui/components/alert';
import { Button } from '@smartapp/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Input } from '@smartapp/ui/components/input';
import { NativeSelect, NativeSelectOption } from '@smartapp/ui/components/native-select';
import { Switch } from '@smartapp/ui/components/switch';
import { Textarea } from '@smartapp/ui/components/textarea';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { AsyncButton } from '@smartapp/ui/compositions/async-button';
import { EmptyState } from '@smartapp/ui/compositions/empty-state';
import { MilestonePicture } from '@smartapp/ui/compositions/milestone-picture';
import { PasswordInput } from '@smartapp/ui/compositions/password-input';
import { PhoneInput } from '@smartapp/ui/compositions/phone-input';
import { SegmentedControl } from '@smartapp/ui/compositions/segmented-control';
import { useLastDefined } from '@smartapp/ui/hooks/use-last-defined';
import { notify } from '@smartapp/ui/lib/notify';
import { usePaymentAccountsQuery } from '@/data/payments/reads';
import {
  useReorderPaymentAccountsMutation,
  useSavePaymentAccountMutation,
  useSetPaymentAccountActiveMutation,
} from '@/data/payments/writes';
import { useUploadPhotoMutation } from '@/data/photos/upload';
import { extractAppError } from '@/data/shared';
import { useMyAccountQuery } from '@/data/auth/reads';
import { SettingsPane } from './settings-nav';
import { SettingsError, SettingsSkeleton, useOfflineSave } from './settings-shared';

const METHOD_LABEL: Record<PaymentAccountMethod, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  bank: 'Bank',
  qr_ph: 'QR Ph',
};

function accountTitle(account: PaymentAccountsRow): string {
  if (account.method === 'bank') {
    return account.bank === 'other' || account.bank === null
      ? (account.bank_name ?? 'Bank')
      : words.banks[account.bank];
  }
  return METHOD_LABEL[account.method];
}

function maskedNumber(account: PaymentAccountsRow): string {
  if (account.method === 'gcash' || account.method === 'maya') {
    return formatPhMobile(account.account_number);
  }
  const digits = account.account_number;
  return digits.length > 4 ? `•••• ${digits.slice(-4)}` : digits;
}

/** Turns the contract's reasons into owner words. */
function paymentError(caught: unknown): { field: 'password' | 'form'; message: string } {
  const error = extractAppError(caught);
  const reason = readErrorDetails(error).reason;
  if (reason === 'wrong_password') return { field: 'password', message: 'That password is wrong.' };
  if (reason === 'last_payment_method') {
    return { field: 'form', message: 'Keep at least one way to pay on, so guests can pay you.' };
  }
  if (reason === 'bank_limit') {
    return { field: 'form', message: 'You can add up to 3 bank accounts.' };
  }
  return { field: 'form', message: error.message };
}

/** /settings/payments (OW-12): where guests send money, in the order they see it. */
export function PaymentsSettingsPage() {
  const accounts = usePaymentAccountsQuery();
  const [editing, setEditing] = useState<PaymentAccountsRow | 'new' | null>(null);
  const [toggling, setToggling] = useState<PaymentAccountsRow | null>(null);
  const reorder = useReorderPaymentAccountsMutation();
  const list = [...(accounts.data ?? [])].sort((a, b) => a.sort_order - b.sort_order);

  function move(index: number, by: -1 | 1) {
    const ids = list.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    if (!moved) return;
    ids.splice(index + by, 0, moved);
    void reorder
      .mutateAsync({ paymentAccountIds: ids })
      .catch((caught: unknown) => notify.error(extractAppError(caught).message));
  }

  return (
    <SettingsPane title="Payments">
      {accounts.isPending ? (
        <SettingsSkeleton />
      ) : accounts.isError ? (
        <SettingsError error={accounts.error} onRetry={() => void accounts.refetch()} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<MilestonePicture art="no_payment_accounts" size="sm" />}
          title="No way to pay yet"
          description="Guests can't pay until you add one."
          action={
            <Button className="min-h-11" onClick={() => setEditing('new')}>
              <PlusIcon aria-hidden="true" />
              Add a way to pay
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <section aria-labelledby="pay-list" className="flex flex-col gap-1.5">
            <h2 id="pay-list" className="px-1 text-sm font-medium text-muted-foreground">
              Ways to pay
            </h2>
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {list.map((account, index) => (
                <li key={account.id} className="flex min-h-16 items-center gap-3 px-4 py-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {account.method === 'qr_ph' ? (
                      <QrCodeIcon aria-hidden="true" className="size-5" />
                    ) : (
                      accountTitle(account).slice(0, 2)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {accountTitle(account)} · {account.account_name}
                    </span>
                    <span className="block text-sm text-muted-foreground tabular">
                      {maskedNumber(account)}
                      {account.is_active ? '' : ' · Off'}
                    </span>
                  </span>
                  <Switch
                    aria-label={`Show ${accountTitle(account)} to guests`}
                    checked={account.is_active}
                    onCheckedChange={() => setToggling(account)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-11 pointer-fine:size-9"
                          aria-label={`More for ${accountTitle(account)}`}
                        />
                      }
                    >
                      <MoreHorizontalIcon aria-hidden="true" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(account)}>
                        <PencilIcon aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled={index === 0} onClick={() => move(index, -1)}>
                        <ArrowUpIcon aria-hidden="true" />
                        Move up
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={index === list.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownIcon aria-hidden="true" />
                        Move down
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
            <p className="px-1 text-sm text-muted-foreground">Guests see them in this order.</p>
          </section>
          <Button
            variant="outline"
            className="min-h-11 self-start"
            onClick={() => setEditing('new')}
          >
            <PlusIcon aria-hidden="true" />
            Add a way to pay
          </Button>
        </div>
      )}

      <AccountSheet editing={editing} onClose={() => setEditing(null)} />
      <ToggleSheet account={toggling} onClose={() => setToggling(null)} />
    </SettingsPane>
  );
}

/** Turning a way to pay on or off asks for the password again. */
function ToggleSheet({
  account,
  onClose,
}: {
  readonly account: PaymentAccountsRow | null;
  readonly onClose: () => void;
}) {
  const toggle = useSetPaymentAccountActiveMutation();
  const shown = useLastDefined(account);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<{ field: 'password' | 'form'; message: string } | null>(null);
  const turningOn = shown ? !shown.is_active : false;

  async function submit() {
    if (!shown) return;
    if (!password) {
      setError({ field: 'password', message: 'Enter your password.' });
      return;
    }
    try {
      await toggle.mutateAsync({
        paymentAccountId: shown.id,
        isActive: !shown.is_active,
        password,
        expectedUpdatedAt: shown.updated_at,
      });
      notify.success(turningOn ? 'Shown to guests' : 'Hidden from guests');
      setPassword('');
      setError(null);
      onClose();
    } catch (caught) {
      setError(paymentError(caught));
    }
  }

  return (
    <AppSheet
      open={account !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPassword('');
          setError(null);
          onClose();
        }
      }}
      size="sm"
      title={shown ? `${turningOn ? 'Turn on' : 'Turn off'} ${accountTitle(shown)}?` : ''}
      description="Enter your password so nobody else can change where guests pay."
      footer={
        <>
          <Button data-sheet-cancel="" variant="outline" className="min-h-11" onClick={onClose}>
            Cancel
          </Button>
          <AsyncButton
            className="min-h-11"
            state={toggle.isPending ? 'busy' : 'idle'}
            onClick={() => void submit()}
          >
            {turningOn ? 'Turn on' : 'Turn off'}
          </AsyncButton>
        </>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        {error?.field === 'form' ? (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}
        <Field data-invalid={error?.field === 'password' ? true : undefined}>
          <FieldLabel htmlFor="toggle-password">Your password</FieldLabel>
          <PasswordInput
            id="toggle-password"
            autoComplete="current-password"
            value={password}
            invalid={error?.field === 'password'}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError>{error?.field === 'password' ? error.message : undefined}</FieldError>
        </Field>
      </form>
    </AppSheet>
  );
}

interface AccountDraft {
  readonly method: PaymentAccountMethod;
  readonly accountName: string;
  readonly mobile: string;
  readonly bank: Bank;
  readonly bankName: string;
  readonly bankNumber: string;
  readonly qrFileId: string | null;
  readonly instructions: string;
}

function draftFrom(account: PaymentAccountsRow | null, ownerName: string): AccountDraft {
  return {
    method: account?.method ?? 'gcash',
    accountName: account?.account_name ?? ownerName,
    mobile: account && account.method !== 'bank' ? account.account_number : '',
    bank: account?.bank ?? 'bdo',
    bankName: account?.bank_name ?? '',
    bankNumber: account?.method === 'bank' ? account.account_number : '',
    qrFileId: account?.qr_file_id ?? null,
    instructions: account?.instructions ?? '',
  };
}

/** Add or edit a way to pay, with "What guests see" and the password at the end. */
function AccountSheet({
  editing,
  onClose,
}: {
  readonly editing: PaymentAccountsRow | 'new' | null;
  readonly onClose: () => void;
}) {
  const shown = useLastDefined(editing);
  const current = shown === 'new' || shown === null || shown === undefined ? null : shown;
  const formId = 'payment-account-form';
  return (
    <AppSheet
      open={editing !== null}
      onOpenChange={(open) => !open && onClose()}
      height="full"
      title={current ? `Edit ${accountTitle(current)}` : 'Add a way to pay'}
      description={
        current
          ? 'Guests with open bookings will see that you changed this.'
          : 'Guests send money here directly. You check each payment.'
      }
      footer={
        <>
          <Button data-sheet-cancel="" variant="outline" className="min-h-11" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form={formId} className="min-h-11">
            {current ? 'Save changes' : 'Add'}
          </Button>
        </>
      }
    >
      {shown === null || shown === undefined ? null : (
        <AccountForm
          key={current?.id ?? 'new'}
          formId={formId}
          account={current}
          onDone={onClose}
        />
      )}
    </AppSheet>
  );
}

function AccountForm({
  formId,
  account,
  onDone,
}: {
  readonly formId: string;
  readonly account: PaymentAccountsRow | null;
  readonly onDone: () => void;
}) {
  const save = useSavePaymentAccountMutation();
  const upload = useUploadPhotoMutation();
  const me = useMyAccountQuery();
  const { offline } = useOfflineSave();
  const [draft, setDraft] = useState(() => draftFrom(account, me.data?.profile.full_name ?? ''));
  const [password, setPassword] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (change: Partial<AccountDraft>) => setDraft((value) => ({ ...value, ...change }));
  const wallet = draft.method === 'gcash' || draft.method === 'maya';
  const methodWord =
    draft.method === 'bank' ? 'bank' : draft.method === 'qr_ph' ? 'QR' : METHOD_LABEL[draft.method];

  async function onQr(file: File) {
    try {
      const shrunk = await compressImage(file, { maxSide: 1200, quality: 0.9 });
      setQrPreview(URL.createObjectURL(shrunk.blob));
      const uploaded = await upload.mutateAsync({
        file: shrunk.blob,
        filename: file.name,
        purpose: 'payment_qr',
        width: shrunk.width,
        height: shrunk.height,
      });
      set({ qrFileId: uploaded.fileId });
    } catch (caught) {
      setErrors({ qr: extractAppError(caught).message });
    }
  }

  async function submit() {
    const next: Record<string, string> = {};
    if (!draft.accountName.trim())
      next.accountName = 'Type the name exactly as the account shows it.';
    const number =
      draft.method === 'bank'
        ? normalizeBankAccount(draft.bankNumber)
        : wallet
          ? normalizePhMobile(draft.mobile)
          : draft.mobile.trim() || 'QR Ph';
    if (draft.method === 'bank' && !isValidBankAccount(draft.bankNumber)) {
      next.accountNumber = 'Enter 8 to 20 digits.';
    }
    if (wallet && !isValidPhMobile(draft.mobile)) {
      next.accountNumber = 'Enter the mobile number of this account, like 0917 123 4567.';
    }
    if (draft.method === 'bank' && draft.bank === 'other' && !draft.bankName.trim()) {
      next.bankName = 'Enter the bank name.';
    }
    if (draft.method === 'qr_ph' && draft.qrFileId === null) next.qr = 'Add the QR code picture.';
    if (!password) next.password = 'Enter your password to confirm this change.';
    if (offline) next.form = "You're offline. Changes save when you're back.";
    setErrors(next);
    if (Object.keys(next).length > 0 || number === null) return;
    try {
      await save.mutateAsync({
        paymentAccountId: account?.id ?? null,
        expectedUpdatedAt: account?.updated_at ?? null,
        password,
        method: draft.method,
        bank: draft.method === 'bank' ? draft.bank : null,
        bankName: draft.method === 'bank' && draft.bank === 'other' ? draft.bankName.trim() : null,
        accountName: draft.accountName.trim(),
        accountNumber: number,
        qrFileId: draft.qrFileId,
        instructions: draft.instructions.trim() ? draft.instructions.trim() : null,
        isActive: account?.is_active ?? true,
      });
      notify.success(account ? 'Changes saved' : 'Way to pay added');
      onDone();
    } catch (caught) {
      const problem = paymentError(caught);
      setErrors({ [problem.field]: problem.message });
    }
  }

  return (
    <form
      id={formId}
      noValidate
      className="flex flex-col gap-5"
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
      {account ? null : (
        <SegmentedControl
          aria-label="Type"
          value={draft.method}
          onValueChange={(method) => set({ method })}
          options={(['gcash', 'maya', 'bank', 'qr_ph'] as const).map((method) => ({
            value: method,
            label: METHOD_LABEL[method],
          }))}
        />
      )}
      <Field data-invalid={errors.accountName ? true : undefined}>
        <FieldLabel htmlFor="pay-name">Account name</FieldLabel>
        <Input
          id="pay-name"
          value={draft.accountName}
          maxLength={120}
          aria-invalid={errors.accountName ? true : undefined}
          onChange={(event) => set({ accountName: event.target.value })}
        />
        <FieldDescription>Type it exactly as your {methodWord} shows it.</FieldDescription>
        <FieldError>{errors.accountName}</FieldError>
      </Field>

      {draft.method === 'bank' ? (
        <>
          <Field>
            <FieldLabel htmlFor="pay-bank">Bank</FieldLabel>
            <NativeSelect
              id="pay-bank"
              className="w-full"
              value={draft.bank}
              onChange={(event) => {
                const next = BANKS.find((item) => item === event.target.value);
                if (next) set({ bank: next });
              }}
            >
              {BANKS.map((item) => (
                <NativeSelectOption key={item} value={item}>
                  {words.banks[item]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          {draft.bank === 'other' ? (
            <Field data-invalid={errors.bankName ? true : undefined}>
              <FieldLabel htmlFor="pay-bank-name">Bank name</FieldLabel>
              <Input
                id="pay-bank-name"
                value={draft.bankName}
                maxLength={80}
                onChange={(event) => set({ bankName: event.target.value })}
              />
              <FieldError>{errors.bankName}</FieldError>
            </Field>
          ) : null}
          <Field data-invalid={errors.accountNumber ? true : undefined}>
            <FieldLabel htmlFor="pay-bank-number">Account number</FieldLabel>
            <Input
              id="pay-bank-number"
              inputMode="numeric"
              value={draft.bankNumber}
              aria-invalid={errors.accountNumber ? true : undefined}
              onChange={(event) => set({ bankNumber: event.target.value })}
            />
            <FieldError>{errors.accountNumber}</FieldError>
          </Field>
        </>
      ) : wallet ? (
        <Field data-invalid={errors.accountNumber ? true : undefined}>
          <FieldLabel htmlFor="pay-mobile">{METHOD_LABEL[draft.method]} number</FieldLabel>
          <PhoneInput
            id="pay-mobile"
            value={draft.mobile}
            onValueChange={(mobile) => set({ mobile })}
            invalid={errors.accountNumber !== undefined}
          />
          <FieldError>{errors.accountNumber}</FieldError>
        </Field>
      ) : null}

      <Field data-invalid={errors.qr ? true : undefined}>
        <FieldLabel htmlFor="pay-qr">
          QR code{draft.method === 'qr_ph' ? '' : ' (optional)'}
        </FieldLabel>
        <input
          ref={fileRef}
          id="pay-qr"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void onQr(file);
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="press grid aspect-square w-40 place-items-center overflow-hidden rounded-2xl border border-dashed border-input bg-card text-sm font-medium text-muted-foreground outline-none hover-hover:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {qrPreview ? (
            <img src={qrPreview} alt="Your QR code" className="size-full object-cover" />
          ) : draft.qrFileId ? (
            <span className="flex flex-col items-center gap-1">
              <QrCodeIcon aria-hidden="true" className="size-6" />
              QR added · Replace
            </span>
          ) : (
            <span className="flex flex-col items-center gap-1">
              <ImagePlusIcon aria-hidden="true" className="size-6" />
              {upload.isPending ? 'Uploading…' : 'Add QR picture'}
            </span>
          )}
        </button>
        <FieldError>{errors.qr}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="pay-instructions">Note for guests (optional)</FieldLabel>
        <Textarea
          id="pay-instructions"
          rows={2}
          maxLength={300}
          placeholder="e.g. Send a screenshot after paying"
          value={draft.instructions}
          onChange={(event) => set({ instructions: event.target.value })}
        />
      </Field>

      <section aria-labelledby="pay-preview" className="flex flex-col gap-1.5">
        <h3 id="pay-preview" className="px-1 text-sm font-medium text-muted-foreground">
          What guests see
        </h3>
        <div className="rounded-2xl border border-border bg-muted p-4 text-sm">
          <p className="font-semibold">
            {draft.method === 'bank'
              ? draft.bank === 'other'
                ? draft.bankName || 'Bank'
                : words.banks[draft.bank]
              : METHOD_LABEL[draft.method]}
          </p>
          <p>{draft.accountName || 'Account name'}</p>
          <p className="tabular">
            {draft.method === 'bank'
              ? draft.bankNumber || 'Account number'
              : wallet
                ? draft.mobile
                  ? formatPhMobile(draft.mobile)
                  : '0917 123 4567'
                : 'Scan the QR code'}
          </p>
          {draft.instructions.trim() ? (
            <p className="mt-2 text-muted-foreground">{draft.instructions.trim()}</p>
          ) : null}
        </div>
      </section>

      <Field data-invalid={errors.password ? true : undefined}>
        <FieldLabel htmlFor="pay-password">Your password</FieldLabel>
        <PasswordInput
          id="pay-password"
          autoComplete="current-password"
          value={password}
          invalid={errors.password !== undefined}
          onChange={(event) => setPassword(event.target.value)}
        />
        <FieldDescription>
          We ask for it whenever payment details change, so nobody else can change where guests pay.
        </FieldDescription>
        <FieldError>{errors.password}</FieldError>
      </Field>
    </form>
  );
}

import { useId, useState, type ComponentProps, type ReactNode } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@smartapp/ui/components/input-group';

export interface PasswordInputProps extends Omit<ComponentProps<'input'>, 'type' | 'autoComplete'> {
  /** current-password on sign-in, new-password on sign-up and resets. */
  readonly autoComplete: 'current-password' | 'new-password';
  /** Optional line under the field, such as the password rules. */
  readonly rules?: ReactNode;
  readonly invalid?: boolean | undefined;
}

/** Password field with a show/hide eye button and an optional rules line (D58, F20). */
export function PasswordInput({ autoComplete, rules, invalid, id, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id ?? autoId;
  const rulesId = `${inputId}-rules`;
  return (
    <div data-slot="password-input" className="flex flex-col gap-1.5">
      <InputGroup>
        <InputGroupInput
          id={inputId}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={invalid === true ? true : undefined}
          aria-describedby={rules ? rulesId : undefined}
          {...props}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            size="icon-sm"
            className="pointer-coarse:size-11"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            aria-controls={inputId}
            onClick={() => setVisible((current) => !current)}
          >
            {visible ? <EyeOffIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {rules ? (
        <p id={rulesId} className="text-sm text-muted-foreground">
          {rules}
        </p>
      ) : null}
    </div>
  );
}

import { useId, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { Button } from '@smartapp/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@smartapp/ui/components/dropdown-menu';
import { Field, FieldDescription, FieldError, FieldLabel } from '@smartapp/ui/components/field';
import { Textarea } from '@smartapp/ui/components/textarea';
import { AppSheet } from '@smartapp/ui/compositions/app-sheet';
import { ChoiceChip } from '@smartapp/ui/compositions/choice-chip';
import { notify } from '@smartapp/ui/lib/notify';

export const SUGGESTED_RULES: readonly string[] = [
  'No smoking',
  'No pets',
  'No parties',
  'Quiet hours 10 PM–7 AM',
];
const MAX_RULES = 20;
const MAX_LENGTH = 200;

const isSuggested = (rule: string) => SUGGESTED_RULES.includes(rule);

/**
 * House rules (R-2, AUDIT-1 A15): the four common rules stay as short chips; the owner's own rules
 * are a list, one row each, that wraps, can be edited, moved and removed. Guests read the rules in
 * this order: the chips first, then the owner's own.
 */
export function HouseRulesEditor({
  rules,
  onChange,
}: {
  readonly rules: readonly string[];
  readonly onChange: (next: string[]) => void;
}) {
  const ids = useId();
  const [newRule, setNewRule] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ index: number; text: string } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const picked = SUGGESTED_RULES.filter((rule) => rules.includes(rule));
  const own = rules.filter((rule) => !isSuggested(rule));
  const full = rules.length >= MAX_RULES;

  const emit = (nextPicked: readonly string[], nextOwn: readonly string[]) =>
    onChange([...nextPicked, ...nextOwn]);

  function check(text: string, ignoreIndex: number | null): string | null {
    if (text.length === 0) return 'Write the rule first.';
    const editingRule = ignoreIndex === null ? null : own[ignoreIndex];
    const others = rules.filter((rule) => rule !== editingRule);
    return others.some((rule) => rule.toLowerCase() === text.toLowerCase())
      ? 'You already have this rule.'
      : null;
  }

  function add() {
    const text = newRule.trim().slice(0, MAX_LENGTH);
    const problem = full ? `You can have up to ${MAX_RULES} rules.` : check(text, null);
    if (problem) {
      setAddError(problem);
      return;
    }
    emit(picked, [...own, text]);
    setNewRule('');
    setAddError(null);
  }

  function move(index: number, by: -1 | 1) {
    const target = index + by;
    if (target < 0 || target >= own.length) return;
    const next = [...own];
    const [moved] = next.splice(index, 1);
    if (moved === undefined) return;
    next.splice(target, 0, moved);
    emit(picked, next);
  }

  function remove(index: number) {
    const removed = own[index];
    const before = [...rules];
    emit(
      picked,
      own.filter((_, i) => i !== index),
    );
    if (removed) {
      notify.success('Rule removed', { onUndo: () => onChange(before) });
    }
  }

  function saveEdit() {
    if (!editing) return;
    const text = editing.text.trim().slice(0, MAX_LENGTH);
    const problem = check(text, editing.index);
    if (problem) {
      setEditError(problem);
      return;
    }
    emit(
      picked,
      own.map((rule, i) => (i === editing.index ? text : rule)),
    );
    setEditing(null);
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-4">
      <legend className="mb-1.5 text-sm font-medium text-muted-foreground">House rules</legend>
      <div className="flex min-w-0 flex-wrap gap-2">
        {SUGGESTED_RULES.map((rule) => (
          <ChoiceChip
            key={rule}
            pressed={rules.includes(rule)}
            onPressedChange={(on) =>
              (!on || !full) &&
              emit(
                SUGGESTED_RULES.filter((item) => (item === rule ? on : picked.includes(item))),
                own,
              )
            }
          >
            {rule}
          </ChoiceChip>
        ))}
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium" id={`${ids}-own`}>
          Your own rules
          <span className="ml-2 font-normal text-muted-foreground tabular">
            {rules.length} of {MAX_RULES}
          </span>
        </p>
        {own.length > 0 ? (
          <ol
            aria-labelledby={`${ids}-own`}
            className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card"
          >
            {own.map((rule, index) => (
              <li key={rule} className="flex items-start gap-2 py-2 pr-1 pl-4">
                <span className="mt-0.5 w-5 shrink-0 text-sm text-muted-foreground tabular">
                  {index + 1}.
                </span>
                <p className="min-w-0 flex-1 py-0.5 text-sm break-words whitespace-pre-wrap">
                  {rule}
                </p>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="-my-1 size-11 shrink-0 pointer-fine:size-9"
                        aria-label={`More for rule ${index + 1}`}
                      />
                    }
                  >
                    <MoreHorizontalIcon aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-44">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditing({ index, text: rule });
                        setEditError(null);
                      }}
                    >
                      <PencilIcon aria-hidden="true" />
                      Edit
                    </DropdownMenuItem>
                    {index > 0 ? (
                      <DropdownMenuItem onClick={() => move(index, -1)}>
                        <ArrowUpIcon aria-hidden="true" />
                        Move up
                      </DropdownMenuItem>
                    ) : null}
                    {index < own.length - 1 ? (
                      <DropdownMenuItem onClick={() => move(index, 1)}>
                        <ArrowDownIcon aria-hidden="true" />
                        Move down
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => remove(index)}>
                      <Trash2Icon aria-hidden="true" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">
            Add rules that are only yours, such as visitor hours or where to park.
          </p>
        )}
      </div>

      <form
        className="flex min-w-0 flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <Field data-invalid={addError ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-new`}>Add your own rule</FieldLabel>
          <Textarea
            id={`${ids}-new`}
            rows={2}
            maxLength={MAX_LENGTH}
            disabled={full}
            placeholder="Visitors may stay until 9 PM"
            value={newRule}
            aria-invalid={addError ? true : undefined}
            onChange={(event) => {
              setNewRule(event.target.value);
              setAddError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                add();
              }
            }}
          />
          <FieldDescription className="tabular">
            {full
              ? `You have ${MAX_RULES} rules, the most a page can show.`
              : `${newRule.trim().length} of ${MAX_LENGTH} characters`}
          </FieldDescription>
          <FieldError>{addError}</FieldError>
        </Field>
        <Button
          type="submit"
          variant="outline"
          className="min-h-11 self-start"
          disabled={full || newRule.trim().length === 0}
        >
          <PlusIcon aria-hidden="true" />
          Add rule
        </Button>
      </form>

      <AppSheet
        open={editing !== null}
        onOpenChange={(open) => (open ? undefined : setEditing(null))}
        size="sm"
        title="Edit rule"
        footer={
          <>
            <Button
              data-sheet-cancel=""
              variant="outline"
              className="min-h-11"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button className="min-h-11" onClick={saveEdit}>
              Done
            </Button>
          </>
        }
      >
        <Field data-invalid={editError ? true : undefined}>
          <FieldLabel htmlFor={`${ids}-edit`}>Rule</FieldLabel>
          <Textarea
            id={`${ids}-edit`}
            rows={4}
            maxLength={MAX_LENGTH}
            value={editing?.text ?? ''}
            aria-invalid={editError ? true : undefined}
            onChange={(event) => {
              const text = event.target.value;
              setEditing((current) => (current ? { ...current, text } : current));
              setEditError(null);
            }}
          />
          <FieldDescription className="tabular">
            {(editing?.text.trim().length ?? 0).toString()} of {MAX_LENGTH} characters
          </FieldDescription>
          <FieldError>{editError}</FieldError>
        </Field>
      </AppSheet>
    </fieldset>
  );
}

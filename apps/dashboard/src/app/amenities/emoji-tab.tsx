import { EmojiPicker, EmojiPickerPanel } from '@smartapp/ui/components/reui/emoji-picker';

/** The emoji picker (UI-5), split out so it loads only when the owner opens the Emoji tab. */
export default function EmojiTab({ onPick }: { readonly onPick: (emoji: string) => void }) {
  return (
    <EmojiPicker onEmojiSelect={(selection) => onPick(selection.value)}>
      <EmojiPickerPanel className="h-80 w-full" />
    </EmojiPicker>
  );
}

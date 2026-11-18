---
name: smartapp-ui-writing
description: How Smart App PH screens talk: button labels, form labels and hints, error messages, empty states, toasts, confirmations, onboarding steps and status words for owners, guests and tenants in the Philippines. Use this skill whenever you write or change any text a person will see in apps/dashboard or apps/storefront, including placeholder copy, aria-labels and demo text, even if the task is mainly about layout or logic.
---

# Smart App PH UI writing

The people reading our screens are small property owners and their guests in the Philippines, usually on a phone, often in a hurry, often reading English as a second language. Words are part of the interface: a clear label saves a support message, a vague one loses a booking. Write so a busy owner in Tagaytay understands it on the first read.

## Voice

- **Plain, short, friendly, not cute.** Everyday English that reads naturally to Filipinos. No slang, no jokes in errors, no exclamation marks except after real success.
- **Sentence case everywhere**: "Add a unit", not "Add A Unit" or "ADD UNIT". All caps is hard to read and looks generated.
- **Name things the way people do**, not the way the database does: "guests", "stays", "rooms", "payment proof", not "customers", "reservations", "inventory", "uploaded artifact".
- **Active voice, present tense**: "We sent the code to 0917…", not "A code has been sent".
- **Talk to the person as "you"**; the product is "we" only when we did something ("We saved your changes").

## Buttons and actions

- Say exactly what happens: **"Save changes"**, "Add unit", "Send payment proof", "Approve payment". Never "Submit", "OK", "Confirm" on its own, or "Click here".
- Keep the same word through the whole flow, so people learn the product: the button "Publish page" leads to the toast "Page published", not "Changes are live".
- One primary action per screen; secondary actions are quieter (outline or ghost button, or the ⋯ menu).
- Destructive actions name the thing: "Delete Unit 2B", and the confirm dialog says what will be lost and whether it can be undone.

## Forms

- Labels are nouns above the field ("Nightly price"), never placeholder-only, because the placeholder disappears when typing starts.
- Hints say why we ask when it is not obvious: "Guests see this number when they book. We never share it elsewhere."
- Accept what people type (0917 123 4567, +63 917…, ₱1,500 or 1500) and format it for them instead of rejecting it.
- Money is written **₱1,500** (peso sign, comma thousands, no decimals unless there are centavos). Dates read "Fri, 12 Dec" or "12–14 Dec 2026"; times "2:00 PM", Manila time.

## Errors

An error is directions, not an apology. Say what happened and what to do next, in one or two short sentences.

- Good: "That link is already taken. Try ulap-suites-tagaytay or add your town."
- Good: "You're offline. We'll send this when you're back online."
- Avoid: "Oops! Something went wrong 😢", "Invalid input", "Error 422", "Sorry for the inconvenience".
- Field errors sit under the field and name the field: "Enter a price above ₱0."
- Show the error code only as small secondary text, for support (`not_allowed`, `conflict`).

## Empty states

An empty screen is the first step, not a dead end: one sentence saying what goes here and one action to start.

- "No units yet. Add your first room, suite or bed to start taking bookings." + button "Add unit".
- Only a truly empty page gets an illustration; an empty section inside a page is one line and one action.

## Toasts and confirmations

- Past tense of the action, plus Undo when it can be undone: "Unit hidden · Undo".
- Do not toast what the screen already shows (a new row appearing needs no "Added!").

## Status words

Use the labels from `BookingStatusBadge` and `PaymentStatusBadge` (Held, In review, Confirmed, Checked in, Completed, Cancelled, Expired; Submitted, Approved, Rejected, Reversed) so the same state has the same word everywhere. Don't invent synonyms like "Pending" or "Done".

## Check before you finish

Read every new string out loud as if you were the owner. If you would have to ask "what does this mean?", rewrite it. Then check that the same action has the same name on every screen you touched.

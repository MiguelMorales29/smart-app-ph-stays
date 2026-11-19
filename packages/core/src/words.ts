import type { ErrorCode, ErrorReason } from './errors/index.js';
import type { Bank } from './lists/payments.js';

const errorMessages = {
  dates_taken: 'Those dates were just taken. Pick different dates to continue.',
  price_changed: 'The price changed while you were booking. Check the updated total and try again.',
  hold_limit: 'You already have two unpaid holds with this property. Complete or cancel one first.',
  reference_used: 'That payment reference was already used on another payment.',
  invalid_move: 'This record can no longer be changed that way.',
  not_allowed: 'This action is not allowed right now.',
  not_found: 'We could not find what you are looking for.',
} as const satisfies Record<ErrorCode, string>;

const errorReasonMessages = {
  invalid_input: 'Check the highlighted fields and try again.',
  slug_taken: 'That web address is already taken. Try adding your town or another word.',
  slug_reserved: 'That web address is reserved by Smart App PH. Pick another one.',
  slug_change_limit: 'You reached the limit of 3 web address changes this year.',
  email_taken: 'An account with that email already exists. Sign in instead or use another email.',
  unit_limit:
    'You reached the unit limit on your plan. Add extra units in Plan settings or archive an unused unit.',
  storage_full: 'Your storage is full. Free up space in Storage settings before uploading new photos.',
  file_too_large: 'This file is over 15 MB. Pick a smaller photo and try again.',
  not_image: 'Upload a JPEG, PNG or WebP image.',
  last_payment_method: 'Keep at least one payment method turned on so guests can pay.',
  bank_limit: 'You can add up to 3 bank accounts. Edit or turn off an existing one instead.',
  changed_elsewhere:
    'Someone updated this while you were editing. Reload the page to see the latest details.',
  wallet_not_checked:
    'Check your GCash, Maya or bank history first, then tick the box before approving.',
  wrong_password: 'That password is incorrect. Enter your current password and try again.',
  unit_not_ready: 'Add at least 3 photos and a base price before listing this unit.',
} as const satisfies Record<ErrorReason, string>;

const bankLabels = {
  bdo: 'BDO',
  bpi: 'BPI',
  metrobank: 'Metrobank',
  landbank: 'Landbank',
  pnb: 'PNB',
  security_bank: 'Security Bank',
  unionbank: 'UnionBank',
  rcbc: 'RCBC',
  china_bank: 'China Bank',
  eastwest: 'EastWest',
  gotyme: 'GoTyme',
  seabank: 'SeaBank',
  other: 'Other bank',
} as const satisfies Record<Bank, string>;

export const words = {
  appName: 'Smart App PH',
  productName: 'Stays and Rentals',
  errors: errorMessages,
  errorReasons: errorReasonMessages,
  banks: bankLabels,
} as const;

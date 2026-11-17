import type { ErrorCode } from './errors/index.js';
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
  banks: bankLabels,
} as const;

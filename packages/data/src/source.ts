import { operations } from '@smartapp/core';
import type { OperationAccess, OperationName, Result } from '@smartapp/core';
import type { z } from 'zod';

/**
 * Caller identity passed explicitly to every DataSource call.
 *
 * Security boundary: `{ role: 'system' }` may only be used by background jobs
 * inside the API (and in server/memory contract tests); the browser and the
 * HTTP adapter must never send it.
 */
export type Session =
  | { readonly role: 'guest' }
  | { readonly role: 'guest'; readonly threadToken: string }
  | { readonly role: 'member'; readonly customerId: string; readonly accountId: string }
  | { readonly role: 'owner'; readonly accountId: string; readonly profileId: string }
  | { readonly role: 'super_admin'; readonly profileId: string }
  | { readonly role: 'system' };

type ContractOperations = typeof operations;

export type OperationInput<K extends OperationName> = z.input<ContractOperations[K]['input']>;
export type OperationParsedInput<K extends OperationName> = z.output<
  ContractOperations[K]['input']
>;
export type OperationOutput<K extends OperationName> = z.output<ContractOperations[K]['output']>;

export type DataSource = {
  readonly [K in OperationName]: (
    input: OperationInput<K>,
    session: Session,
  ) => Promise<Result<OperationOutput<K>>>;
};

export type ParsedDataSourceHandlers = {
  readonly [K in OperationName]: (
    input: OperationParsedInput<K>,
    session: Session,
  ) => Promise<Result<OperationOutput<K>>>;
};

export interface ValidatedDataSourceOptions {
  /**
   * When true (default), every successful result is parsed against its output
   * Zod schema in the core contract so tests and development catch drift immediately.
   */
  readonly validateOutput?: boolean;
}

export function getSessionAccessLevels(session: Session): readonly OperationAccess[] {
  switch (session.role) {
    case 'guest':
      return 'threadToken' in session ? ['public', 'guest_token'] : ['public'];
    case 'member':
      return ['public', 'member'];
    case 'owner':
      return ['public', 'owner'];
    case 'super_admin':
      return ['public', 'super_admin'];
    case 'system':
      return ['system'];
  }
}

export function hasOperationAccess(session: Session, allowed: readonly OperationAccess[]): boolean {
  const callerAccess = getSessionAccessLevels(session);
  return allowed.some((level) => callerAccess.includes(level));
}

export function createValidatedDataSource(
  handlers: ParsedDataSourceHandlers,
  options: ValidatedDataSourceOptions = {},
): DataSource {
  const validateOutput = options.validateOutput ?? true;

  function wrapOp<I, P, O>(
    inputSchema: z.ZodType<P, I>,
    outputSchema: z.ZodType<O>,
    handler: (input: P, session: Session) => Promise<Result<O>>,
  ): (input: I, session: Session) => Promise<Result<O>> {
    return async (input, session) => {
      // Every call checks its input against the core contract Zod schema.
      const parsedInput = inputSchema.parse(input);
      const result = await handler(parsedInput, session);

      if (result.ok && validateOutput) {
        const parsedOutput = outputSchema.parse(result.data);
        return { ok: true, data: parsedOutput };
      }

      return result;
    };
  }

  return {
    getProperty: wrapOp(
      operations.getProperty.input,
      operations.getProperty.output,
      handlers.getProperty,
    ),
    getUnitCalendar: wrapOp(
      operations.getUnitCalendar.input,
      operations.getUnitCalendar.output,
      handlers.getUnitCalendar,
    ),
    quoteStay: wrapOp(operations.quoteStay.input, operations.quoteStay.output, handlers.quoteStay),
    createBookingHold: wrapOp(
      operations.createBookingHold.input,
      operations.createBookingHold.output,
      handlers.createBookingHold,
    ),
    getThread: wrapOp(operations.getThread.input, operations.getThread.output, handlers.getThread),
    postMessage: wrapOp(
      operations.postMessage.input,
      operations.postMessage.output,
      handlers.postMessage,
    ),
    submitPayment: wrapOp(
      operations.submitPayment.input,
      operations.submitPayment.output,
      handlers.submitPayment,
    ),
    findMyBooking: wrapOp(
      operations.findMyBooking.input,
      operations.findMyBooking.output,
      handlers.findMyBooking,
    ),
    cancelBooking: wrapOp(
      operations.cancelBooking.input,
      operations.cancelBooking.output,
      handlers.cancelBooking,
    ),
    ownerHome: wrapOp(operations.ownerHome.input, operations.ownerHome.output, handlers.ownerHome),
    listBookings: wrapOp(
      operations.listBookings.input,
      operations.listBookings.output,
      handlers.listBookings,
    ),
    getBooking: wrapOp(
      operations.getBooking.input,
      operations.getBooking.output,
      handlers.getBooking,
    ),
    reviewPayment: wrapOp(
      operations.reviewPayment.input,
      operations.reviewPayment.output,
      handlers.reviewPayment,
    ),
    recordOwnerPayment: wrapOp(
      operations.recordOwnerPayment.input,
      operations.recordOwnerPayment.output,
      handlers.recordOwnerPayment,
    ),
    setBlock: wrapOp(operations.setBlock.input, operations.setBlock.output, handlers.setBlock),
    releaseBlock: wrapOp(
      operations.releaseBlock.input,
      operations.releaseBlock.output,
      handlers.releaseBlock,
    ),
    createManualBooking: wrapOp(
      operations.createManualBooking.input,
      operations.createManualBooking.output,
      handlers.createManualBooking,
    ),
    changeBookingDates: wrapOp(
      operations.changeBookingDates.input,
      operations.changeBookingDates.output,
      handlers.changeBookingDates,
    ),
    listThreads: wrapOp(
      operations.listThreads.input,
      operations.listThreads.output,
      handlers.listThreads,
    ),
    listOwnerAccounts: wrapOp(
      operations.listOwnerAccounts.input,
      operations.listOwnerAccounts.output,
      handlers.listOwnerAccounts,
    ),
    approveAccount: wrapOp(
      operations.approveAccount.input,
      operations.approveAccount.output,
      handlers.approveAccount,
    ),
    expireHolds: wrapOp(
      operations.expireHolds.input,
      operations.expireHolds.output,
      handlers.expireHolds,
    ),
    reversePayment: wrapOp(
      operations.reversePayment.input,
      operations.reversePayment.output,
      handlers.reversePayment,
    ),
    markCheckedIn: wrapOp(
      operations.markCheckedIn.input,
      operations.markCheckedIn.output,
      handlers.markCheckedIn,
    ),
    completeBooking: wrapOp(
      operations.completeBooking.input,
      operations.completeBooking.output,
      handlers.completeBooking,
    ),
    submitGuestList: wrapOp(
      operations.submitGuestList.input,
      operations.submitGuestList.output,
      handlers.submitGuestList,
    ),
    rotateThreadLink: wrapOp(
      operations.rotateThreadLink.input,
      operations.rotateThreadLink.output,
      handlers.rotateThreadLink,
    ),
    publishPropertyPage: wrapOp(
      operations.publishPropertyPage.input,
      operations.publishPropertyPage.output,
      handlers.publishPropertyPage,
    ),
    changeSlug: wrapOp(
      operations.changeSlug.input,
      operations.changeSlug.output,
      handlers.changeSlug,
    ),
    submitReview: wrapOp(
      operations.submitReview.input,
      operations.submitReview.output,
      handlers.submitReview,
    ),
    createExport: wrapOp(
      operations.createExport.input,
      operations.createExport.output,
      handlers.createExport,
    ),
    reportPage: wrapOp(
      operations.reportPage.input,
      operations.reportPage.output,
      handlers.reportPage,
    ),
    duplicateUnit: wrapOp(
      operations.duplicateUnit.input,
      operations.duplicateUnit.output,
      handlers.duplicateUnit,
    ),
    hideMessage: wrapOp(
      operations.hideMessage.input,
      operations.hideMessage.output,
      handlers.hideMessage,
    ),
    closeThread: wrapOp(
      operations.closeThread.input,
      operations.closeThread.output,
      handlers.closeThread,
    ),
    blockCustomer: wrapOp(
      operations.blockCustomer.input,
      operations.blockCustomer.output,
      handlers.blockCustomer,
    ),
    joinAsMember: wrapOp(
      operations.joinAsMember.input,
      operations.joinAsMember.output,
      handlers.joinAsMember,
    ),
    reviewPlanPayment: wrapOp(
      operations.reviewPlanPayment.input,
      operations.reviewPlanPayment.output,
      handlers.reviewPlanPayment,
    ),
    pauseLateAccounts: wrapOp(
      operations.pauseLateAccounts.input,
      operations.pauseLateAccounts.output,
      handlers.pauseLateAccounts,
    ),
    claimOutboxBatch: wrapOp(
      operations.claimOutboxBatch.input,
      operations.claimOutboxBatch.output,
      handlers.claimOutboxBatch,
    ),
    finishOutboxItem: wrapOp(
      operations.finishOutboxItem.input,
      operations.finishOutboxItem.output,
      handlers.finishOutboxItem,
    ),
    queueMetaEvent: wrapOp(
      operations.queueMetaEvent.input,
      operations.queueMetaEvent.output,
      handlers.queueMetaEvent,
    ),
    claimMetaDeliveries: wrapOp(
      operations.claimMetaDeliveries.input,
      operations.claimMetaDeliveries.output,
      handlers.claimMetaDeliveries,
    ),
    listPaymentsToReview: wrapOp(
      operations.listPaymentsToReview.input,
      operations.listPaymentsToReview.output,
      handlers.listPaymentsToReview,
    ),
    getCalendarTimeline: wrapOp(
      operations.getCalendarTimeline.input,
      operations.getCalendarTimeline.output,
      handlers.getCalendarTimeline,
    ),
  } satisfies DataSource;
}

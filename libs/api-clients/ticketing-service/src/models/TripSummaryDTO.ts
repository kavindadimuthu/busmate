/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaymentBreakdownEntryDTO } from './PaymentBreakdownEntryDTO';
import type { SaleStageBreakdownEntryDTO } from './SaleStageBreakdownEntryDTO';
export type TripSummaryDTO = {
    tripId?: string;
    totalTickets?: number;
    totalFareAmount?: number;
    validTickets?: number;
    invalidTickets?: number;
    averageFarePerTicket?: number;
    cancelledTickets?: number;
    paymentBreakdown?: Array<PaymentBreakdownEntryDTO>;
    saleBreakdown?: Array<SaleStageBreakdownEntryDTO>;
};


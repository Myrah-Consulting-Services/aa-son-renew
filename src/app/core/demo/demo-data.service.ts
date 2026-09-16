import { Injectable } from '@angular/core';
import {
  NABLUS_BANKS,
  NABLUS_BRANCHES,
  NABLUS_CASH,
  NABLUS_DEPARTMENTS,
  NABLUS_DESIGNATIONS,
  NABLUS_EXPENSES,
  NABLUS_HR_EMPLOYEES,
  NABLUS_INWARDS,
  NABLUS_ITEMS,
  NABLUS_JV,
  NABLUS_LEAVE_REQUESTS,
  NABLUS_LEDGERS,
  NABLUS_LOCATIONS,
  NABLUS_OUTWARDS,
  NABLUS_PARTIES,
  NABLUS_PAY_RUNS,
  NABLUS_PAYROLL_HISTORY,
  NABLUS_PURCHASE_INVOICES,
  NABLUS_PUTAWAY_TASKS,
  NABLUS_REQUISITIONS,
  NABLUS_SALES_INVOICES,
  NABLUS_STOCK,
  NABLUS_WAREHOUSES,
  buildNablusAttendance,
  useDemoIfEmpty,
} from './nablus-lists.data';

/**
 * Central access to Nablus Road Contracting demo list data.
 * Prefer this over duplicating arrays in each screen.
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  parties(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_PARTIES);
  }

  items(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_ITEMS);
  }

  salesInvoices(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_SALES_INVOICES);
  }

  purchaseInvoices(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_PURCHASE_INVOICES);
  }

  expenses(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_EXPENSES);
  }

  journalVouchers(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_JV);
  }

  ledgers(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_LEDGERS);
  }

  banks(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_BANKS);
  }

  cash(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_CASH);
  }

  warehouses(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_WAREHOUSES);
  }

  locations(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_LOCATIONS);
  }

  stock(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_STOCK);
  }

  inwards(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_INWARDS);
  }

  outwards(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_OUTWARDS);
  }

  requisitions(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_REQUISITIONS);
  }

  putawayTasks(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_PUTAWAY_TASKS);
  }

  employees(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_HR_EMPLOYEES);
  }

  departments(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_DEPARTMENTS);
  }

  designations(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_DESIGNATIONS);
  }

  branches(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_BRANCHES);
  }

  leaveRequests(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_LEAVE_REQUESTS);
  }

  payRuns(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_PAY_RUNS);
  }

  payrollHistory(api?: any[] | null) {
    return useDemoIfEmpty(api, NABLUS_PAYROLL_HISTORY);
  }

  attendance(api?: any[] | null, year?: number, month?: number) {
    const y = year || new Date().getFullYear();
    const m = month || new Date().getMonth() + 1;
    return useDemoIfEmpty(api, buildNablusAttendance(y, m));
  }
}

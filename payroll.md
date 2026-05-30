# Payroll Module PRD + Form Blueprint (UAE, React, Hardcoded-First)

## Purpose

This document is a complete implementation guide to rebuild Payroll in another React project using hardcoded data first.

You get:
- all pages/modules list
- each form with exact field keys
- defaults, validation rules, and dependencies
- open/create/edit/view flows
- sample mock payloads
- UAE compliance focus (WPS, EOSB, statutory)

---

## 1) Payroll Modules and Pages

Base path: `/payroll`

1. Dashboard
2. Employee List
3. Employee Form (Create/Edit)
4. Employee View
5. Attendance
6. Leave Management
7. Loan Management
8. Payroll Processing
9. Pay Runs List
10. Pay Run Detail
11. Pay Schedule
12. Salary Setup
13. Salary Structure
14. Employee Assignment
15. Statutory Hub
16. WPS
17. GPSSA/Pension
18. GOSI
19. Gratuity
20. EOSB Accrual Dashboard
21. Final Settlement
22. Payroll Settings
23. Missing Data Fix
24. Terminate Process
25. Revise Salary
26. Social Security (benefits, pension)

---

## 2) Route Map

- `/payroll/dashboard`
- `/payroll/employee`
- `/payroll/employee/new`
- `/payroll/employee/:id/edit`
- `/payroll/employee/:id/view`
- `/payroll/attendance`
- `/payroll/leave-management`
- `/payroll/loan-management`
- `/payroll/payroll-processing`
- `/payroll/pay-runs`
- `/payroll/pay-runs/:runId`
- `/payroll/pay-schedule`
- `/payroll/salary`
- `/payroll/salary-structure`
- `/payroll/employee-assignment`
- `/payroll/statutory`
- `/payroll/statutory/wps`
- `/payroll/statutory/gpssa`
- `/payroll/statutory/gosi`
- `/payroll/gratuity`
- `/payroll/eosb-accrual-dashboard`
- `/payroll/final-settlement`
- `/payroll/payroll-settings`
- `/payroll/missing-data/:payrollRunId`
- `/payroll/terminate-process`
- `/payroll/revise-salary/:id`
- `/payroll/social-security/benefits`
- `/payroll/social-security/pension`

---

## 3) App Structure (React)

```txt
src/modules/payroll/
  pages/
  components/
    forms/
    tables/
    cards/
    drawers/
    modals/
  data/
    mockEmployees.ts
    mockAttendance.ts
    mockLeaves.ts
    mockLoans.ts
    mockPayRuns.ts
    mockWps.ts
    mockStatutory.ts
    mockGratuity.ts
    mockSettings.ts
  services/
    payrollMockService.ts
  types/
    payroll.types.ts
  validations/
    payrollSchemas.ts
  utils/
    uaeValidators.ts
    payrollCalcs.ts
```

---

## 4) Common Data Types (Use These Keys)

```ts
type CurrencyCode = 'AED';
type PayrollStatus = 'draft' | 'validated' | 'processed' | 'wps_submitted' | 'paid' | 'rejected';
type PaymentMode = 'bank_transfer' | 'cash' | 'cheque';

type Employee = {
  id: string;
  employeeCode: string;
  personal: {
    firstName: string;
    lastName: string;
    fullName: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string;
    nationality: string;
    maritalStatus: 'single' | 'married';
    mobileCountryCode: '+971';
    mobile: string;
    email: string;
  };
  employment: {
    joiningDate: string;
    departmentId: string;
    designationId: string;
    branchId: string;
    workLocationEmirate: 'abu_dhabi' | 'dubai' | 'sharjah' | 'ajman' | 'umm_al_quwain' | 'ras_al_khaimah' | 'fujairah';
    contractType: 'limited' | 'unlimited';
    employeeType: 'full_time' | 'part_time' | 'contract';
    status: 'active' | 'inactive' | 'terminated';
  };
  salary: {
    basic: number;
    hra: number;
    transport: number;
    otherAllowance: number;
    overtimeEligible: boolean;
    currency: CurrencyCode;
  };
  payment: {
    mode: PaymentMode;
    bankName: string;
    iban: string;
    accountNumber: string;
    swiftCode?: string;
    wpsEnabled: boolean;
    wpsEstablishmentId?: string;
    wpsEmployeeId?: string;
    molPersonCode?: string;
    agentBankCode?: string;
  };
  statutory: {
    isUaeNational: boolean;
    gpssaEligible: boolean;
    gosiEligible: boolean;
    eosbEligible: boolean;
  };
  documents: Array<{
    id: string;
    type: 'passport' | 'emirates_id' | 'visa' | 'contract' | 'other';
    number: string;
    issueDate?: string;
    expiryDate?: string;
  }>;
};
```

---

## 5) Master Mock Files (Hardcoded)

Create these files first:

1. `mockEmployees.ts`
2. `mockAttendance.ts`
3. `mockLeaves.ts`
4. `mockLoans.ts`
5. `mockPayRuns.ts`
6. `mockWps.ts`
7. `mockStatutory.ts`
8. `mockGratuity.ts`
9. `mockSettings.ts`

Each file exports arrays + CRUD helper functions.

---

## 6) Detailed Forms (Fields, Validation, Defaults)

## 6.1 Employee Form (`/payroll/employee/new`, `/payroll/employee/:id/edit`)

### Form Key: `employeeForm`

### Section A: Personal

- `personal.firstName` (required, min 2)
- `personal.lastName` (required, min 1)
- `personal.fullName` (auto = first + last)
- `personal.gender` (required)
- `personal.dateOfBirth` (required, age >= 18)
- `personal.nationality` (required)
- `personal.maritalStatus` (required)
- `personal.mobileCountryCode` (default `+971`)
- `personal.mobile` (required, UAE mobile pattern)
- `personal.email` (required, email pattern)

### Section B: Employment

- `employment.joiningDate` (required)
- `employment.departmentId` (required)
- `employment.designationId` (required)
- `employment.branchId` (required)
- `employment.workLocationEmirate` (required)
- `employment.contractType` (required)
- `employment.employeeType` (required)
- `employment.status` (default `active`)

### Section C: Salary

- `salary.basic` (required, > 0)
- `salary.hra` (default 0)
- `salary.transport` (default 0)
- `salary.otherAllowance` (default 0)
- `salary.overtimeEligible` (default false)
- `salary.currency` (default `AED`, readonly)

### Section D: Payment + WPS

- `payment.mode` (required)
- `payment.bankName` (required if mode = bank_transfer)
- `payment.iban` (required if bank_transfer, validate UAE IBAN)
- `payment.accountNumber` (required if bank_transfer)
- `payment.swiftCode` (optional)
- `payment.wpsEnabled` (default true)
- `payment.wpsEstablishmentId` (required if wpsEnabled)
- `payment.wpsEmployeeId` (required if wpsEnabled)
- `payment.molPersonCode` (optional but recommended)
- `payment.agentBankCode` (required if wpsEnabled)

### Section E: Statutory

- `statutory.isUaeNational` (required)
- `statutory.gpssaEligible` (auto true when UAE national)
- `statutory.gosiEligible` (config based)
- `statutory.eosbEligible` (default true)

### Section F: Documents (Array)

- `documents[].type` (required)
- `documents[].number` (required)
- `documents[].issueDate` (optional)
- `documents[].expiryDate` (required for passport/visa/emirates_id)

### Buttons

- `Save Draft`
- `Save & Continue`
- `Cancel`

### Open/Create/Edit Flow

1. open Create -> load defaults
2. save draft -> persist local mock list with `status=draft`
3. submit -> validate all required fields
4. open Edit -> preload existing by `id`
5. save edit -> update existing object in mock store

---

## 6.2 Attendance Page Form (`/payroll/attendance`)

### Form Key: `attendanceFilterForm`

- `month` (required)
- `year` (required)
- `departmentId` (optional)
- `employeeId` (optional)

### Row Editor Keys

- `attendance[].employeeId`
- `attendance[].workingDays`
- `attendance[].presentDays`
- `attendance[].absentDays`
- `attendance[].otHours`
- `attendance[].lateMinutes`
- `attendance[].unpaidLeaveDays`

Validation:
- present + absent <= workingDays
- unpaidLeaveDays <= absentDays

---

## 6.3 Leave Management Form (`/payroll/leave-management`)

### Form Key: `leaveRequestForm`

- `employeeId` (required)
- `leaveType` (required)
- `fromDate` (required)
- `toDate` (required, >= fromDate)
- `reason` (required, min 5)
- `contactDuringLeave` (optional)
- `isPaid` (default true)

### Leave Policy Setup Form Key: `leavePolicyForm`

- `leaveType`
- `annualQuota`
- `carryForwardLimit`
- `encashable`
- `requiresApproval`

---

## 6.4 Loan Management Form (`/payroll/loan-management`)

### Form Key: `loanForm`

- `employeeId` (required)
- `loanType` (required)
- `principalAmount` (required, > 0)
- `issueDate` (required)
- `interestType` (`flat` | `reducing`)
- `interestRate` (default 0)
- `tenureMonths` (required, > 0)
- `installmentStartMonth` (required)
- `deductionPriority` (default `normal`)

Computed:
- `monthlyInstallment`
- `totalPayable`

---

## 6.5 Payroll Processing Form (`/payroll/payroll-processing`)

### Form Key: `payrollProcessForm`

- `periodStart` (required)
- `periodEnd` (required)
- `payrollDate` (required)
- `departmentIds` (multi-select)
- `employeeIds` (multi-select)
- `includeOvertime` (default true)
- `includeArrears` (default true)
- `includeLoans` (default true)
- `includeUnpaidLeaves` (default true)
- `runType` (`regular` | `off_cycle`)
- `notes` (optional)

Buttons:
- `Validate Data`
- `Preview Payroll`
- `Finalize Run`

Validation errors panel shows:
- missing bank/IBAN
- missing WPS IDs
- negative net pay
- missing attendance rows

---

## 6.6 Pay Schedule Form (`/payroll/pay-schedule`)

### Form Key: `payScheduleForm`

- `scheduleName` (required)
- `frequency` (`monthly` | `biweekly` | `weekly`)
- `payDay` (required)
- `cutOffDay` (required)
- `graceDays` (default 0)
- `applicableEmployeeIds` (multi-select)
- `isDefault` (default false)
- `isActive` (default true)

---

## 6.7 Salary Structure Form (`/payroll/salary-structure`)

### Form Key: `salaryStructureForm`

- `structureCode` (required)
- `structureName` (required)
- `currency` (`AED`)
- `components[]`:
  - `componentCode`
  - `componentName`
  - `type` (`earning` | `deduction`)
  - `calcType` (`fixed` | `percent_of_basic`)
  - `value`
  - `isTaxable`
  - `isProRated`
  - `isActive`

Rule:
- percent components sum should be controlled by business logic

---

## 6.8 Employee Assignment Form (`/payroll/employee-assignment`)

### Form Key: `assignmentForm`

- `employeeId`
- `salaryStructureId`
- `effectiveFrom`
- `effectiveTo`
- `gradeId`
- `costCenterId`
- `projectId` (optional)

---

## 6.9 WPS Batch Form (`/payroll/statutory/wps`)

### Form Key: `wpsBatchForm`

- `wpsBatchId` (auto)
- `payRunId` (required)
- `period` (required)
- `bankAgentCode` (required)
- `establishmentId` (required)
- `salaryMonth` (required)
- `salaryYear` (required)
- `paymentDate` (required)
- `records[]`:
  - `employeeId`
  - `employeeMolId`
  - `iban`
  - `netPay`
  - `daysWorked`
  - `paymentType`

Actions:
- `Validate WPS`
- `Generate SIF`
- `Mark Submitted`
- `Mark Accepted`
- `Mark Rejected`

Mandatory checks:
- IBAN valid UAE format (`AE` + 21 chars)
- wpsEmployeeId present
- netPay >= 0
- payroll status must be `processed` before SIF

---

## 6.10 GPSSA/GOSI Form (`/payroll/statutory/gpssa`, `/payroll/statutory/gosi`)

### Form Key: `statutoryPlanForm`

- `planName`
- `effectiveFrom`
- `effectiveTo`
- `employeeContributionPct`
- `employerContributionPct`
- `maxContributoryWage`
- `applicableNationality`
- `proRataEnabled`
- `roundingRule`
- `isActive`

---

## 6.11 Gratuity Form (`/payroll/gratuity`)

### Form Key: `gratuityForm`

- `employeeId` (required)
- `joiningDate` (required)
- `lastWorkingDate` (required)
- `basicSalary` (required)
- `unpaidLeaveDays` (default 0)
- `terminationType` (`resignation` | `termination` | `contract_end`)
- `includeProRata` (default true)

Computed keys:
- `serviceYears`
- `eligible`
- `gratuityAmount`
- `formulaBreakdown[]`

---

## 6.12 Final Settlement Form (`/payroll/final-settlement`)

### Form Key: `finalSettlementForm`

- `employeeId`
- `lastWorkingDate`
- `gratuityAmount`
- `leaveEncashmentAmount`
- `noticePayAmount`
- `airfareAllowance`
- `otherAllowances`
- `loanRecoveryAmount`
- `otherDeductions`
- `pendingSalaryAmount`
- `currency` (`AED`)

Computed:
- `grossSettlement`
- `totalDeductions`
- `netSettlement`

Actions:
- `Calculate`
- `Save`
- `Export PDF`
- `Mark Paid`

---

## 6.13 Terminate Process Form (`/payroll/terminate-process`)

### Form Key: `terminateForm`

- `employeeId`
- `terminationDate`
- `reasonCode`
- `reasonDescription`
- `noticeServed` (boolean)
- `noticeDays`
- `eligibleForRehire` (boolean)

When saved:
- employee status -> `terminated`
- open final settlement draft for employee

---

## 6.14 Revise Salary Form (`/payroll/revise-salary/:id`)

### Form Key: `reviseSalaryForm`

- `employeeId`
- `effectiveDate`
- `revisionReason`
- `oldBasic`
- `newBasic`
- `allowanceChanges[]`
- `approveRequired`

Rules:
- `newBasic > 0`
- effective date cannot be before joining date

---

## 7) Page Open/Action Flow (Exact UX)

## 7.1 Employee

- List page has buttons: `Add`, `View`, `Edit`, `Deactivate`
- `Add` opens Employee Form in create mode
- `Edit` opens Employee Form with prefilled values
- `View` opens read-only page with tabs: Personal, Salary, Statutory, Documents

## 7.2 Payroll Run

1. open Payroll Processing
2. select period + filters
3. click `Validate Data`
4. if pass, click `Preview Payroll`
5. click `Finalize Run` -> create pay run in `mockPayRuns.ts`
6. from Pay Run Detail click `Generate WPS Batch`

## 7.3 WPS

1. open WPS page
2. pick processed run
3. click `Validate WPS`
4. click `Generate SIF` (download mock txt/csv)
5. set status submitted -> accepted/rejected
6. if rejected, show reject reason + reopen correction

---

## 8) Mock Payload Examples

```ts
export const mockEmployee: Employee = {
  id: 'emp_001',
  employeeCode: 'UAE001',
  personal: {
    firstName: 'Ahmed',
    lastName: 'Khan',
    fullName: 'Ahmed Khan',
    gender: 'male',
    dateOfBirth: '1991-02-10',
    nationality: 'UAE',
    maritalStatus: 'married',
    mobileCountryCode: '+971',
    mobile: '501234567',
    email: 'ahmed.khan@example.com'
  },
  employment: {
    joiningDate: '2023-01-15',
    departmentId: 'dep_fin',
    designationId: 'des_acct_mgr',
    branchId: 'br_dubai',
    workLocationEmirate: 'dubai',
    contractType: 'limited',
    employeeType: 'full_time',
    status: 'active'
  },
  salary: {
    basic: 12000,
    hra: 3000,
    transport: 1200,
    otherAllowance: 800,
    overtimeEligible: true,
    currency: 'AED'
  },
  payment: {
    mode: 'bank_transfer',
    bankName: 'Emirates NBD',
    iban: 'AE070331234567890123456',
    accountNumber: '1234567890',
    swiftCode: 'EBILAEAD',
    wpsEnabled: true,
    wpsEstablishmentId: 'EST-7788',
    wpsEmployeeId: 'WPS-EMP-0001',
    molPersonCode: 'MOL99881',
    agentBankCode: 'ENBD01'
  },
  statutory: {
    isUaeNational: true,
    gpssaEligible: true,
    gosiEligible: false,
    eosbEligible: true
  },
  documents: [
    { id: 'doc_1', type: 'emirates_id', number: '784-1991-1234567-1', expiryDate: '2028-03-31' }
  ]
};
```

```ts
export const mockWpsBatch = {
  wpsBatchId: 'WPS-2026-04-001',
  payRunId: 'RUN-2026-04',
  period: 'Apr-2026',
  bankAgentCode: 'ENBD01',
  establishmentId: 'EST-7788',
  salaryMonth: 4,
  salaryYear: 2026,
  paymentDate: '2026-04-30',
  status: 'generated',
  records: [
    {
      employeeId: 'emp_001',
      employeeMolId: 'MOL99881',
      iban: 'AE070331234567890123456',
      netPay: 15320,
      daysWorked: 30,
      paymentType: 'salary'
    }
  ]
};
```

---

## 9) Validation Rules (UAE Focus)

1. IBAN must start with `AE` and length should be 23
2. WPS enabled employees must have:
   - `payment.wpsEstablishmentId`
   - `payment.wpsEmployeeId`
   - `payment.agentBankCode`
3. Salary currency must be `AED`
4. Gratuity eligibility minimum service >= 1 year
5. Final settlement cannot be marked paid if netSettlement < 0
6. Processed payroll required before WPS generation

---

## 10) Compliance Checklist (Operational)

- WPS batch creation and status tracking
- SIF export capability (mock file)
- EOSB/gratuity calculations with service-year logic
- Final settlement with allowances/deductions
- GPSSA/GOSI setup pages with versioning
- Audit logs for payroll runs and approvals
- Lock finalized payroll periods

---

## 11) Build Sequence

1. Create all route pages + layout
2. Build mock store files
3. Build Employee Form with full keys
4. Build Payroll Processing + Pay Runs
5. Build WPS form and SIF export mock
6. Build Gratuity + Final Settlement
7. Build Statutory pages
8. Add validations and audit logs
9. Add role/approval gates

---

## 12) Handover Notes for React Team

- Start with mocked arrays and local state; do not block on backend.
- Keep field keys exactly as listed to minimize migration effort.
- Use one `schema` file for all form validation rules.
- Keep all amounts in `AED`.
- Store all date values in ISO format (`YYYY-MM-DD`).

---

## 13) Ready-to-Use Rebuild Prompt (For Dev/AI Agent)

Use the prompt below in the target React project when you want a clean rebuild.

```md
Task: Rebuild the Payroll module from scratch using UAE-first requirements and hardcoded data.

Important instructions:
1. Revert existing Payroll module implementation changes first (only payroll-related files/folders), then rebuild cleanly.
2. Do not reuse old payroll UI structure blindly. Recreate based on the specification in `payroll.md`.
3. Follow design system instructions from `design.md` strictly for:
   - layout spacing
   - typography scale
   - card/table styles
   - form controls
   - button variants
   - breadcrumb/header patterns
   - status badge colors
4. Implement all pages/routes/forms listed in `payroll.md`.
5. Use hardcoded/mock data first for every module and keep it API-ready.
6. Keep field keys and payload contracts exactly as documented in `payroll.md`.
7. Add form validations exactly as listed (especially UAE IBAN, WPS requirements, EOSB constraints).
8. Ensure all currency values are AED and date format is ISO (`YYYY-MM-DD`).
9. Build complete create/edit/view/open flows for forms.
10. Keep module production-ready structure (types, validations, services, mock data, reusable components).

Expected output:
- Fully rebuilt payroll module
- UAE compliance-ready flow foundation (WPS, statutory, gratuity, final settlement)
- UI aligned to `design.md`
- No placeholders left unconnected (buttons/actions should be functional in mock mode)
```

### Optional Strict Variant

If needed, use this stricter line at the top of the prompt:

`Delete/revert current payroll implementation and rebuild it completely according to payroll.md + design.md, without preserving legacy component structure.`

### Cursor Agent Prompt (Copy/Paste)

```md
You are Cursor Agent. Rebuild the Payroll module from scratch in this React project using `payroll.md` as the source of truth and `design.md` as the visual system reference.

Execution rules:
1. First identify all payroll-related files/folders in the current project.
2. Revert/remove existing payroll implementation (payroll module only), then rebuild cleanly.
3. Follow routes, pages, form keys, payload keys, validations, and flows exactly from `payroll.md`.
4. Follow UI patterns from `design.md` exactly (spacing, typography, cards, tables, forms, button styles, breadcrumbs, status badges).
5. Implement in hardcoded-data mode first:
   - create mock data files
   - implement full create/edit/view/open actions
   - keep architecture API-ready
6. UAE requirements are mandatory:
   - AED as currency everywhere
   - ISO dates (`YYYY-MM-DD`)
   - UAE IBAN validation
   - WPS mandatory fields and WPS batch flow
   - gratuity/EOSB/final settlement logic from `payroll.md`
7. All buttons and actions must be functional in mock mode (no dead UI controls).
8. Keep code modular: `pages`, `components`, `types`, `validations`, `services`, `data`.
9. Do not skip any page listed in `payroll.md`.
10. After implementation, run project checks and fix lint/type issues in payroll scope.

Deliverables:
- Fully rebuilt payroll module
- Design-compliant UI as per `design.md`
- Complete form workflows with exact keys
- Compliance-ready foundation for UAE payroll (WPS/statutory/EOSB)
```

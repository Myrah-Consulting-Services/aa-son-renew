import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsPayableAging } from './Reports/ap-aging-report/ap-aging-report';
import { AccountsReceivableAging } from './Reports/ar-aging-report/ar-aging-report';
import { BalanceSheet } from './Reports/balance-sheet/balance-sheet';
import { BankBook } from './Reports/bank-book/bank-book';
import { BankReconciliation } from './Reports/bank-reconciliation/bank-reconciliation';
import { CashFlowStatement } from './Reports/cash-flow-statement/cash-flow-statement';
import { ChartOfAccounts } from './Reports/chart-of-accounts/chart-of-accounts';
import { CustomerLedger } from './Reports/customer-ledger/customer-ledger';
import { FafReport } from './Reports/faf-report/faf-report';
import { GeneralLedgerReport } from './Reports/general-ledger-report/general-ledger-report';
import { OutstandingBills } from './Reports/outstanding-bills/outstanding-bills';
import { OutstandingInvoices } from './Reports/outstanding-invoices/outstanding-invoices';
import { ProfitLossStatement } from './Reports/profit-loss-statement/profit-loss-statement';
import { PurchaseRegister } from './Reports/purchase-register/purchase-register';
import { ReverseChargeReport } from './Reports/reverse-charge-report/reverse-charge-report';
import { SalesRegister } from './Reports/sales-register/sales-register';
import { StockSummary } from './Reports/stock-summary/stock-summary';
import { SupplierLedger } from './Reports/supplier-ledger/supplier-ledger';
import { TrialBalanceReport } from './Reports/trial-balance-report/trial-balance-report';
import { VatDetailedReport } from './Reports/vat-detailed-report/vat-detailed-report';
import { VatReport } from './Reports/vat-report/vat-report';
import { VatReturn } from './Reports/vat-return/vat-return';
import { ZeroRatedExemptReport } from './Reports/zero-rated-exempt-report/zero-rated-exempt-report';
import { LogReports } from './Reports/log-reports/log-reports';
import { CompanySetting } from './Setting/company-setting/company-setting';
import { PartyWiseBill } from './Reports/party-wise-bill/party-wise-bill';
import { ExpenseRegister } from './Reports/expense-register/expense-register';
import { LedgerReport } from './Reports/ledger-report/ledger-report';
import { PaymentRegister } from './Reports/payment-register/payment-register';

const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login/login').then(m => m.Login)
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'parties',
    loadComponent: () =>
      import('./parties/party-list/party-list').then(m => m.PartyList)
  },
  {
    path: 'parties/add',
    loadComponent: () =>
      import('./parties/add-party/add-party').then(m => m.AddParty)
  },{
    path:'parties/party/',
    loadComponent: () =>
      import('./parties/party/party').then(m => m.Party)
  },{
    path:'items/create-item',
    loadComponent: () =>
      import('./items/create-item/create-item').then(m => m.CreateItem)
  },{
    path:'items/add-item',
    loadComponent: () =>
      import('./items/add-item/add-item').then(m => m.AddItem)
  },{
    path:'items/item-list',
    loadComponent: () =>
      import('./items/item-list/item-list').then(m => m.ItemList)
  },{
    path:'invoices/create-invoice',
    loadComponent: () =>
      import('./Invoices/create-invoice/create-invoice').then(m => m.CreateInvoice)
  },  {
    path:'manage-money',
    loadComponent: () =>
      import('./manage-money/manage-page/manage-page').then(m => m.ManagePage)
  },{
    path:'manage-money/bank-detail/:id',
    loadComponent: () =>
      import('./manage-money/bank-detail/bank-detail').then(m => m.BankDetail)
  },{
    path:'manage-money/cash-detail/:id',
    loadComponent: () =>
      import('./manage-money/cash-detail/cash-detail').then(m => m.CashDetail)
  },{
    path:'manage-money/payment-in',
    loadComponent: () =>
      import('./manage-money/payment-in/payment-in').then(m => m.PaymentIn)
  },{
    path:'expense/create-expense',
    loadComponent: () =>
      import('./Expense/create-expense/create-expense').then(m => m.CreateExpenseComponent)
  },{
    path:'jv/create-jv',
    loadComponent: () =>
      import('./jv/create-jv/create-jv').then(m => m.CreateJv)
  },
  {
    path:'manage-money/reconcilation',
    loadComponent:() =>
      import('./manage-money/reconciliation/reconciliation').then( m=> m.Reconciliation)
  },
  {
    path: '',
    children: [
      {
        path: 'reports/sales-register',
        component: SalesRegister,
      },
      {
        path: 'reports/purchase-register',
        component: PurchaseRegister,
      },
      {
        path: 'reports/vat-report',
        component: VatReport,
      },
      {
        path: 'reports/vat-detailed-report',
        component: VatDetailedReport,
      },
      {
        path: 'reports/faf-report',
        component: FafReport,
      },
      {
        path: 'reports/profit-loss-statement',
        component: ProfitLossStatement,
      },
      {
        path: 'reports/balance-sheet',
        component: BalanceSheet,
      },
      {
        path: 'reports/cash-flow-statement',
        component: CashFlowStatement,
      },
      {
        path: 'reports/chart-of-accounts',
        component: ChartOfAccounts,
      },
      {
        path: 'reports/trial-balance',
        component: TrialBalanceReport,
      },
      {
        path: 'reports/ar-aging-report',
        component: AccountsReceivableAging,
      },
      {
        path: 'reports/ap-aging-report',
        component: AccountsPayableAging,
      },
      {
        path: 'reports/general-ledger-report',
        component: GeneralLedgerReport,
      },
      {
        path: 'reports/vat-return',
        component: VatReturn,
      },
      {
        path: 'reports/stock-summary',
        component: StockSummary,
      },
      {
        path: 'reports/reverse-charge-report',
        component: ReverseChargeReport,
      },
      {
        path: 'reports/zero-rated-exempt-report',
        component: ZeroRatedExemptReport,
      },
      {
        path: 'reports/customer-ledger',
        component: CustomerLedger,
      },
      {
        path: 'reports/supplier-ledger',
        component: SupplierLedger,
      },
      {
        path: 'reports/outstanding-invoices',
        component: OutstandingInvoices,
      },
      {
        path: 'reports/outstanding-bills',
        component: OutstandingBills,
      },
      {
        path: 'reports/bank-book',
        component: BankBook,
      },
      {
        path: 'reports/bank-reconciliation',
        component: BankReconciliation,
      },
      {
        path: 'reports/log-reports',
        component: LogReports,
      },
      {
        path: 'setting/company-setting',
        component: CompanySetting,
      },
      {
        path: 'reports/expense-register',
        component: ExpenseRegister,
      },
      {
        path:'reports/ledger-report',
        component: LedgerReport,
      },
      {
        path:'reports/party-wise-bills',
        component: PartyWiseBill,
      },
      {
        path:'reports/payment-register',
        component: PaymentRegister,
      },
    ],
  },
  {
    path:'reports/report-list',
    loadComponent: () =>
      import('./Reports/report-list/report-list').then(m => m.ReportList)
  },
  {
    path:'ledgers/create-ledger',
    loadComponent: () =>
      import('./Ledgers/cerate-ledger/cerate-ledger').then(m => m.CerateLedger)
  },
  {
    path:'ledgers/ledger-list',
    loadComponent: () =>
      import('./Ledgers/ledger-list/ledger-list').then(m => m.LedgerList)
  },
  {
    path:'expense/expense-list',
    loadComponent: () =>
      import('./Expense/expense-list/expense-list').then(m => m.ExpenseList)
  },
  {
    path:'items/item-master',
    loadComponent: () =>
      import('./items/item-master/item-master').then(m => m.ItemMaster)
  },
  {
    path:'invoices/inv-template',
    loadComponent: () =>
      import('./Invoices/inv-template/inv-template').then(m => m.InvTemplate)
  },
  {
    path:'invoices/inv-template-pur',
    loadComponent:() =>
      import('./Invoices/inv-template-pur/inv-template-pur').then(m=>m.InvTemplatePur)
  },
  {
    path:'jv/jv-list',
    loadComponent: () =>
      import('./jv/jv-list/jv-list').then(m => m.JvList)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeaturesRoutingModule { }

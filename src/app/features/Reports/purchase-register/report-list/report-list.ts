import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

interface Report {
  name: string;
  description: string;
  routerLink: string;
  category: string;
  queryParams?: { [key: string]: any };
}

@Component({
  selector: 'app-report-list',
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './report-list.html',
  styleUrl: './report-list.scss'
})
export class ReportList {
  categories = [
    'All Reports',
    'Sales',
    'Purchase',
    'Ledgers',
    'VAT Reports (UAE)'
  ];

  reports: Report[] = [
    // sales
    { name: 'Sales Register', description: 'Sales invoices register', routerLink: '/reports/sales-register', category: 'Sales', queryParams: { type: 'sales' } },
    { name: 'Sales Return', description: 'Sales return register', routerLink: '/reports/sales-register', category: 'Sales', queryParams: { type: 'sales-return' } },
    { name: 'Purchase Register', description: 'Purchase bills register', routerLink: '/reports/purchase-register', category: 'Purchase', queryParams: { type: 'purchase' } },
    { name: 'Purchase Return', description: 'Purchase return register', routerLink: '/reports/purchase-register', category: 'Purchase', queryParams: { type: 'purchase-return' } },
    { name: 'Proforma Register', description: 'Proforma invoices register', routerLink: '/reports/sales-register', category: 'Sales', queryParams: { type: 'proforma' } },
    { name: 'Quotation Register', description: 'Quotation register', routerLink: '/reports/sales-register', category: 'Sales', queryParams: { type: 'quotation' } },
    { name: 'Delivery Challan Register', description: 'Delivery challan register', routerLink: '/reports/sales-register', category: 'Sales', queryParams: { type: 'delivery-challan' } },
    { name: 'Journal Voucher', description: 'Journal voucher list', routerLink: '/jv/jv-list', category: 'Sales' },
    { name: 'Payment Register', description: 'Payment entries (in/out)', routerLink: '/reports/payment-register', category: 'Sales' },
    { name: 'Expense Report', description: 'Expense entries list', routerLink: '/reports/expense-register', category: 'Sales' },
    { name: 'Party-wise Bills', description: 'Outstanding bills by party', routerLink: '/reports/party-wise-bills', category: 'Sales' },
    // Ledgers
    { name: 'Ledger Report', description: 'General ledger', routerLink: '/reports/ledger-report', category: 'Ledgers' },
    // VAT Reports (UAE)
    // { name: 'VAT Summary Report', description: 'Summary of VAT collected and paid', routerLink: '/reports/vat-report', category: 'VAT Reports (UAE)' },
    { name: 'VAT Detailed Report', description: 'Detailed VAT transactions', routerLink: '/reports/vat-detailed-report', category: 'VAT Reports (UAE)' },
    // { name: 'Reverse Charge Report', description: 'Reverse charge VAT transactions', routerLink: '/reports/reverse-charge-report', category: 'VAT Reports (UAE)' },
    // { name: 'Zero-rated & Exempt Supplies', description: 'Zero-rated and exempt transactions', routerLink: '/reports/zero-rated-exempt-report', category: 'VAT Reports (UAE)' },
    // { name: 'FAF Report (VAT Audit)', description: 'VAT Audit File (FAF)', routerLink: '/reports/faf-report', category: 'VAT Reports (UAE)' },
    // { name: 'VAT Return', description: 'VAT return summary', routerLink: '/reports/vat-return', category: 'VAT Reports (UAE)' },
  ];

  activeCategory = 'All Reports';
  searchTerm = '';

  setCategory(category: string) {
    this.activeCategory = category;
  }

  setSearchTerm(term: string) {
    this.searchTerm = term;
  }

  get filteredReports(): Report[] {
    let filtered = this.reports;
    if (this.activeCategory && this.activeCategory !== 'All Reports') {
      filtered = filtered.filter(r => r.category === this.activeCategory);
    }
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
      );
    }
    return filtered;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OutstandingInvoice {
  invoice_no: string;
  customer_name: string;
  customer_trn: string;
  invoice_date: string;
  due_date: string;
  amount_excl_vat: number;
  vat_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  days_overdue: number;
  status: 'Overdue' | 'Due Soon' | 'Current';
}

@Component({
  selector: 'app-outstanding-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './outstanding-invoices.html',
  styleUrls: ['./outstanding-invoices.scss']
})
export class OutstandingInvoices implements OnInit {
  invoices: OutstandingInvoice[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  searchTerm: string = '';
  selectedStatus: string = 'All';

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateData();
  }

  generateData() {
    // Mock data - to be replaced by API call
    this.invoices = [
      {
        invoice_no: 'INV-001',
        customer_name: 'ABC Trading LLC',
        customer_trn: '123456789012345',
        invoice_date: '2024-01-15',
        due_date: '2024-02-15',
        amount_excl_vat: 50000,
        vat_amount: 2500,
        total_amount: 52500,
        paid_amount: 0,
        outstanding_amount: 52500,
        days_overdue: 15,
        status: 'Overdue'
      },
      {
        invoice_no: 'INV-002',
        customer_name: 'XYZ Services FZE',
        customer_trn: '987654321098765',
        invoice_date: '2024-01-20',
        due_date: '2024-02-20',
        amount_excl_vat: 30000,
        vat_amount: 1500,
        total_amount: 31500,
        paid_amount: 10000,
        outstanding_amount: 21500,
        days_overdue: 5,
        status: 'Overdue'
      },
      {
        invoice_no: 'INV-003',
        customer_name: 'Global Imports Ltd',
        customer_trn: '456789123456789',
        invoice_date: '2024-02-01',
        due_date: '2024-03-01',
        amount_excl_vat: 75000,
        vat_amount: 3750,
        total_amount: 78750,
        paid_amount: 0,
        outstanding_amount: 78750,
        days_overdue: 0,
        status: 'Current'
      },
      {
        invoice_no: 'INV-004',
        customer_name: 'International Consultants',
        customer_trn: '789123456789123',
        invoice_date: '2024-02-05',
        due_date: '2024-03-05',
        amount_excl_vat: 25000,
        vat_amount: 1250,
        total_amount: 26250,
        paid_amount: 0,
        outstanding_amount: 26250,
        days_overdue: -5,
        status: 'Due Soon'
      }
    ];
  }

  filterInvoices() {
    let filtered = this.invoices;
    
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(invoice => invoice.status === this.selectedStatus);
    }
    
    if (this.searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_no.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        invoice.customer_trn.includes(this.searchTerm)
      );
    }
    
    return filtered;
  }

  getStatuses(): string[] {
    return ['All', ...new Set(this.invoices.map(invoice => invoice.status))];
  }

  calculateTotals() {
    const filteredInvoices = this.filterInvoices();
    return {
      total_invoices: filteredInvoices.length,
      total_outstanding: filteredInvoices.reduce((sum, invoice) => sum + invoice.outstanding_amount, 0),
      overdue_amount: filteredInvoices
        .filter(invoice => invoice.status === 'Overdue')
        .reduce((sum, invoice) => sum + invoice.outstanding_amount, 0),
      due_soon_amount: filteredInvoices
        .filter(invoice => invoice.status === 'Due Soon')
        .reduce((sum, invoice) => sum + invoice.outstanding_amount, 0)
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Overdue': return 'bg-danger text-white';
      case 'Due Soon': return 'bg-warning text-dark';
      case 'Current': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  }
} 
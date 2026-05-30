import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CustomerTransaction {
  date: string;
  invoice_no: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'Invoice' | 'Payment' | 'Credit Note' | 'Adjustment';
}

interface Customer {
  id: string;
  name: string;
  trn: string;
  email: string;
  phone: string;
  opening_balance: number;
  transactions: CustomerTransaction[];
  current_balance: number;
}

@Component({
  selector: 'app-customer-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-ledger.html',
  styleUrls: ['./customer-ledger.scss']
})
export class CustomerLedger implements OnInit {
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  dateFrom: string = '';
  dateTo: string = '';
  searchTerm: string = '';

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateData();
  }

  generateData() {
    // Mock data - to be replaced by API call
    this.customers = [
      {
        id: 'CUST001',
        name: 'ABC Trading LLC',
        trn: '100123456700001',
        email: 'accounts@abctrading.ae',
        phone: '+971-50-123-4567',
        opening_balance: 5000,
        transactions: [
          { date: '2024-06-01', invoice_no: 'INV-2024-001', description: 'Sale of Electronics', debit: 12000, credit: 0, balance: 17000, type: 'Invoice' },
          { date: '2024-06-05', invoice_no: 'INV-2024-002', description: 'Sale of Office Supplies', debit: 8500, credit: 0, balance: 25500, type: 'Invoice' },
          { date: '2024-06-10', invoice_no: 'PAY-2024-001', description: 'Payment Received', debit: 0, credit: 15000, balance: 10500, type: 'Payment' },
          { date: '2024-06-15', invoice_no: 'CN-2024-001', description: 'Credit Note - Return', debit: 0, credit: 2500, balance: 8000, type: 'Credit Note' }
        ],
        current_balance: 8000
      },
      {
        id: 'CUST002',
        name: 'XYZ Enterprises',
        trn: '100123456700002',
        email: 'finance@xyzenterprises.ae',
        phone: '+971-50-987-6543',
        opening_balance: 0,
        transactions: [
          { date: '2024-06-02', invoice_no: 'INV-2024-003', description: 'Consulting Services', debit: 25000, credit: 0, balance: 25000, type: 'Invoice' },
          { date: '2024-06-12', invoice_no: 'PAY-2024-002', description: 'Partial Payment', debit: 0, credit: 15000, balance: 10000, type: 'Payment' }
        ],
        current_balance: 10000
      },
      {
        id: 'CUST003',
        name: 'Global Corp',
        trn: '100123456700003',
        email: 'accounts@globalcorp.ae',
        phone: '+971-50-555-1234',
        opening_balance: 12000,
        transactions: [
          { date: '2024-06-03', invoice_no: 'INV-2024-004', description: 'Software License', debit: 18000, credit: 0, balance: 30000, type: 'Invoice' },
          { date: '2024-06-08', invoice_no: 'PAY-2024-003', description: 'Full Payment', debit: 0, credit: 30000, balance: 0, type: 'Payment' }
        ],
        current_balance: 0
      }
    ];
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'Invoice': return 'text-danger';
      case 'Payment': return 'text-success';
      case 'Credit Note': return 'text-warning';
      case 'Adjustment': return 'text-info';
      default: return 'text-muted';
    }
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'text-danger';
    if (balance < 0) return 'text-success';
    return 'text-muted';
  }

  filterCustomers() {
    if (!this.searchTerm) return this.customers;
    
    return this.customers.filter(customer => 
      customer.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      customer.trn.includes(this.searchTerm) ||
      customer.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
} 
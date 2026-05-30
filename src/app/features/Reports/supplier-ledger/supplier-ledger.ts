import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SupplierTransaction {
  date: string;
  invoice_no: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: 'Bill' | 'Payment' | 'Debit Note' | 'Adjustment';
}

interface Supplier {
  id: string;
  name: string;
  trn: string;
  email: string;
  phone: string;
  opening_balance: number;
  transactions: SupplierTransaction[];
  current_balance: number;
}

@Component({
  selector: 'app-supplier-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-ledger.html',
  styleUrls: ['./supplier-ledger.scss']
})
export class SupplierLedger implements OnInit {
  suppliers: Supplier[] = [];
  selectedSupplier: Supplier | null = null;
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
    this.suppliers = [
      {
        id: 'SUPP001',
        name: 'Main Supplier Ltd',
        trn: '100123456700004',
        email: 'accounts@mainsupplier.ae',
        phone: '+971-50-111-2222',
        opening_balance: 15000,
        transactions: [
          { date: '2024-06-01', invoice_no: 'BILL-2024-001', description: 'Office Supplies', debit: 0, credit: 25000, balance: 40000, type: 'Bill' },
          { date: '2024-06-05', invoice_no: 'BILL-2024-002', description: 'Equipment Purchase', debit: 0, credit: 45000, balance: 85000, type: 'Bill' },
          { date: '2024-06-10', invoice_no: 'PAY-2024-001', description: 'Payment Made', debit: 50000, credit: 0, balance: 35000, type: 'Payment' },
          { date: '2024-06-15', invoice_no: 'DN-2024-001', description: 'Debit Note - Return', debit: 5000, credit: 0, balance: 30000, type: 'Debit Note' }
        ],
        current_balance: 30000
      },
      {
        id: 'SUPP002',
        name: 'Tech Imports',
        trn: '100123456700005',
        email: 'finance@techimports.ae',
        phone: '+971-50-333-4444',
        opening_balance: 0,
        transactions: [
          { date: '2024-06-02', invoice_no: 'BILL-2024-003', description: 'Software Licenses', debit: 0, credit: 35000, balance: 35000, type: 'Bill' },
          { date: '2024-06-12', invoice_no: 'PAY-2024-002', description: 'Full Payment', debit: 35000, credit: 0, balance: 0, type: 'Payment' }
        ],
        current_balance: 0
      },
      {
        id: 'SUPP003',
        name: 'Office Supplies Co.',
        trn: '100123456700006',
        email: 'orders@officesupplies.ae',
        phone: '+971-50-555-6666',
        opening_balance: 8000,
        transactions: [
          { date: '2024-06-03', invoice_no: 'BILL-2024-004', description: 'Stationery Items', debit: 0, credit: 12000, balance: 20000, type: 'Bill' },
          { date: '2024-06-08', invoice_no: 'PAY-2024-003', description: 'Partial Payment', debit: 15000, credit: 0, balance: 5000, type: 'Payment' }
        ],
        current_balance: 5000
      }
    ];
  }

  selectSupplier(supplier: Supplier) {
    this.selectedSupplier = supplier;
  }

  getTransactionTypeClass(type: string): string {
    switch (type) {
      case 'Bill': return 'text-danger';
      case 'Payment': return 'text-success';
      case 'Debit Note': return 'text-warning';
      case 'Adjustment': return 'text-info';
      default: return 'text-muted';
    }
  }

  getBalanceClass(balance: number): string {
    if (balance > 0) return 'text-danger';
    if (balance < 0) return 'text-success';
    return 'text-muted';
  }

  filterSuppliers() {
    if (!this.searchTerm) return this.suppliers;
    
    return this.suppliers.filter(supplier => 
      supplier.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      supplier.trn.includes(this.searchTerm) ||
      supplier.email.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
} 
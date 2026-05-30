import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ReverseChargeTransaction {
  date: string;
  invoice_no: string;
  supplier_name: string;
  supplier_trn: string;
  description: string;
  amount_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  reverse_charge_vat: number;
  net_amount: number;
}

@Component({
  selector: 'app-reverse-charge-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reverse-charge-report.html',
  styleUrls: ['./reverse-charge-report.scss']
})
export class ReverseChargeReport implements OnInit {
  transactions: ReverseChargeTransaction[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  searchTerm: string = '';
  selectedVatRate: string = 'All';

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateData();
  }

  generateData() {
    // Mock data - to be replaced by API call
    this.transactions = [
      {
        date: '2024-01-15',
        invoice_no: 'INV-001',
        supplier_name: 'ABC Trading LLC',
        supplier_trn: '123456789012345',
        description: 'Import of electronic components',
        amount_excl_vat: 50000,
        vat_rate: 5,
        vat_amount: 2500,
        total_amount: 52500,
        reverse_charge_vat: 2500,
        net_amount: 50000
      },
      {
        date: '2024-01-20',
        invoice_no: 'INV-002',
        supplier_name: 'XYZ Services FZE',
        supplier_trn: '987654321098765',
        description: 'Professional services from outside UAE',
        amount_excl_vat: 30000,
        vat_rate: 5,
        vat_amount: 1500,
        total_amount: 31500,
        reverse_charge_vat: 1500,
        net_amount: 30000
      },
      {
        date: '2024-02-05',
        invoice_no: 'INV-003',
        supplier_name: 'Global Imports Ltd',
        supplier_trn: '456789123456789',
        description: 'Import of machinery parts',
        amount_excl_vat: 75000,
        vat_rate: 5,
        vat_amount: 3750,
        total_amount: 78750,
        reverse_charge_vat: 3750,
        net_amount: 75000
      },
      {
        date: '2024-02-10',
        invoice_no: 'INV-004',
        supplier_name: 'International Consultants',
        supplier_trn: '789123456789123',
        description: 'Consulting services from abroad',
        amount_excl_vat: 25000,
        vat_rate: 5,
        vat_amount: 1250,
        total_amount: 26250,
        reverse_charge_vat: 1250,
        net_amount: 25000
      }
    ];
  }

  filterTransactions() {
    let filtered = this.transactions;
    
    if (this.selectedVatRate !== 'All') {
      const rate = parseFloat(this.selectedVatRate);
      filtered = filtered.filter(transaction => transaction.vat_rate === rate);
    }
    
    if (this.searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.invoice_no.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transaction.supplier_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transaction.supplier_trn.includes(this.searchTerm)
      );
    }
    
    return filtered;
  }

  getVatRates(): number[] {
    return [...new Set(this.transactions.map(t => t.vat_rate))];
  }

  calculateTotals() {
    const filteredTransactions = this.filterTransactions();
    return {
      total_transactions: filteredTransactions.length,
      total_amount_excl_vat: filteredTransactions.reduce((sum, t) => sum + t.amount_excl_vat, 0),
      total_vat_amount: filteredTransactions.reduce((sum, t) => sum + t.vat_amount, 0),
      total_reverse_charge_vat: filteredTransactions.reduce((sum, t) => sum + t.reverse_charge_vat, 0),
      total_net_amount: filteredTransactions.reduce((sum, t) => sum + t.net_amount, 0)
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB');
  }
} 
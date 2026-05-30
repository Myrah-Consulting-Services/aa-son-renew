import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ZeroRatedExemptTransaction {
  date: string;
  invoice_no: string;
  customer_name: string;
  customer_trn: string;
  description: string;
  supply_type: 'Zero-rated' | 'Exempt';
  amount_excl_vat: number;
  vat_rate: number;
  vat_amount: number;
  total_amount: number;
  reason_code: string;
  reason_description: string;
}

@Component({
  selector: 'app-zero-rated-exempt-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './zero-rated-exempt-report.html',
  styleUrls: ['./zero-rated-exempt-report.scss']
})
export class ZeroRatedExemptReport implements OnInit {
  transactions: ZeroRatedExemptTransaction[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  searchTerm: string = '';
  selectedSupplyType: string = 'All';

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
        customer_name: 'Dubai Hospital',
        customer_trn: '123456789012345',
        description: 'Medical equipment and supplies',
        supply_type: 'Zero-rated',
        amount_excl_vat: 25000,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: 25000,
        reason_code: 'ZR001',
        reason_description: 'Export of goods'
      },
      {
        date: '2024-01-20',
        invoice_no: 'INV-002',
        customer_name: 'Abu Dhabi School',
        customer_trn: '987654321098765',
        description: 'Educational books and materials',
        supply_type: 'Zero-rated',
        amount_excl_vat: 15000,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: 15000,
        reason_code: 'ZR002',
        reason_description: 'Educational services'
      },
      {
        date: '2024-02-05',
        invoice_no: 'INV-003',
        customer_name: 'Local Bank',
        customer_trn: '456789123456789',
        description: 'Financial services',
        supply_type: 'Exempt',
        amount_excl_vat: 50000,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: 50000,
        reason_code: 'EX001',
        reason_description: 'Financial services'
      },
      {
        date: '2024-02-10',
        invoice_no: 'INV-004',
        customer_name: 'Residential Complex',
        customer_trn: '789123456789123',
        description: 'Residential property rent',
        supply_type: 'Exempt',
        amount_excl_vat: 30000,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: 30000,
        reason_code: 'EX002',
        reason_description: 'Residential property'
      },
      {
        date: '2024-02-15',
        invoice_no: 'INV-005',
        customer_name: 'International Trading Co',
        customer_trn: '321654987321654',
        description: 'Export of electronics',
        supply_type: 'Zero-rated',
        amount_excl_vat: 75000,
        vat_rate: 0,
        vat_amount: 0,
        total_amount: 75000,
        reason_code: 'ZR003',
        reason_description: 'Export of goods'
      }
    ];
  }

  filterTransactions() {
    let filtered = this.transactions;
    
    if (this.selectedSupplyType !== 'All') {
      filtered = filtered.filter(transaction => transaction.supply_type === this.selectedSupplyType);
    }
    
    if (this.searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.invoice_no.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transaction.customer_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        transaction.customer_trn.includes(this.searchTerm) ||
        transaction.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }

  getSupplyTypes(): string[] {
    return ['All', ...new Set(this.transactions.map(t => t.supply_type))];
  }

  calculateTotals() {
    const filteredTransactions = this.filterTransactions();
    const zeroRated = filteredTransactions.filter(t => t.supply_type === 'Zero-rated');
    const exempt = filteredTransactions.filter(t => t.supply_type === 'Exempt');
    
    return {
      total_transactions: filteredTransactions.length,
      zero_rated_transactions: zeroRated.length,
      exempt_transactions: exempt.length,
      total_zero_rated_amount: zeroRated.reduce((sum, t) => sum + t.amount_excl_vat, 0),
      total_exempt_amount: exempt.reduce((sum, t) => sum + t.amount_excl_vat, 0),
      total_amount: filteredTransactions.reduce((sum, t) => sum + t.amount_excl_vat, 0)
    };
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-GB');
  }

  getSupplyTypeClass(supplyType: string): string {
    return supplyType === 'Zero-rated' ? 'text-success' : 'text-info';
  }

  getSupplyTypeBadgeClass(supplyType: string): string {
    return supplyType === 'Zero-rated' ? 'bg-success text-white' : 'bg-info text-white';
  }
} 
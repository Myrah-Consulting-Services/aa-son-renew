import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Represents a single line in a FAF file
interface FafTransaction {
  transaction_date: string;
  transaction_type: 'Sale' | 'Purchase';
  invoice_no: string;
  party_name: string;
  party_trn: string;
  description: string;
  taxable_amount: number;
  vat_category: 'Standard' | 'Zero-Rated' | 'Exempt';
  vat_rate: number;
  vat_amount: number;
}

@Component({
  selector: 'app-faf-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faf-report.html',
  styleUrls: ['./faf-report.scss']
})
export class FafReport implements OnInit {
  dateFrom: string = '';
  dateTo: string = '';
  transactions: FafTransaction[] = [];

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
  }

  fetchTransactions() {
    // This will be replaced by an API call to get all transactions
    this.transactions = [
      { transaction_date: '2024-06-05', transaction_type: 'Sale', invoice_no: 'INV-S-001', party_name: 'Customer A', party_trn: '100123456700001', description: 'Standard rated sale', taxable_amount: 10000, vat_category: 'Standard', vat_rate: 5, vat_amount: 500 },
      { transaction_date: '2024-06-08', transaction_type: 'Purchase', invoice_no: 'INV-P-001', party_name: 'Vendor X', party_trn: '100123456700002', description: 'Standard rated purchase', taxable_amount: 20000, vat_category: 'Standard', vat_rate: 5, vat_amount: 1000 },
      { transaction_date: '2024-06-12', transaction_type: 'Sale', invoice_no: 'INV-S-002', party_name: 'Customer B', party_trn: '100123456700003', description: 'Zero-rated export', taxable_amount: 15000, vat_category: 'Zero-Rated', vat_rate: 0, vat_amount: 0 }
    ];
  }

  generateFafFile() {
    this.fetchTransactions();
    
    let csvContent = "data:text/csv;charset=utf-8,";
    const header = Object.keys(this.transactions[0]).join(',');
    csvContent += header + "\r\n";

    this.transactions.forEach(row => {
      const rowData = Object.values(row).join(',');
      csvContent += rowData + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "VAT_Audit_File.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
} 
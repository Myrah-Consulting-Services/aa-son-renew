import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BankBookTransaction {
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
}

interface BankBookAccount {
  id: string;
  name: string;
  account_number: string;
  bank_name: string;
  opening_balance: number;
  transactions: BankBookTransaction[];
}

@Component({
  selector: 'app-bank-book',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-book.html',
  styleUrls: ['./bank-book.scss']
})
export class BankBook implements OnInit {
  accounts: BankBookAccount[] = [];
  selectedAccount: BankBookAccount | null = null;
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
    this.accounts = [
      {
        id: 'BANK001',
        name: 'Main Business Account',
        account_number: '1234567890',
        bank_name: 'Emirates NBD',
        opening_balance: 50000,
        transactions: [
          { date: '2024-06-01', description: 'Opening Balance', reference: '-', debit: 0, credit: 0, balance: 50000 },
          { date: '2024-06-02', description: 'Payment from ABC Trading', reference: 'INV-2024-001', debit: 0, credit: 12000, balance: 62000 },
          { date: '2024-06-03', description: 'Office Supplies Payment', reference: 'BILL-2024-001', debit: 5000, credit: 0, balance: 57000 },
          { date: '2024-06-05', description: 'Payment from XYZ Enterprises', reference: 'INV-2024-003', debit: 0, credit: 25000, balance: 82000 },
          { date: '2024-06-08', description: 'Equipment Purchase', reference: 'BILL-2024-002', debit: 15000, credit: 0, balance: 67000 },
          { date: '2024-06-10', description: 'Bank Charges', reference: 'BANK-CHG-001', debit: 100, credit: 0, balance: 66900 }
        ]
      },
      {
        id: 'BANK002',
        name: 'Savings Account',
        account_number: '0987654321',
        bank_name: 'Abu Dhabi Commercial Bank',
        opening_balance: 100000,
        transactions: [
          { date: '2024-06-01', description: 'Opening Balance', reference: '-', debit: 0, credit: 0, balance: 100000 },
          { date: '2024-06-01', description: 'Interest Earned', reference: 'INT-2024-001', debit: 0, credit: 5000, balance: 105000 }
        ]
      }
    ];
  }

  selectAccount(account: BankBookAccount | null) {
    this.selectedAccount = account;
  }

  filterTransactions() {
    if (!this.selectedAccount) return [];
    if (!this.searchTerm) return this.selectedAccount.transactions;
    return this.selectedAccount.transactions.filter(txn =>
      txn.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      txn.reference.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
} 
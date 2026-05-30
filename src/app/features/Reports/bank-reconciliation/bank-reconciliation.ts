import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BankTransaction {
  date: string;
  description: string;
  reference: string;
  amount: number;
  type: 'Credit' | 'Debit';
  is_reconciled: boolean;
  bank_statement_ref?: string;
}

interface BankAccount {
  id: string;
  name: string;
  account_number: string;
  bank_name: string;
  opening_balance: number;
  closing_balance: number;
  transactions: BankTransaction[];
}

@Component({
  selector: 'app-bank-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-reconciliation.html',
  styleUrls: ['./bank-reconciliation.scss']
})
export class BankReconciliation implements OnInit {
  bankAccounts: BankAccount[] = [];
  selectedAccount: BankAccount | null = null;
  reconciliationDate: string = '';
  searchTerm: string = '';

  ngOnInit() {
    this.reconciliationDate = new Date().toISOString().split('T')[0];
    this.generateData();
  }

  generateData() {
    // Mock data - to be replaced by API call
    this.bankAccounts = [
      {
        id: 'BANK001',
        name: 'Main Business Account',
        account_number: '1234567890',
        bank_name: 'Emirates NBD',
        opening_balance: 50000,
        closing_balance: 75000,
        transactions: [
          {
            date: '2024-06-01',
            description: 'Payment from ABC Trading',
            reference: 'INV-2024-001',
            amount: 12000,
            type: 'Credit',
            is_reconciled: true,
            bank_statement_ref: 'STMT-001'
          },
          {
            date: '2024-06-02',
            description: 'Office Supplies Payment',
            reference: 'BILL-2024-001',
            amount: 5000,
            type: 'Debit',
            is_reconciled: true,
            bank_statement_ref: 'STMT-002'
          },
          {
            date: '2024-06-05',
            description: 'Payment from XYZ Enterprises',
            reference: 'INV-2024-003',
            amount: 25000,
            type: 'Credit',
            is_reconciled: false
          },
          {
            date: '2024-06-08',
            description: 'Equipment Purchase',
            reference: 'BILL-2024-002',
            amount: 15000,
            type: 'Debit',
            is_reconciled: false
          },
          {
            date: '2024-06-10',
            description: 'Bank Charges',
            reference: 'BANK-CHG-001',
            amount: 100,
            type: 'Debit',
            is_reconciled: false
          }
        ]
      },
      {
        id: 'BANK002',
        name: 'Savings Account',
        account_number: '0987654321',
        bank_name: 'Abu Dhabi Commercial Bank',
        opening_balance: 100000,
        closing_balance: 105000,
        transactions: [
          {
            date: '2024-06-01',
            description: 'Interest Earned',
            reference: 'INT-2024-001',
            amount: 5000,
            type: 'Credit',
            is_reconciled: true,
            bank_statement_ref: 'STMT-003'
          }
        ]
      }
    ];
  }

  selectAccount(account: BankAccount) {
    this.selectedAccount = account;
  }

  getTransactionTypeClass(type: string): string {
    return type === 'Credit' ? 'text-success' : 'text-danger';
  }

  getReconciliationClass(isReconciled: boolean): string {
    return isReconciled ? 'bg-success text-white' : 'bg-warning text-dark';
  }

  calculateTotals() {
    if (!this.selectedAccount) return { total_credits: 0, total_debits: 0, reconciled_credits: 0, reconciled_debits: 0 };

    const totals = {
      total_credits: 0,
      total_debits: 0,
      reconciled_credits: 0,
      reconciled_debits: 0
    };

    this.selectedAccount.transactions.forEach(transaction => {
      if (transaction.type === 'Credit') {
        totals.total_credits += transaction.amount;
        if (transaction.is_reconciled) totals.reconciled_credits += transaction.amount;
      } else {
        totals.total_debits += transaction.amount;
        if (transaction.is_reconciled) totals.reconciled_debits += transaction.amount;
      }
    });

    return totals;
  }

  filterTransactions() {
    if (!this.selectedAccount || !this.searchTerm) return this.selectedAccount?.transactions || [];
    
    return this.selectedAccount.transactions.filter(transaction => 
      transaction.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      transaction.bank_statement_ref?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  markAsReconciled(transaction: BankTransaction) {
    transaction.is_reconciled = !transaction.is_reconciled;
  }
} 
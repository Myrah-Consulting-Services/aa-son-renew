import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface OutstandingBill {
  bill_no: string;
  bill_date: string;
  due_date: string;
  supplier_name: string;
  total_amount: number;
  amount_due: number;
  status: 'Unpaid' | 'Partial';
  days_overdue: number;
}

@Component({
  selector: 'app-outstanding-bills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './outstanding-bills.html',
  styleUrls: ['./outstanding-bills.scss']
})
export class OutstandingBills implements OnInit {
  bills: OutstandingBill[] = [];
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
    this.bills = [
      {
        bill_no: 'BILL-2024-001',
        bill_date: '2024-05-18',
        due_date: '2024-06-05',
        supplier_name: 'Main Supplier Ltd',
        total_amount: 25000,
        amount_due: 25000,
        status: 'Unpaid',
        days_overdue: 10
      },
      {
        bill_no: 'BILL-2024-002',
        bill_date: '2024-05-28',
        due_date: '2024-06-12',
        supplier_name: 'Tech Imports',
        total_amount: 18000,
        amount_due: 8000,
        status: 'Partial',
        days_overdue: 3
      },
      {
        bill_no: 'BILL-2024-003',
        bill_date: '2024-06-02',
        due_date: '2024-06-20',
        supplier_name: 'Office Supplies Co.',
        total_amount: 12000,
        amount_due: 12000,
        status: 'Unpaid',
        days_overdue: 0
      }
    ];
  }

  filterBills() {
    if (!this.searchTerm) return this.bills;
    return this.bills.filter(bill =>
      bill.bill_no.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      bill.supplier_name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }
} 
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface AgingDetail {
  party_name: string;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  above_90: number;
  total_due: number;
}

@Component({
  selector: 'app-ap-aging-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ap-aging-report.html',
  styleUrls: ['./ap-aging-report.scss']
})
export class AccountsPayableAging implements OnInit {
  reportData: AgingDetail[] = [];
  reportDate: string = '';
  totals: any = {};

  ngOnInit() {
    this.reportDate = new Date().toISOString().split('T')[0];
    this.generateReport();
  }

  generateReport() {
    // Mock data - to be replaced by API call
    this.reportData = [
      { party_name: 'Main Supplier Ltd', current: 15000, days_1_30: 0, days_31_60: 0, days_61_90: 0, above_90: 0, total_due: 15000 },
      { party_name: 'Office Supplies Co.', current: 0, days_1_30: 1200, days_31_60: 800, days_61_90: 0, above_90: 0, total_due: 2000 },
      { party_name: 'Tech Imports', current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 7500, above_90: 2500, total_due: 10000 }
    ];
    this.calculateTotals();
  }
  
  calculateTotals() {
    this.totals = {
      current: this.reportData.reduce((sum, item) => sum + item.current, 0),
      days_1_30: this.reportData.reduce((sum, item) => sum + item.days_1_30, 0),
      days_31_60: this.reportData.reduce((sum, item) => sum + item.days_31_60, 0),
      days_61_90: this.reportData.reduce((sum, item) => sum + item.days_61_90, 0),
      above_90: this.reportData.reduce((sum, item) => sum + item.above_90, 0),
      total_due: this.reportData.reduce((sum, item) => sum + item.total_due, 0)
    };
  }
} 
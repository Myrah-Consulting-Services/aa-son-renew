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
  selector: 'app-ar-aging-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ar-aging-report.html',
  styleUrls: ['./ar-aging-report.scss']
})
export class AccountsReceivableAging implements OnInit {
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
      { party_name: 'ABC Trading', current: 5000, days_1_30: 2500, days_31_60: 0, days_61_90: 0, above_90: 0, total_due: 7500 },
      { party_name: 'XYZ Enterprises', current: 0, days_1_30: 0, days_31_60: 3000, days_61_90: 1500, above_90: 0, total_due: 4500 },
      { party_name: 'Global Corp', current: 12000, days_1_30: 0, days_31_60: 0, days_61_90: 0, above_90: 5000, total_due: 17000 }
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
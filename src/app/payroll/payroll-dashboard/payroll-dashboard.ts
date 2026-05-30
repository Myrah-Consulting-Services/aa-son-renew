import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddEmployeeComponent } from '../add-employee/add-employee';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-payroll-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, AddEmployeeComponent],
  templateUrl: './payroll-dashboard.html',
  styleUrl: './payroll-dashboard.scss'
})
export class PayrollDashboard {
  steps = [
    { key: 'org', label: 'Organization Details', mandatory: true, completed: true },
    { key: 'paySchedule', label: 'Configure your pay schedule', mandatory: true, completed: false },
    { key: 'social', label: 'Set up Social Security Benefits', mandatory: true, completed: false },
    { key: 'salary', label: 'Set up Salary Components', mandatory: true, completed: false },
    { key: 'employees', label: 'Add Employees', mandatory: true, completed: false },
    { key: 'prior', label: 'Configure Prior Payroll', mandatory: false, completed: true },
    { key: 'books', label: 'Connect with Accounting', mandatory: false, completed: true }
  ];

  // Payroll trend data (last 6 months)
  payrollTrend = [
    { month: 'Jan', amount: 2.1 },
    { month: 'Feb', amount: 2.2 },
    { month: 'Mar', amount: 2.3 },
    { month: 'Apr', amount: 2.25 },
    { month: 'May', amount: 2.35 },
    { month: 'Jun', amount: 2.4 }
  ];

  // Attendance data (last 7 days)
  attendanceData = [
    { day: 'Mon', rate: 92 },
    { day: 'Tue', rate: 95 },
    { day: 'Wed', rate: 94 },
    { day: 'Thu', rate: 96 },
    { day: 'Fri', rate: 93 },
    { day: 'Sat', rate: 88 },
    { day: 'Sun', rate: 85 }
  ];

  // Leave balance summary
  leaveSummary = [
    { type: 'Annual Leave', used: 45, total: 120, color: '#059669' },
    { type: 'Sick Leave', used: 12, total: 60, color: '#dc2626' },
    { type: 'Casual Leave', used: 8, total: 35, color: '#41299b' }
  ];

  // Recent pay runs
  // Keep amount numeric, currency is rendered via getcurrency() in the template
  recentPayRuns = [
    { id: 'PR-2024-06', period: 'June 2024', employees: 156, amount: 2.4, status: 'Completed', date: '2024-06-30' },
    { id: 'PR-2024-05', period: 'May 2024', employees: 154, amount: 2.35, status: 'Completed', date: '2024-05-31' },
    { id: 'PR-2024-04', period: 'April 2024', employees: 152, amount: 2.25, status: 'Completed', date: '2024-04-30' }
  ];

  // Upcoming pay schedules
  upcomingSchedules = [
    { schedule: 'Monthly', nextRun: '2024-07-31', employees: 156 },
    { schedule: 'Bi-weekly', nextRun: '2024-07-15', employees: 45 },
    { schedule: 'Weekly', nextRun: '2024-07-08', employees: 12 }
  ];

  // Department breakdown
  // Keep payroll numeric (in K), currency is rendered via getcurrency() in the template
  departmentBreakdown = [
    { dept: 'Engineering', employees: 45, payrollK: 720, percentage: 30 },
    { dept: 'Sales', employees: 32, payrollK: 480, percentage: 20 },
    { dept: 'HR', employees: 18, payrollK: 360, percentage: 15 },
    { dept: 'Finance', employees: 25, payrollK: 420, percentage: 17.5 },
    { dept: 'Operations', employees: 36, payrollK: 420, percentage: 17.5 }
  ];

  // Active loans
  // Keep amounts numeric, currency is rendered via getcurrency() in the template
  activeLoans = [
    { employee: 'John Doe', amount: 5000, remaining: 3200, installments: '8/12' },
    { employee: 'Jane Smith', amount: 8000, remaining: 2000, installments: '10/12' },
    { employee: 'Mike Johnson', amount: 3500, remaining: 1750, installments: '6/12' }
  ];

  constructor(private api: Api) {}

  getcurrency() {
    return this.api.getcurrencies();
  }

  get maxPayrollAmount(): number {
    return Math.max(...this.payrollTrend.map(t => t.amount));
  }

  get maxAttendanceRate(): number {
    return Math.max(...this.attendanceData.map(a => a.rate));
  }

  get completedCount(): number {
    return this.steps.filter(s => s.completed).length;
  }

  get totalCount(): number {
    return this.steps.length;
  }

  get progressPct(): number {
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  markComplete(stepKey: string): void {
    const s = this.steps.find(x => x.key === stepKey);
    if (s) { s.completed = true; }
  }

  startPayroll(): void {
    const pendingMandatory = this.steps.filter(s => s.mandatory && !s.completed);
    if (pendingMandatory.length > 0) {
      alert('Mandatory setup for payroll: All required settings must be completed before payroll starts. Pending: ' + pendingMandatory.map(s => s.label).join(', '));
      return;
    }
    alert('All mandatory steps completed. You can start payroll.');
  }

  getBarHeight(value: number, max: number): number {
    return (value / max) * 100;
  }
}

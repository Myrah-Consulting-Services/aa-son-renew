import { Component, OnInit } from '@angular/core';
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
export class PayrollDashboard implements OnInit {
  loading = false;

  kpis: any = null;
  payrollTrend: any[] = [];
  attendanceData: any[] = [];
  leaveSummary: any[] = [];
  leaveRequestStats: any = null;
  leaveCategoryStats: any[] = [];
  recentPayRuns: any[] = [];
  upcomingSchedules: any[] = [];
  departmentBreakdown: any[] = [];
  activeLoans: any[] = [];

  private readonly leaveColors = ['#059669', '#dc2626', '#41299b', '#f59e0b', '#2563eb'];

  steps = [
    { key: 'org', label: 'Organization Details', mandatory: true, completed: true },
    { key: 'paySchedule', label: 'Configure your pay schedule', mandatory: true, completed: false },
    { key: 'social', label: 'Set up Social Security Benefits', mandatory: true, completed: false },
    { key: 'salary', label: 'Set up Salary Components', mandatory: true, completed: false },
    { key: 'employees', label: 'Add Employees', mandatory: true, completed: false },
    { key: 'prior', label: 'Configure Prior Payroll', mandatory: false, completed: true },
    { key: 'books', label: 'Connect with Accounting', mandatory: false, completed: true }
  ];

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.api.post('/employee/payroll-dashboard/', { company: this.api.getCompanyId() }).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status !== 200 || !res.data) {
          return;
        }

        const data = res.data;
        this.kpis = data.kpis || null;
        const leaveRequests = data.leave_request_summary || {};
        this.leaveRequestStats = leaveRequests.financial_year || data.kpis?.leave_requests || null;
        this.leaveCategoryStats = leaveRequests.financial_year_by_category?.paid_approved || [];
        this.payrollTrend = data.payroll_trend || [];
        this.attendanceData = (data.attendance_overview || []).map((item: any) => ({
          day: item.day,
          date: item.date,
          rate: item.attendance_rate ?? 0,
        }));
        this.leaveSummary = (data.leave_balance_summary || []).map((item: any, index: number) => ({
          type: item.name,
          used: item.used ?? 0,
          total: item.total ?? 0,
          remaining: item.remaining ?? 0,
          label: item.label,
          color: this.leaveColors[index % this.leaveColors.length],
        }));
        this.recentPayRuns = (data.recent_pay_runs || []).map((run: any) => ({
          id: run.pay_run_id,
          payrollRunId: run.payroll_run_id,
          period: run.period,
          employees: run.employees,
          amount: run.amount_formatted || this.formatCurrency(run.amount),
          status: run.status,
        }));
        this.upcomingSchedules = (data.upcoming_schedules || []).map((schedule: any) => ({
          schedule: schedule.schedule,
          nextRun: schedule.next_run_formatted || schedule.next_run,
          employees: schedule.employees,
        }));
        this.departmentBreakdown = this.mapDepartmentBreakdown(data.department_breakdown || []);
        this.activeLoans = (data.active_loans || []).map((loan: any) => ({
          employee: loan.employee,
          amount: loan.amount,
          remaining: loan.remaining,
          installments: loan.installments,
        }));
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private mapDepartmentBreakdown(departments: any[]): any[] {
    const maxCount = Math.max(...departments.map((d) => d.employee_count || 0), 1);
    return departments.map((dept) => ({
      dept: dept.department,
      employees: dept.employee_count ?? 0,
      percentage: Math.round(((dept.employee_count || 0) / maxCount) * 100),
    }));
  }

  getcurrency(): string {
    return this.api.getcurrencies() || 'AED';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: this.getcurrency(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }

  getChangeClass(label?: string): string {
    if (!label) {
      return 'positive';
    }
    const text = label.trim();
    if (text.startsWith('-')) {
      return 'negative';
    }
    return 'positive';
  }

  get maxPayrollAmount(): number {
    if (!this.payrollTrend.length) {
      return 1;
    }
    return Math.max(...this.payrollTrend.map((t) => t.amount || 0), 1);
  }

  get maxAttendanceRate(): number {
    if (!this.attendanceData.length) {
      return 100;
    }
    return Math.max(...this.attendanceData.map((a) => a.rate || 0), 1);
  }

  get completedCount(): number {
    return this.steps.filter((s) => s.completed).length;
  }

  get totalCount(): number {
    return this.steps.length;
  }

  get progressPct(): number {
    return Math.round((this.completedCount / this.totalCount) * 100);
  }

  markComplete(stepKey: string): void {
    const step = this.steps.find((x) => x.key === stepKey);
    if (step) {
      step.completed = true;
    }
  }

  startPayroll(): void {
    const pendingMandatory = this.steps.filter((s) => s.mandatory && !s.completed);
    if (pendingMandatory.length > 0) {
      alert(
        'Mandatory setup for payroll: All required settings must be completed before payroll starts. Pending: ' +
          pendingMandatory.map((s) => s.label).join(', ')
      );
      return;
    }
    alert('All mandatory steps completed. You can start payroll.');
  }

  getBarHeight(value: number, max: number): number {
    if (!max) {
      return 0;
    }
    return (value / max) * 100;
  }

  getLeaveUsedPercent(leave: { used: number; total: number }): number {
    const total = leave.total || 0;
    if (!total) {
      return 0;
    }
    return Math.min(100, (leave.used / total) * 100);
  }
}

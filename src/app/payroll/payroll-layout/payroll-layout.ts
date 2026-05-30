import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-payroll-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payroll-layout.html',
  styleUrl: './payroll-layout.scss'
})
export class PayrollLayout {
  isSidebarMode: boolean = false; // Default to tab mode

  navItems = [
    { label: 'Dashboard', route: 'dashboard', icon: 'bi-speedometer2' },
    { label: 'Employee', route: 'employee', icon: 'bi-people' },
    { label: 'Attendance', route: 'attendance', icon: 'bi-calendar-check' },
    { label: 'Leave Management', route: 'leavemanagement', icon: 'bi-calendar-event' },
    { label: 'Salary', route: 'salary', icon: 'bi-cash-stack' },
    { label: 'Salary Structure', route: 'salary-structure', icon: 'bi-diagram-3' },
    { label: 'Pay Schedule', route: 'pay-schedule', icon: 'bi-calendar3' },
    { label: 'Pay Run', route: 'par-run', icon: 'bi-play-circle' },
    { label: 'Loan Management', route: 'loan-management', icon: 'bi-bank' },
    { label: 'Payroll Settings', route: 'payroll-settings', icon: 'bi-gear' },
    { label: 'Final Settlement', route: 'final-settlement', icon: 'bi-file-earmark-check' },
    { label: 'EOSB Accrual', route: 'eosb-accrual-dashboard', icon: 'bi-graph-up' },
  ];

  toggleLayout(): void {
    this.isSidebarMode = !this.isSidebarMode;
  }
} 
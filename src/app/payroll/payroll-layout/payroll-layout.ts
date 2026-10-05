import { Component, HostListener, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

type PayrollNavChild = { label: string; route: string; icon: string };
type PayrollNavItem = PayrollNavChild & { children?: PayrollNavChild[] };

@Component({
  selector: 'app-payroll-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payroll-layout.html',
  styleUrl: './payroll-layout.scss'
})
export class PayrollLayout {
  private readonly router = inject(Router);

  isSidebarMode = false;
  openGroup: string | null = null;

  navItems: PayrollNavItem[] = [
    { label: 'Dashboard', route: 'dashboard', icon: 'bi-speedometer2' },
    {
      label: 'People',
      route: 'employee',
      icon: 'bi-people',
      children: [
        { label: 'Employee', route: 'employee', icon: 'bi-people' },
        { label: 'Attendance', route: 'attendance', icon: 'bi-calendar-check' },
        { label: 'Leave Management', route: 'leavemanagement', icon: 'bi-calendar-event' },
        { label: 'Camp Management', route: 'camp-management', icon: 'bi-buildings' },
      ],
    },
    {
      label: 'Setup',
      route: 'salary',
      icon: 'bi-sliders',
      children: [
        { label: 'Payroll Heads', route: 'salary', icon: 'bi-cash-stack' },
        { label: 'Statutory', route: 'statutory', icon: 'bi-shield-check' },
        { label: 'Salary Structure', route: 'salary-structure', icon: 'bi-diagram-3' },
        { label: 'Pay Schedule', route: 'pay-schedule', icon: 'bi-calendar3' },
        { label: 'Payroll Settings', route: 'payroll-settings', icon: 'bi-gear' },
      ],
    },
    { label: 'Pay Run', route: 'par-run', icon: 'bi-play-circle' },
    { label: 'Processing', route: 'payroll-processing', icon: 'bi-calculator' },
    {
      label: 'Settlements',
      route: 'loan-management',
      icon: 'bi-file-earmark-check',
      children: [
        { label: 'Loan Management', route: 'loan-management', icon: 'bi-bank' },
        { label: 'Final Settlement', route: 'final-settlement', icon: 'bi-file-earmark-check' },
        { label: 'EOSB Accrual', route: 'eosb-accrual-dashboard', icon: 'bi-graph-up' },
      ],
    },
  ];

  readonly flatNavItems: PayrollNavChild[] = this.navItems.flatMap((item) =>
    item.children?.length ? item.children : [item],
  );

  toggleLayout(): void {
    this.isSidebarMode = !this.isSidebarMode;
    this.openGroup = null;
  }

  toggleGroup(label: string, event: Event): void {
    event.stopPropagation();
    this.openGroup = this.openGroup === label ? null : label;
  }

  closeGroup(): void {
    this.openGroup = null;
  }

  isRouteActive(route: string): boolean {
    const url = this.router.url.split('?')[0];
    return url === `/payroll/${route}` || url.startsWith(`/payroll/${route}/`);
  }

  isGroupActive(item: PayrollNavItem): boolean {
    if (item.children?.length) {
      return item.children.some((child) => this.isRouteActive(child.route));
    }
    return this.isRouteActive(item.route);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openGroup = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openGroup = null;
  }
}

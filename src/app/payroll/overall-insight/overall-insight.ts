import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-overall-insight',
  imports: [CommonModule],
  templateUrl: './overall-insight.html',
  styleUrl: './overall-insight.scss'
})
export class OverallInsight {
  @Input() periodLabel: string = 'September 2025 Payrun';
  @Input() payrollRunId: any ;
  @Input() employeeBreakdown: any = {};
  @Input() benefitSummary: Array<{ name: string; count: number }> = [];
  @Input() paymentModeSummary: Array<{ name: string; count: number }> = [];
  @Input() componentBreakdown: Array<{
    group: string;
    items: Array<{
      name: string;
      employees: number;
      amount: number;
      payroll_head?: string | number | null;
      is_gcc?: boolean;
      amount_formatted?: string;
    }>;
    total?: number;
    expanded?: boolean;
  }> = [];
  // runPayrollData: any;
  
  // Track which groups are expanded/collapsed
  expandedGroups: { [key: string]: boolean } = {
    'Base Earning': true,
    'Benefits': true,
    'Deductions': true
  };
  // Modal state for component details
  isHeadModalOpen: boolean = false;
  selectedHeadLabel: string = '';
  headDetails: Array<{ employee_id: string; employee_name: string; amount?: number; employeeAmount?: number; employerAmount?: number }> = [];
  headIsGcc: boolean = false;
  constructor(private api:Api){}
  ngOnInit(): void {
    this.getPayrol();
  }
  getPayrol(): void {
    // this.api.get('/employee/current_month_payroll_run/').subscribe((response: any) => {
      // if(response.status == 200){
        this.payrollRunId = this.payrollRunId;
        this.getsight();
      // }
    // });
  }
  getsight(){
    const payload={
      company:this.api.getUserCompany(),
      pay_period_start_date:this.payrollRunId?.pay_period_start_date,
      pay_period_end_date:this.payrollRunId?.pay_period_end_date,
    }
    this.api.post('/employee/payroll_overall_insights/',payload).subscribe((response: any) => {
      if(response.status == 200){
        const data = response?.data || response;
        // Employee breakdown
        const el = data?.payroll_run_summary?.employee_list || {};
        this.employeeBreakdown = {
          active: Number(el?.no_of_active_employees) || 0,
          paid: Number(el?.no_of_paid_employees) || 0,
          skipped: Number(el?.no_of_skipped_employees) || 0,
          newJoineeSkipped: Number(el?.no_of_new_joinee_skipped_employees) || 0,
          withheld: Number(el?.no_of_salary_hold_employees) || 0,
          arrearReleased: Number(el?.no_of_new_joinee_released_employees) || 0,
          released: Number(el?.no_of_salary_hold_released_employees) || 0,
          lopReversed: Number(el?.no_of_lop_reversed_employees) || 0,
        };

        // Payment modes
        const pm = data?.payment_summary?.payment_list || {};
        this.paymentModeSummary = [
          { name: 'Bank Transfer Payment Mode', count: Number(pm?.no_of_bank_transfer_payments) || 0 },
          { name: 'Cheque Payment Mode', count: Number(pm?.no_of_cheque_payment_payments) || 0 },
          { name: 'Cash Payment Mode', count: Number(pm?.no_of_cash_payment_payments) || 0 }
        ];

        // Benefit summary (counts)
        this.benefitSummary = Array.isArray(data?.benefit_summary)
          ? data.benefit_summary.map((b: any) => ({ name: b?.name || 'Unnamed', count: Number(b?.count) || 0 }))
          : [];

        // Component breakdown
        // Support both shapes: data.component_summary or data itself contains *_details_list
        const csCandidate = (data && (data.component_summary || data));
        const cs = csCandidate || {};
        const earnings = cs?.earning_details_list || {};
        const benefits = cs?.benefit_details_list || {};
        const deductions = cs?.deduction_details_list || {};

        const earningItems: Array<{ name: string; employees: number; amount: number; payroll_head?: string | number | null; is_gcc?: boolean; amount_formatted?: string }> = [];
        
        // Handle both nested structure (base_earning.item_list) and flat structure (item_list)
        if (earnings?.item_list && Array.isArray(earnings.item_list)) {
          // Flat structure - item_list is directly an array
          earningItems.push(...earnings.item_list.map((it: any) => ({
            name: it?.name || 'Unnamed',
            employees: Number(it?.employee_count) || 0,
            amount: Number(it?.amount || 0),
            payroll_head: it?.payroll_head ?? it?.id ?? null,
            is_gcc: Boolean(it?.is_gcc),
            amount_formatted: it?.amount_formatted
          })));
        } else if (earnings?.item_list && typeof earnings.item_list === 'object') {
          // Nested structure - item_list contains groups like base_earning
          Object.keys(earnings.item_list || {}).forEach((k: string) => {
            const g = earnings.item_list[k];
            (g?.item_list || []).forEach((it: any) => {
              earningItems.push({
                name: it?.name || 'Unnamed',
                employees: Number(it?.employee_count) || 0,
                amount: Number(it?.amount || it?.employee_amount || 0),
                payroll_head: it?.payroll_head ?? it?.id ?? null,
                is_gcc: Boolean(it?.is_gcc),
                amount_formatted: it?.amount_formatted
              });
            });
          });
        }

        const benefitItems = (benefits?.item_list || []).map((it: any) => ({
          name: it?.name || 'Unnamed',
          employees: Number(it?.employee_count) || 0,
          amount: Number(it?.employee_amount || 0),
          payroll_head: it?.payroll_head ?? it?.id ?? null,
          is_gcc: Boolean(it?.is_gcc),
          amount_formatted: it?.employee_amount_formatted || it?.amount_formatted
        }));
        const deductionItems = (deductions?.item_list || []).map((it: any) => ({
          name: it?.name || 'Unnamed',
          employees: Number(it?.employee_count) || 0,
          amount: Number(it?.employee_amount || 0),
          payroll_head: it?.payroll_head ?? it?.id ?? null,
          is_gcc: Boolean(it?.is_gcc),
          amount_formatted: it?.employee_amount_formatted || it?.amount_formatted
        }));

        this.componentBreakdown = [
          { group: 'Base Earning', items: earningItems, total: Number(earnings?.total_amount) || 0, expanded: this.expandedGroups['Base Earning'] },
          { group: 'Benefits', items: benefitItems, total: Number(benefits?.total_employee_amount) || 0, expanded: this.expandedGroups['Benefits'] },
          { group: 'Deductions', items: deductionItems, total: Number(deductions?.total_employee_amount) || 0, expanded: this.expandedGroups['Deductions'] }
        ];
      }
    });
  }
  groupTotal(group: any): number {
    const itemsTotal = (group?.items || []).reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
    if (itemsTotal > 0) return itemsTotal;
    return Number(group?.total) || 0;
  }

  totalLabelForGroup(groupName: string): string {
    const name = (groupName || '').toLowerCase();
    if (name.includes('earn')) return 'Total Earnings';
    if (name.includes('benefit')) return 'Total Benefits';
    if (name.includes('deduct')) return 'Total Deductions';
    return 'Total';
  }

  toggleGroup(groupName: string): void {
    this.expandedGroups[groupName] = !this.expandedGroups[groupName];
    // Update the expanded state in componentBreakdown
    const group = this.componentBreakdown.find(g => g.group === groupName);
    if (group) {
      group.expanded = this.expandedGroups[groupName];
    }
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroups[groupName] || false;
  }

  // Open the details modal when a component name is clicked
  openHeadModal(item: any): void {
    this.getparticular(item);
    this.selectedHeadLabel = String(item?.name || 'Component');
    this.isHeadModalOpen = true;
    // Optionally load details here in the future
  }

  closeHeadModal(): void {
    this.isHeadModalOpen = false;
  }

  private parseCurrencyToNumber(value: any): number {
    if (typeof value === 'number') return Number(value) || 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.\-]/g, '');
      const num = Number(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  }

  getparticular(item: any){
    const isGcc = item?.is_gcc ? 'true' : 'false';
    const headId = item?.payroll_head ?? '';
    this.api.get('/employee/payroll_by_head/'+isGcc+'/'+headId+'/').subscribe((response: any) => {
      if(response?.status == 200){
        const data = response?.data || response;
        if (data?.payroll_head) {
          this.selectedHeadLabel = String(data.payroll_head);
        }
        const rows = Array.isArray(data?.employees) ? data.employees : [];
        // Decide layout based on response fields, not input flag
        const hasContributionFields = rows.some((e: any) => e?.employee_contribution != null || e?.employer_contribution != null);
        this.headIsGcc = hasContributionFields;
        if (hasContributionFields) {
          this.headDetails = rows.map((e: any) => ({
            employee_id: String(e?.id ?? e?.employee_id ?? ''),
            employee_name: String(e?.name ?? e?.employee_name ?? ''),
            employeeAmount: this.parseCurrencyToNumber(e?.employee_contribution),
            employerAmount: this.parseCurrencyToNumber(e?.employer_contribution)
          }));
        } else {
          this.headDetails = rows.map((e: any) => ({
            employee_id: String(e?.id ?? e?.employee_id ?? ''),
            employee_name: String(e?.name ?? e?.employee_name ?? ''),
            amount: this.parseCurrencyToNumber(e?.total_amount)
          }));
        }
      }
    });
  }
}

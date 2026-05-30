import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-deduction-detail',
  imports: [CommonModule],
  templateUrl: './deduction-detail.html',
  styleUrl: './deduction-detail.scss'
})
export class DeductionDetail {
  runPayrollData: any;
  contributions: any[] = [];
  otherDeductions: any[] = [];
  Math=Math;
  @Input() payrollRunId: any;
constructor(private api:Api){

}

  ngOnInit(): void {
    this.getPayrol();
  }
  getPayrol(): void {
    // this.api.get('/employee/current_month_payroll_run/').subscribe((response: any) => {
      // if(response.status == 200){
        this.runPayrollData = this.payrollRunId;
        console.log(this.runPayrollData,'runPayrollData');
        this.getcontribution();
      // }
    // });
  }
  getcontribution(){
    const payload={
      company:this.api.getUserCompany(),
      pay_period_start_date:this.payrollRunId?.pay_period_start_date,
      pay_period_end_date:this.payrollRunId?.pay_period_end_date,
    }
    // Prefer taxes + deductions summary if available; fallback to older contributions API shape
    this.api.post('/employee/payroll_contributions_summary/',payload).subscribe((res: any) => {
      if(res?.status === 200){
        const root = res?.data || res;
        const tds = root?.taxes_deductions_summary || root;
        const benefits = Array.isArray(tds?.benefit_summary?.benefits) ? tds.benefit_summary.benefits : [];
        const deductions = Array.isArray(tds?.deduction_summary?.deductions) ? tds.deduction_summary.deductions : [];

        this.contributions = benefits.map((b: any) => ({
          name: b?.name || 'Unnamed',
          employer_amount: Number(b?.total_employer_contribution) || 0,
          employee_amount: Number(b?.total_employee_contribution) || 0,
        }));

        this.otherDeductions = deductions.map((d: any) => ({
          name: d?.name || 'Unnamed',
          employer_amount: null,
          employee_amount: Number(d?.total_employee_contribution) || 0,
        }));
        return;
      }
      // Fallback to previous endpoint if needed
      // this.api.post('/employee/payroll_contributions_summary/',payload).subscribe((fallback: any) => {
      //   if(fallback?.status === 200){
      //     const rows = Array.isArray(fallback?.data) ? fallback.data : [];
      //     this.contributions = rows;
      //     this.otherDeductions = [];
      //   }
      // });
    });
  }

  get employerContributionTotal(): number {
    return (this.contributions || []).reduce((sum: number, item: any) => sum + (Number(item.employer_amount) || 0), 0);
  }

  get employeeContributionTotal(): number {
    return (this.contributions || []).reduce((sum: number, item: any) => sum + (Number(item.employee_amount) || 0), 0);
  }

  get otherDeductionsEmployeeTotal(): number {
    return (this.otherDeductions || []).reduce((sum: number, item: any) => sum + (Number(item.employee_amount) || 0), 0);
  }
}

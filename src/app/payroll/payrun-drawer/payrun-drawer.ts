import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-payrun-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payrun-drawer.html',
  styleUrl: './payrun-drawer.scss'
})
export class PayrunDrawer implements OnChanges {
  @Input() employee: any = null; // summary row (id, name, gross, net, etc.)
  // @Input() detail: any = null; 
  @Input() payrollSummary: any = null; // detailed data (earnings, deductions, benefits, totals)
  @Input() payslipData: any = null; // payslip data for specific employee
  @Output() drawerClosed = new EventEmitter<void>();
  
  ngOnChanges(): void {
    // Handle changes to payslip data input

  }
  fetchPayScheduleData: any;
  particularEmp:any
  salaryDetails: any;
  earnings: any;
  details: any;
  constructor(private api: Api, private modalService: NgbModal) {}

  getcurrency() {
    return this.api.getcurrencies();
  }
  ngOnInit(): void {
    // this.get_payscheduleDataApi()
    console.log(this.employee, this.payslipData);
    this.loadData()

  }
  loadData(){
    this.api.get('/employee/payroll_run_details/'+this.payrollSummary.payrun_id+'/'+this.employee.employee_id+'/').subscribe((res:any)=>{
      if(res.status==200){
        this.details = res;
        console.log(this.details,'details');
        
      }
    })
  }
  
  // get_payscheduleDataApi() {
  //   this.api.get('employee/get_all_pay_schedules/'+this.payrollSummary.payroll_run_id+'/').subscribe((response: any) => {
  //     if (response.status == 200 || response.status == 201) {
  //       this.fetchPayScheduleData = response.data[0];
  //     }
  //   });
  // }
  getSalaryDetails(): void {
    this.api.get('/employee/distributed_payroll_list/').subscribe((response: any) => {
      if(response.status==200){
      this.salaryDetails = response.data
      this.earnings = this.salaryDetails.earnings; 
      }
  })
}

  formatCurrency(value: any): string {
    const num = Number(value || 0);
    return `${this.getcurrency()}${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  get employeeName(): string {
    return this.employee?.employee_name || this.details?.employee_info?.employee_name || '';
  }

  get employeeId(): string {
    const id = this.employee?.employee_id ?? this.details?.employee_info?.employee_id;
    return id != null ? String(id) : '';
  }

  get netPay(): number {
    return Number(this.employee?.net_pay ?? this.details?.totals?.net_pay ?? 0);
  }

  get paidDays(): number { return Number(this.employee?.paid_days ?? 0); }
  get lopDays(): number { return Number(this.employee?.lop_days ?? 0); }

  get earningsList(): any[] { return Array.isArray(this.details?.earnings) ? this.details.earnings : []; }
  get deductionsList(): any[] { return Array.isArray(this.details?.deductions) ? this.details.deductions : []; }
  get benefitsList(): any[] { return Array.isArray(this.details?.benefits) ? this.details.benefits : []; }
  
  // LOP UI state
  showLopInput: boolean = false;
  showLopMenu: boolean = false;
  showPastLop: boolean = false;
  lopDaysInput: number = 0;
  adjustments: Array<{ month: string; mode: string; days: number }> = [];

  // Edit modal properties
  @ViewChild('editBenefitModal') editBenefitModal!: TemplateRef<any>;
  @ViewChild('editDeductionModal') editDeductionModal!: TemplateRef<any>;
  
  selectedBenefit: any = null;
  selectedDeduction: any = null;
  showOverrideContribution: boolean = false;
  
  benefitForm = {
    employeeContribution: 0,
    employerContribution: 0,
    reason: ''
  };
  
  deductionForm = {
    amount: 0,
    reason: ''
  };

  // Add Earning/Deduction dropdown properties
  showEarningDropdown: boolean = false;
  showDeductionDropdown: boolean = false;
  availableEarnings: any[] = [];
  availableDeductions: any[] = [];
  filteredEarnings: any[] = [];
  filteredDeductions: any[] = [];
  earningSearchTerm: string = '';
  deductionSearchTerm: string = '';
  selectedEarning: any = null;
  selectedDeductionType: any = null;
  earningAmount: number = 0;
  deductionAmount: number = 0;
  
  // Temporary arrays for managing new items
  tempEarnings: any[] = [];
  tempDeductions: any[] = [];

  toggleLopMenu(): void { this.showLopMenu = !this.showLopMenu; }
  addLop(): void { this.showLopInput = true; this.showLopMenu = false; }
  enablePastLop(): void { this.showPastLop = true; this.showLopMenu = false; if(this.adjustments.length === 0) this.addAdjustment(); }
  clearLop(): void { this.lopDaysInput = 0; this.showLopInput = false; }

  get actualPayableDays(): number {
    // Use details.payable_days as base if available, otherwise use paidDays
    const baseDays = this.details?.payable_days || this.paidDays;
    const lopDays = Number(this.lopDaysInput) || 0;
    const adj = this.adjustments.reduce((sum, a) => sum + (a.mode === 'Reversal' ? Number(a.days) || 0 : -(Number(a.days) || 0)), 0);
    return baseDays - lopDays + adj;
  }

  get totalLopDays(): number {
    return Number(this.lopDaysInput) || 0;
  }

  get calculatedNetPay(): number {
    const baseDays = this.details?.payable_days || this.paidDays;
    const actualDays = this.actualPayableDays;
    
    if (baseDays > 0 && actualDays > 0 && actualDays !== baseDays) {
      // Calculate proportional net pay based on actual payable days
      const baseNetPay = Number(this.details?.net_pay) || 0;
      return (baseNetPay * actualDays) / baseDays;
    }
    return Number(this.details?.net_pay) || 0;
  }

  get calculatedEarnings(): any[] {
    let existingEarnings = [];
    
    if (this.details?.earnings) {
      const baseDays = this.details?.payable_days || this.paidDays;
      const actualDays = this.actualPayableDays;
      
      if (baseDays > 0 && actualDays > 0 && actualDays !== baseDays) {
        existingEarnings = this.details.earnings.map((earning: any) => ({
          ...earning,
          calculated_value: (earning.value * actualDays) / baseDays
        }));
      } else {
        existingEarnings = this.details.earnings.map((earning: any) => ({
          ...earning,
          calculated_value: earning.value
        }));
      }
    }
    
    // Combine existing earnings with temporary earnings
    return [...existingEarnings, ...this.tempEarnings];
  }

  get calculatedDeductions(): any[] {
    let existingDeductions = [];
    
    if (this.details?.deductions) {
      const baseDays = this.details?.payable_days || this.paidDays;
      const actualDays = this.actualPayableDays;
      
      if (baseDays > 0 && actualDays > 0 && actualDays !== baseDays) {
        existingDeductions = this.details.deductions.map((deduction: any) => ({
          ...deduction,
          calculated_value: (deduction.value * actualDays) / baseDays
        }));
      } else {
        existingDeductions = this.details.deductions.map((deduction: any) => ({
          ...deduction,
          calculated_value: deduction.value
        }));
      }
    }
    
    // Combine existing deductions with temporary deductions
    return [...existingDeductions, ...this.tempDeductions];
  }

  get calculatedBenefits(): any[] {
    if (!this.details?.benefits) return [];
    
    const baseDays = this.details?.payable_days || this.paidDays;
    const actualDays = this.actualPayableDays;
    
    if (baseDays > 0 && actualDays > 0 && actualDays !== baseDays) {
      return this.details.benefits.map((benefit: any) => ({
        ...benefit,
        calculated_value: (benefit.value * actualDays) / baseDays,
        calculated_employer_value: (benefit.employer_value * actualDays) / baseDays,
        calculated_employee_value: (benefit.employee_value * actualDays) / baseDays
      }));
    }
    
    return this.details.benefits.map((benefit: any) => ({
      ...benefit,
      calculated_value: benefit.value,
      calculated_employer_value: benefit.employer_value,
      calculated_employee_value: benefit.employee_value
    }));
  }

  addAdjustment(): void {
    const months = this.recentMonths(6);
    this.adjustments.push({ month: months[0]?.value || '', mode: 'Reversal', days: 0 });
  }

  removeAdjustment(idx: number): void {
    this.adjustments.splice(idx, 1);
    if(this.adjustments.length === 0) this.showPastLop = false;
  }

  recentMonths(n: number): Array<{ label: string; value: string }> {
    const arr: Array<{ label: string; value: string }> = [];
    const today = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      arr.push({ label, value });
    }
    return arr;
  }

  // Edit modal methods
  editBenefit(benefit: any): void {
    this.selectedBenefit = benefit;
    this.benefitForm = {
      employeeContribution: benefit.calculated_employee_value || benefit.employee_value || 0,
      employerContribution: benefit.calculated_employer_value || benefit.employer_value || 0,
      reason: ''
    };
    this.showOverrideContribution = false;
    this.modalService.open(this.editBenefitModal, { size: 'md', centered: true });
  }

  editDeduction(deduction: any): void {
    this.selectedDeduction = deduction;
    this.deductionForm = {
      amount: deduction.calculated_value || deduction.value || 0,
      reason: ''
    };
    this.modalService.open(this.editDeductionModal, { size: 'md', centered: true });
  }

  enableOverrideContribution(): void {
    this.showOverrideContribution = true;
  }

  closeOverrideContribution(): void {
    this.showOverrideContribution = false;
  }

  saveBenefit(modal: any): void {
    if (!this.benefitForm.reason.trim()) {
      alert('Please provide a reason for the override.');
      return;
    }

    // Here you would typically make an API call to save the benefit changes
    console.log('Saving benefit:', this.selectedBenefit, this.benefitForm);
    
    // Update the selected benefit with new values
    if (this.selectedBenefit) {
      this.selectedBenefit.employee_value = this.benefitForm.employeeContribution;
      this.selectedBenefit.employer_value = this.benefitForm.employerContribution;
      this.selectedBenefit.value = this.benefitForm.employeeContribution + this.benefitForm.employerContribution;
      this.selectedBenefit.head_type_id = 1;
      this.selectedBenefit.head_type_name_id = this.selectedBenefit.head_type_name;
      this.selectedBenefit.id = this.selectedBenefit.id;
      this.selectedBenefit.reason = this.benefitForm.reason;
    }

    this.api.put('/employee/payroll_run_details_update/'+this.payrollSummary.payrun_id+'/'+this.employee.employee_id+'/', this.selectedBenefit).subscribe({
      next: (res: any) => {
        console.log('Benefit saved successfully:', res);
      },
      error: (error) => {
        alert('Failed to save benefit. Please try again.');
        console.error('Error saving benefit:', error);
      }
    });

    modal.close();
  }

  saveDeduction(modal: any): void {
    if (!this.deductionForm.reason.trim()) {
      alert('Please provide a reason for the deduction.');
      return;
    }
   
    console.log('Saving deduction:', this.selectedDeduction, this.deductionForm);
    
    // Update the selected deduction with new value
    if (this.selectedDeduction) {
      this.selectedDeduction.value = this.deductionForm.amount;
      this.selectedDeduction.head_type_id = 2;
      this.selectedDeduction.head_type_name_id = this.selectedDeduction.head_type_name;
      this.selectedDeduction.id = this.selectedDeduction.id;
      this.selectedDeduction.reason = this.deductionForm.reason;
    }
    this.api.put('/employee/payroll_run_details_update/'+this.payrollSummary.payrun_id+'/'+this.employee.employee_id+'/', this.selectedDeduction).subscribe({
      next: (res: any) => {
        console.log('Deduction saved successfully:', res);
      },
      error: (error) => {
        alert('Failed to save deduction. Please try again.');
        console.error('Error saving deduction:', error);
      }
    });

    modal.close();
  }

  addEarning(): void {
    this.showEarningDropdown = true;
    this.loadAvailableEarnings();
  }

  addDeduction(): void {
    this.showDeductionDropdown = true;
    this.loadAvailableDeductions();
  }

  loadAvailableEarnings(): void {
    // /employee/payroll_heads_available/<int:employee_id>/<int:company_id>/<int:head_type>/
    this.api.get('/employee/payroll_heads_available/'+this.employee.employee_id+'/'+this.api.getCompanyId()+'/1/').subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.availableEarnings = res.data;
          this.filteredEarnings = [...this.availableEarnings];
        }
      },
      error: (error) => {
        console.error('Error loading earnings:', error);
      }
    });
  }

  loadAvailableDeductions(): void {
    // Load available deductions from API
    this.api.get('/employee/payroll_heads_available/'+this.employee.employee_id+'/'+this.api.getCompanyId()+'/2/').subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.availableDeductions = res.data;
          this.filteredDeductions = [...this.availableDeductions];
        }
      },
      error: (error) => {
        console.error('Error loading deductions:', error);
      }
    });
  }

  onEarningSearch(): void {
    if (!this.earningSearchTerm.trim()) {
      this.filteredEarnings = [...this.availableEarnings];
    } else {
      this.filteredEarnings = this.availableEarnings.filter(earning =>
        earning.name?.toLowerCase().includes(this.earningSearchTerm.toLowerCase())
      );
    }
  }

  onDeductionSearch(): void {
    if (!this.deductionSearchTerm.trim()) {
      this.filteredDeductions = [...this.availableDeductions];
    } else {
      this.filteredDeductions = this.availableDeductions.filter(deduction =>
        deduction.name?.toLowerCase().includes(this.deductionSearchTerm.toLowerCase())
      );
    }
  }

  selectEarning(earning: any): void {
    console.log(earning);
    
    this.selectedEarning = earning;
    this.earningSearchTerm = earning.name;
    this.showEarningDropdown = false;
    
    // Add to temporary earnings array
    const newEarning = {
      id: earning.id, 
      head_type_name_display: earning.name,
      head_type_id: 1,
      head_type_name_id: earning.id,
      calculated_value: 0,
      isNew: true, // flag to identify new items
      calculation_type_name: earning.calculation_type_name,
      calculation_on_fields: earning.calculation_on_fields || [],
      custom_inputs: {} // Store custom formula inputs
    };
    
    this.tempEarnings.push(newEarning);
    this.resetEarningForm();
  }

  selectDeduction(deduction: any): void {
    console.log(deduction);
    
    this.selectedDeductionType = deduction;
    this.deductionSearchTerm = deduction.name;
    this.showDeductionDropdown = false;
    
    // Add to temporary deductions array
    const newDeduction = {
      id: deduction.id,
      head_type_name_display: deduction.name,
      head_type_id: 2,
      head_type_name_id: deduction.id,
      calculated_value: 0,
      isNew: true // flag to identify new items
    };
    
    this.tempDeductions.push(newDeduction);
    this.resetDeductionForm();
  }
  saveLop(): void {
    let data = {
      "lop_days": this.lopDaysInput
    }    
    this.api.put('/employee/payroll_run_details_update_lop/'+this.payrollSummary.payrun_id+'/'+this.employee.employee_id+'/'+this.api.getCompanyId()+'/', data).subscribe({
      next: (res: any) => {
        console.log('Payroll run details updated LOP days successfully:', res);
        this.loadData(); // Refresh the data
      },
      error: (error) => {
        console.error('Error updating LOP days:', error);
        alert('Failed to update LOP days. Please try again.');
      }
    });
  }
  saveEarningsAndDeductions(): void {
    // Check if there are any temporary items to save
    if (this.tempEarnings.length === 0 && this.tempDeductions.length === 0) {
      alert('No new earnings or deductions to save.');
      return;
    }

    // // Validate all temporary earnings have values
    // const invalidEarnings = this.tempEarnings.filter(e => !e.calculated_value || e.calculated_value < 0);
    // if (invalidEarnings.length > 0 && this.tempEarnings.some(e => e.calculation_type_name !== 'Custom Formula')) {
    //   alert('Please enter valid amounts for all earnings.');
    //   return;
    // }

    // Validate all temporary deductions have values
    const invalidDeductions = this.tempDeductions.filter(d => !d.calculated_value || d.calculated_value <= 0);
    if (invalidDeductions.length > 0) {
      alert('Please enter valid amounts for all deductions.');
      return;
    }

    // Prepare earnings data
    const earningsData = this.tempEarnings.map(earning => {
      const baseData = {
        id: earning.id,
        value: earning.calculated_value
      };

      // If it's a custom formula, add inputs
      if (earning.calculation_type_name === 'Custom Formula') {
        return {
          ...baseData,
          inputs: this.buildCustomInputs(earning.calculation_on_fields, earning.custom_inputs)
        };
      }

      return baseData;
    });

    // Prepare deductions data
    const deductionsData = this.tempDeductions.map(deduction => ({
      id: deduction.id,
      head_type_name_id: deduction.head_type_name_id,
      value: deduction.calculated_value
    }));

    // Prepare combined payload
    let data = {
      "earnings": earningsData,
      "deductions": deductionsData,
      "benefits": [],
      "lop_days": 0
    };
   console.log(data,'data');
    this.api.put('/employee/payroll_run_details_update/'+ this.payrollSummary.payrun_id+'/'+this.employee.employee_id+'/', data).subscribe({
      next: (res: any) => {
        console.log('Payroll run details updated successfully:', res);
        this.tempEarnings = []; // Clear temporary earnings
        this.tempDeductions = []; // Clear temporary deductions
        this.loadData(); // Refresh the data
      },
      error: (error) => {
        console.error('Error adding earnings and deductions:', error);
        alert('Failed to add earnings and deductions. Please try again.');
      }
    });
  }


  updateTempEarningValue(earning: any, value: number): void {
    const index = this.tempEarnings.findIndex(e => e.id === earning.id);
    if (index !== -1) {
      this.tempEarnings[index].calculated_value = value;
    }
  }

  removeTempEarning(earning: any): void {
    const index = this.tempEarnings.findIndex(e => e.id === earning.id);
    if (index !== -1) {
      this.tempEarnings.splice(index, 1);
    }
  }

  updateTempDeductionValue(deduction: any, value: number): void {
    const index = this.tempDeductions.findIndex(d => d.id === deduction.id);
    if (index !== -1) {
      this.tempDeductions[index].calculated_value = value;
    }
  }

  removeTempDeduction(deduction: any): void {
    const index = this.tempDeductions.findIndex(d => d.id === deduction.id);
    if (index !== -1) {
      this.tempDeductions.splice(index, 1);
    }
  }

  resetEarningForm(): void {
    this.selectedEarning = null;
    this.earningAmount = 0;
    this.earningSearchTerm = '';
    this.showEarningDropdown = false;
  }

  resetDeductionForm(): void {
    this.selectedDeductionType = null;
    this.deductionAmount = 0;
    this.deductionSearchTerm = '';
    this.showDeductionDropdown = false;
  }

  buildCustomInputs(calculationOnFields: string[], customInputs: any): any {
    const inputs: any = {};
    
    // Loop through calculation_on_fields and build inputs object
    calculationOnFields.forEach(field => {
      // Only add the field if it has a value in custom_inputs
      if (customInputs[field] !== undefined && customInputs[field] !== null && customInputs[field] !== '') {
        inputs[field] = customInputs[field];
      }
    });
    console.log(inputs,'inputs');
    
    return inputs;
  }

  updateCustomInput(earningItem: any, field: string, value: any): void {
    // Find the earning item in tempEarnings array
    const tempEarningIndex = this.tempEarnings.findIndex(earning => earning.id === earningItem.id);
    
    console.log('earningItem:', earningItem, 'tempEarningIndex:', tempEarningIndex);
    console.log('tempEarnings:', this.tempEarnings);
    
    if (tempEarningIndex !== -1 && this.tempEarnings[tempEarningIndex]) {
      if (!this.tempEarnings[tempEarningIndex].custom_inputs) {
        this.tempEarnings[tempEarningIndex].custom_inputs = {};
      }
      
      // Only store non-empty values
      if (value && value !== '') {
        this.tempEarnings[tempEarningIndex].custom_inputs[field] = parseFloat(value);
      } else {
        // Remove the field if empty
        delete this.tempEarnings[tempEarningIndex].custom_inputs[field];
      }
      
      // Also update the item in calculatedEarnings for immediate UI update
      if (!earningItem.custom_inputs) {
        earningItem.custom_inputs = {};
      }
      
      if (value && value !== '') {
        earningItem.custom_inputs[field] = parseFloat(value);
      } else {
        delete earningItem.custom_inputs[field];
      }
    }
  }

  cancelEarning(): void {
    this.resetEarningForm();
  }

  cancelDeduction(): void {
    this.resetDeductionForm();
  }

  save(): void {
    // Save the current payroll run details
    console.log('Saving payroll run details...');
    // Add implementation for saving the entire payroll run
  }


  downloadPayslip(): void {
    console.log('Downloading payslip for:', this.employee?.employee_name);
    
    // Prepare payslip data
    const payslipData = this.preparePayslipData();
    
    // Generate PDF and download
    this.generatePayslipPDF(payslipData);
  }

  preparePayslipData(): any {    
    // Use actual payslip data if available, otherwise use calculated values
    const payslipData = this.payslipData?.payslip || {};
    
    return {
      company: {
        name: payslipData.company_info?.company_name || 'Esarwa Softwares',
        address: payslipData.company_info?.address || '88 Awolowo Road, Ikoyi, Lagos',
        payslipMonth: payslipData.company_info?.payslip_month || 'September 2025'
      },
      employee: {
        name: payslipData.employee_summary?.employee_name || this.employeeName || 'N/A',
        designation: payslipData.employee_summary?.designation || 'N/A',
        employeeId: payslipData.employee_summary?.employee_id || this.employeeId || 'EMP-2',
        molId: payslipData.employee_summary?.mol_id || '',
        dateOfJoining: payslipData.employee_summary?.date_of_joining || '',
        payPeriod: payslipData.employee_summary?.pay_period || '',
        payDate: payslipData.employee_summary?.pay_date || '',
        bankAccount: payslipData.employee_summary?.bank_account || ''
      },
      paySummary: {
        payableDays: payslipData.pay_summary?.paid_days || 0,
        lopDays: payslipData.pay_summary?.lop_days || 0,
        actualPayableDays: (payslipData.pay_summary?.paid_days || 0) - (payslipData.pay_summary?.lop_days || 0),
        netPay: payslipData.pay_summary?.total_net_pay || 0
      },
      earnings: {
        items: payslipData.earnings?.items || [],
        grossEarnings: payslipData.earnings?.gross_earnings || 0
      },
      deductions: {
        items: payslipData.deductions?.items || [],
        totalDeductions: payslipData.deductions?.total_deductions || 0
      },
      benefits: {
        items: this.payslipData.benefits
      },
      netPay: {
        grossEarnings: payslipData.net_pay?.gross_earnings || 0,
        totalDeductions: payslipData.net_pay?.total_deductions || 0,
        netPay: payslipData.net_pay?.net_pay || 0,
        amountInWords: payslipData.net_pay?.amount_in_words || this.numberToWords(payslipData.net_pay?.net_pay || 0)
      }
    };
  }

  prepareEarningsData(earnings: any[]): any[] {
    if (!earnings || earnings.length === 0) {
      return this.calculatedEarnings || [
        { name: 'Basic', amount: 3096.77 },
        { name: 'Housing Allowance', amount: 3096.77 },
        { name: 'Cost of Living Allowance', amount: 4129.03 },
        { name: 'Other Allowance', amount: 4129.03 }
      ];
    }
    
    return earnings.map(earning => ({
      head_type_name_display: earning.head_type_name_display || earning.head_type_display || 'Earning',
      value: earning.value || 0,
      name: earning.head_type_name_display || earning.head_type_display || 'Earning',
      amount: earning.value || 0
    }));
  }

  prepareDeductionsData(deductions: any[]): any[] {
    if (!deductions || deductions.length === 0) {
      return this.calculatedDeductions || [
        { name: 'GPSSA', amount: 3080.00 }
      ];
    }
    
    return deductions
      .filter(deduction => (deduction.value || 0) > 0) // Only include deductions with value > 0
      .map(deduction => ({
        head_type_name_display: deduction.head_type_name_display || deduction.head_type_display || 'Deduction',
        value: deduction.value || 0,
        name: deduction.head_type_name_display || deduction.head_type_display || 'Deduction',
        amount: deduction.value || 0
      }));
  }

  prepareBenefitsData(benefits: any[]): any[] {
    if (!benefits || benefits.length === 0) {
      return [];
    }
    
    return benefits.map(benefit => ({
      head_type_name_display: benefit.head_type_name_display || benefit.pension_name || 'Benefit',
      employee_value: benefit.employee_value || 0,
      employer_value: benefit.employer_value || 0,
      value: (benefit.employee_value || 0) + (benefit.employer_value || 0),
      name: benefit.head_type_name_display || benefit.pension_name || 'Benefit',
      employeeValue: benefit.employee_value || 0,
      employerValue: benefit.employer_value || 0,
      totalValue: (benefit.employee_value || 0) + (benefit.employer_value || 0)
    }));
  }

  calculateGrossEarningsFromData(earnings: any[]): number {
    if (!earnings || earnings.length === 0) {
      return this.calculateGrossEarnings();
    }
    
    return earnings.reduce((sum, earning) => sum + (earning.value || earning.amount || 0), 0);
  }

  calculateTotalDeductionsFromData(deductions: any[]): number {
    if (!deductions || deductions.length === 0) {
      return this.calculateTotalDeductions();
    }
    
    return deductions.reduce((sum, deduction) => sum + (deduction.value || deduction.amount || 0), 0);
  }

  calculateTotalBenefitsFromData(benefits: any[]): number {
    if (!benefits || benefits.length === 0) {
      return 0;
    }
    
    return benefits.reduce((sum, benefit) => {
      const employeeValue = benefit.employee_value || benefit.employeeValue || 0;
      const employerValue = benefit.employer_value || benefit.employerValue || 0;
      return sum + employeeValue + employerValue;
    }, 0);
  }

  calculateGrossEarnings(): number {
    if (this.calculatedEarnings && this.calculatedEarnings.length > 0) {
      return this.calculatedEarnings.reduce((sum, earning) => sum + (earning.calculated_value || 0), 0);
    }
    return 14451.60; // Default value
  }

  calculateTotalDeductions(): number {
    if (this.calculatedDeductions && this.calculatedDeductions.length > 0) {
      return this.calculatedDeductions.reduce((sum, deduction) => sum + (deduction.calculated_value || 0), 0);
    }
    return 3080.00; // Default value
  }

  generatePayslipPDF(payslipData: any): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow popups to download the payslip');
      return;
    }

    // Generate HTML content for the payslip
    const payslipHTML = this.generatePayslipHTML(payslipData);
    
    printWindow.document.write(payslipHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  generatePayslipHTML(data: any): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payslip - ${data.employee.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { 
          size: A4; 
          margin: 15mm; 
        }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.3; 
          color: #333; 
          background: white;
        }
        .payslip-container { 
          width: 100%; 
          max-width: 180mm; 
          margin: 0 auto; 
          background: white;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start; 
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .company-info h1 { 
          margin: 0; 
          font-size: 20px; 
          color: #333; 
          font-weight: bold;
        }
        .company-info p { 
          margin: 5px 0 0 0; 
          color: #666; 
          font-size: 11px;
        }
        .payslip-period { 
          text-align: right; 
        }
        .payslip-period p { 
          margin: 0; 
          font-size: 11px; 
          color: #666; 
        }
        .payslip-period h2 { 
          margin: 5px 0 0 0; 
          font-size: 18px; 
          color: #333; 
          font-weight: bold;
        }
        .content { 
          display: flex; 
          gap: 20px; 
          margin-bottom: 20px; 
        }
        .employee-summary { 
          flex: 1; 
        }
        .net-pay-summary { 
          flex: 1; 
          background: #f0f8f0; 
          padding: 15px; 
          border: 1px solid #ddd; 
          text-align: center; 
        }
        .section-title { 
          font-weight: bold; 
          margin-bottom: 10px; 
          color: #333; 
          font-size: 13px;
          text-transform: uppercase;
        }
        .detail-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 5px; 
          font-size: 11px;
        }
        .net-pay-amount { 
          font-size: 24px; 
          font-weight: bold; 
          color: #28a745; 
          margin: 10px 0; 
        }
        .earnings-deductions { 
          margin-top: 20px; 
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 10px; 
          font-size: 11px;
        }
        .table th, .table td { 
          padding: 8px 6px; 
          text-align: left; 
          border: 1px solid #ddd; 
        }
        .table th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
          font-size: 11px;
        }
        .amount { 
          text-align: right; 
          font-weight: 600;
        }
        .total-section { 
          margin-top: 20px; 
          text-align: center; 
          background: #f8f9fa; 
          padding: 15px; 
          border: 1px solid #ddd;
        }
        .total-amount { 
          font-size: 20px; 
          font-weight: bold; 
          color: #28a745; 
          margin: 10px 0;
        }
        .amount-in-words { 
          margin-top: 8px; 
          font-style: italic; 
          color: #666; 
          font-size: 11px;
        }
        .benefits-section {
          margin-top: 20px;
        }
        .benefits-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #333;
          font-size: 13px;
        }
        .benefits-description {
          font-size: 10px;
          color: #666;
          margin-bottom: 10px;
          font-style: italic;
        }
        .benefits-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }
        .benefits-table th, .benefits-table td {
          padding: 6px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .benefits-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .system-generated {
          text-align: center;
          margin-top: 20px;
          font-size: 10px;
          color: #999;
          font-style: italic;
        }
        @media print { 
          body { background: white; margin: 0; font-size: 11px; }
          .payslip-container { box-shadow: none; margin: 0; }
          .net-pay-summary, .total-section { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="payslip-container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <h1>${data.company.name}</h1>
            <p>${data.company.address}</p>
          </div>
          <div class="payslip-period">
            <p>Payslip For the Month</p>
            <h2>${data.company.payslipMonth || data.company.payslip_month}</h2>
          </div>
        </div>

        <!-- Content -->
        <div class="content">
          <!-- Employee Summary -->
          <div class="employee-summary">
            <div class="section-title">Employee Summary</div>
            <div class="detail-row">
              <span>Employee Name:</span>
              <span>${data.employee.name}</span>
            </div>
            <div class="detail-row">
              <span>Designation:</span>
              <span>${data.employee.designation}</span>
            </div>
            <div class="detail-row">
              <span>Employee ID:</span>
              <span>${data.employee.employeeId}</span>
            </div>
            <div class="detail-row">
              <span>MOL ID:</span>
              <span>${data.employee.molId}</span>
            </div>
            <div class="detail-row">
              <span>Date of Joining:</span>
              <span>${data.employee.dateOfJoining}</span>
            </div>
            <div class="detail-row">
              <span>Pay Period:</span>
              <span>${data.employee.payPeriod}</span>
            </div>
            <div class="detail-row">
              <span>Pay Date:</span>
              <span>${data.employee.payDate}</span>
            </div>
            <div class="detail-row">
              <span>Bank Account No:</span>
              <span>${data.employee.bankAccount}</span>
            </div>
          </div>

          <!-- Net Pay Summary -->
          <div class="net-pay-summary">
            <div class="net-pay-amount">${this.getcurrency()} ${data.netPay.netPay.toFixed(2)}</div>
            <div style="color: #28a745; font-weight: bold;">Total Net Pay</div>
            <div style="margin-top: 15px;">
              <div class="detail-row">
                <span>Paid Days:</span>
                <span>${data.paySummary.payableDays}</span>
              </div>
              <div class="detail-row">
                <span>LOP Days:</span>
                <span>${data.paySummary.lopDays}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Earnings and Deductions -->
        <div class="earnings-deductions">
          <table class="table">
            <thead>
              <tr>
                <th>EARNINGS</th>
                <th class="amount">AMOUNT</th>
                <th>DEDUCTIONS</th>
                <th class="amount">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateEarningsDeductionsRows(data.earnings.items, data.deductions.items, data.earnings.grossEarnings, data.deductions.totalDeductions)}
            </tbody>
          </table>
        </div>

        <!-- Total Net Payable -->
        <div class="total-section">
          <div class="section-title">TOTAL NET PAYABLE</div>
          <p>Gross Earnings - Total Deductions</p>
          <div class="total-amount">${this.getcurrency()} ${data.netPay.netPay.toFixed(2)}</div>
          <div class="amount-in-words">
            Amount In Words: ${data.netPay.amountInWords}
          </div>
        </div>

        <!-- Benefits Section -->
        <div class="benefits-section">
          <div class="benefits-title">Benefits Summary</div>
          <div class="benefits-description">This section provides a detailed breakdown of benefit contributions made by both you and your employer.</div>
          <table class="benefits-table">
            <thead>
              <tr>
                <th>BENEFITS</th>
                <th class="amount">EMPLOYEE CONTRIBUTION</th>
                <th class="amount">EMPLOYER CONTRIBUTION</th>
              </tr>
            </thead>
            <tbody>
              ${this.generateBenefitsRows(this.payslipData.benefits || [])}
              <tr style="font-weight: bold; background-color: #f8f9fa;">
                <td>Total Benefits:</td>
                <td class="amount">${this.formatCurrency(this.payslipData.benefits?.employee_value || 0)}</td>
                <td class="amount">${this.formatCurrency(this.payslipData.benefits?.employer_value || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="system-generated">
          --- This is a system-generated document. ---
        </div>
      </div>
    </body>
    </html>
    `;
  }

  generateEarningsDeductionsRows(earnings: any[], deductions: any[], grossEarnings: number, totalDeductions: number): string {
    const maxRows = Math.max(earnings.length, deductions.length);
    let rows = '';
    
    for (let i = 0; i < maxRows; i++) {
      const earning = earnings[i] || {};
      const deduction = deductions[i] || {};
      
      rows += `
        <tr>
          <td>${earning.name || earning.head_type_name_display || ''}</td>
          <td class="amount">${earning.name ? this.formatCurrency(earning.amount || earning.value) : ''}</td>
          <td>${deduction.name || deduction.head_type_name_display || ''}</td>
          <td class="amount">${deduction.name ? this.formatCurrency(deduction.amount || deduction.value) : ''}</td>
        </tr>
      `;
    }
    
    // Add totals row using the passed parameters
    rows += `
      <tr style="font-weight: bold; border-top: 2px solid #333;">
        <td>Gross Earnings</td>
        <td class="amount">${this.formatCurrency(grossEarnings)}</td>
        <td>Total Deductions</td>
        <td class="amount">${this.formatCurrency(totalDeductions)}</td>
      </tr>
    `;
    
    return rows;
  }

  numberToWords(num: number): string {
    // Simple number to words conversion for UAE Dirhams
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num === 0) return 'Zero';
    
    const integerPart = Math.floor(num);
    const decimalPart = Math.round((num - integerPart) * 100);
    
    let result = this.convertHundreds(integerPart);
    if (decimalPart > 0) {
      result += ' and ' + this.convertHundreds(decimalPart) + ' Fils';
    }
    
    return result;
  }

  convertHundreds(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) {
      const hundreds = ones[Math.floor(num / 100)] + ' Hundred';
      const remainder = num % 100;
      return hundreds + (remainder ? ' ' + this.convertHundreds(remainder) : '');
    }
    if (num < 100000) {
      const thousands = this.convertHundreds(Math.floor(num / 1000)) + ' Thousand';
      const remainder = num % 1000;
      return thousands + (remainder ? ' ' + this.convertHundreds(remainder) : '');
    }
    return 'Very Large Number';
  }

  sendPayslip(): void {
    console.log('Sending payslip for:', this.employee?.employee_name);
    // Implement payslip sending functionality
    alert('Payslip sending functionality will be implemented');
  }



  closeDrawer(): void {
    // Emit event to parent component to close the drawer
    this.drawerClosed.emit();
  }

  formatDate(date: string): string {
    if (!date) return '';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  generateBenefitsRows(benefits: any[]): string {
    if (!benefits || benefits.length === 0) {
      return '<tr><td colspan="3" class="text-center">No benefits data available</td></tr>';
    }

    let rows = '';
    benefits.forEach((benefit: any) => {
      rows += `
        <tr>
          <td>${benefit.head_type_name_display || benefit.pension_name || 'Unknown Benefit'}:</td>
          <td class="amount">${this.formatCurrency(benefit.employee_value || 0)}</td>
          <td class="amount">${this.formatCurrency(benefit.employer_value || 0)}</td>
        </tr>
      `;
    });

    return rows;
  }

  calculateTotalEmployeeContribution(benefits: any[]): number {
    if (!benefits || benefits.length === 0) return 0;
    return benefits.reduce((total: number, benefit: any) => {
      return total + (benefit.employee_value || 0);
    }, 0);
  }

  calculateTotalEmployerContribution(benefits: any[]): number {
    if (!benefits || benefits.length === 0) return 0;
    return benefits.reduce((total: number, benefit: any) => {
      return total + (benefit.employer_value || 0);
    }, 0);
  }
}

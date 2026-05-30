import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'app-detailsalary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './detailsalary.html',
  styleUrl: './detailsalary.scss'
})
export class DetailsalaryComponent implements OnInit {
  salaryForm: FormGroup;
  
  // Salary calculation properties
  totalMonthlyCost = 0;
  totalAnnualCost = 0;
  inHandMonthlySalary = 0;
  grossMonthlyEarnings = 0;
  grossAnnualEarnings = 0;
  totalMonthlyDeductions = 0;
  totalAnnualDeductions = 0;
  totalMonthlyBenefits = 0;
  totalAnnualBenefits = 0;
  netMonthlySalary = 0;
  netAnnualSalary = 0;

  // Salary structure properties
  salaryStructures: any[] = [];
  filteredSalaryStructures: any[] = [];
  salaryStructureSearchTerm = '';
  showSalaryStructureDropdown = false;

  // Payroll heads
  earning: any[] = [];
  deduction: any[] = [];
  benefit: any[] = [];

  // Dropdown states
  showEarningsDropdown: boolean[] = [];
  showDeductionsDropdown: boolean[] = [];
  showBenefitsDropdown: boolean[] = [];
  filteredEarnings: any[][] = [];
  filteredDeductions: any[][] = [];
  filteredBenefits: any[][] = [];

  constructor(private fb: FormBuilder) {
    this.salaryForm = this.fb.group({
      salaryDetails: this.fb.group({
        annualCTC: [0, Validators.required],
        earnings: this.fb.array([]),
        deductions: this.fb.array([]),
        benefits: this.fb.array([])
      })
    });
  }

  ngOnInit(): void {
    this.getSalaryStructures();
    this.getPayrollheads();
    this.addEarningsRow();
    this.addDeductionsRow();
    this.addBenefitsRow();
  }

  // Getters for form arrays
  get earnings() {
    return this.salaryForm.get('salaryDetails.earnings') as FormArray;
  }

  get deductions() {
    return this.salaryForm.get('salaryDetails.deductions') as FormArray;
  }

  get benefits() {
    return this.salaryForm.get('salaryDetails.benefits') as FormArray;
  }

  // Salary Structure methods
  getSalaryStructures() {
    // Mock data - replace with actual API call
    this.salaryStructures = [
      { id: 1, name: 'Standard Structure', description: 'Basic salary structure with common components', total_components: 8 },
      { id: 2, name: 'Executive Structure', description: 'Premium structure for senior positions', total_components: 12 }
    ];
    this.filteredSalaryStructures = [...this.salaryStructures];
  }

  getPayrollheads() {
    // Mock data - replace with actual API call
    this.earning = [
      { id: 1, head_name: 'Basic Salary' },
      { id: 2, head_name: 'Housing Allowance' },
      { id: 3, head_name: 'Transport Allowance' },
      { id: 4, head_name: 'Fixed Allowance' }
    ];
    this.deduction = [
      { id: 1, head_name: 'Income Tax' },
      { id: 2, head_name: 'Insurance' },
      { id: 3, head_name: 'Loan Repayment' }
    ];
    this.benefit = [
      { id: 1, head_name: 'Health Insurance' },
      { id: 2, head_name: 'Life Insurance' },
      { id: 3, head_name: 'Gratuity' }
    ];
  }

  // Salary structure search methods
  onSalaryStructureFocus() {
    this.showSalaryStructureDropdown = true;
  }

  onSalaryStructureInput(event: any) {
    const value = event.target.value;
    this.salaryStructureSearchTerm = value;
    this.filteredSalaryStructures = this.salaryStructures.filter(structure =>
      structure.name.toLowerCase().includes(value.toLowerCase()) ||
      structure.description.toLowerCase().includes(value.toLowerCase())
    );
    this.showSalaryStructureDropdown = true;
  }

  onSalaryStructureBlur() {
    setTimeout(() => {
      this.showSalaryStructureDropdown = false;
    }, 200);
  }

  selectSalaryStructure(structure: any) {
    this.salaryStructureSearchTerm = structure.name;
    this.showSalaryStructureDropdown = false;
    // Apply salary structure logic here
  }

  // Earnings methods
  addEarningsRow() {
    const earningsGroup = this.fb.group({
      head_name: ['', Validators.required],
      calculation_type: [1, Validators.required],
      calculation_value: [0, Validators.required],
      monthly_value: [0],
      annual_value: [0]
    });
    this.earnings.push(earningsGroup);
    this.showEarningsDropdown.push(false);
    this.filteredEarnings.push([]);
  }

  removeEarningsRow(index: number) {
    this.earnings.removeAt(index);
    this.showEarningsDropdown.splice(index, 1);
    this.filteredEarnings.splice(index, 1);
    this.onCalculationTypeChange();
  }

  onEarningsFocus(index: number) {
    this.showEarningsDropdown[index] = true;
  }

  onEarningsInput(index: number, event: any) {
    const value = event.target.value;
    this.filteredEarnings[index] = this.earning.filter(item =>
      item.head_name.toLowerCase().includes(value.toLowerCase())
    );
    this.showEarningsDropdown[index] = true;
  }

  onEarningsBlur(index: number) {
    setTimeout(() => {
      this.showEarningsDropdown[index] = false;
    }, 200);
  }

  selectEarning(index: number, item: any) {
    this.earnings.at(index).patchValue({ head_name: item.head_name });
    this.showEarningsDropdown[index] = false;
    this.onCalculationTypeChange();
  }

  // Deductions methods
  addDeductionsRow() {
    const deductionsGroup = this.fb.group({
      head_name: ['', Validators.required],
      calculation_type: [1, Validators.required],
      calculation_value: [0, Validators.required],
      monthly_value: [0],
      annual_value: [0]
    });
    this.deductions.push(deductionsGroup);
    this.showDeductionsDropdown.push(false);
    this.filteredDeductions.push([]);
  }

  removeDeductionsRow(index: number) {
    this.deductions.removeAt(index);
    this.showDeductionsDropdown.splice(index, 1);
    this.filteredDeductions.splice(index, 1);
    this.onCalculationTypeChange();
  }

  onDeductionsFocus(index: number) {
    this.showDeductionsDropdown[index] = true;
  }

  onDeductionsInput(index: number, event: any) {
    const value = event.target.value;
    this.filteredDeductions[index] = this.deduction.filter(item =>
      item.head_name.toLowerCase().includes(value.toLowerCase())
    );
    this.showDeductionsDropdown[index] = true;
  }

  onDeductionsBlur(index: number) {
    setTimeout(() => {
      this.showDeductionsDropdown[index] = false;
    }, 200);
  }

  selectDeduction(index: number, item: any) {
    this.deductions.at(index).patchValue({ head_name: item.head_name });
    this.showDeductionsDropdown[index] = false;
    this.onCalculationTypeChange();
  }

  // Benefits methods
  addBenefitsRow() {
    const benefitsGroup = this.fb.group({
      head_name: ['', Validators.required],
      calculation_type: [1, Validators.required],
      calculation_value: [0, Validators.required],
      monthly_value: [0],
      annual_value: [0]
    });
    this.benefits.push(benefitsGroup);
    this.showBenefitsDropdown.push(false);
    this.filteredBenefits.push([]);
  }

  removeBenefitsRow(index: number) {
    this.benefits.removeAt(index);
    this.showBenefitsDropdown.splice(index, 1);
    this.filteredBenefits.splice(index, 1);
    this.onCalculationTypeChange();
  }

  onBenefitsFocus(index: number) {
    this.showBenefitsDropdown[index] = true;
  }

  onBenefitsInput(index: number, event: any) {
    const value = event.target.value;
    this.filteredBenefits[index] = this.benefit.filter(item =>
      item.head_name.toLowerCase().includes(value.toLowerCase())
    );
    this.showBenefitsDropdown[index] = true;
  }

  onBenefitsBlur(index: number) {
    setTimeout(() => {
      this.showBenefitsDropdown[index] = false;
    }, 200);
  }

  selectBenefit(index: number, item: any) {
    this.benefits.at(index).patchValue({ head_name: item.head_name });
    this.showBenefitsDropdown[index] = false;
    this.onCalculationTypeChange();
  }

  // Calculation methods
  onCalculationTypeChange() {
    this.calculateSalaries();
  }

  calculateSalaries() {
    // Calculate earnings
    this.grossMonthlyEarnings = 0;
    this.grossAnnualEarnings = 0;
    
    this.earnings.controls.forEach(control => {
      const monthlyValue = control.get('monthly_value')?.value || 0;
      this.grossMonthlyEarnings += monthlyValue;
    });
    this.grossAnnualEarnings = this.grossMonthlyEarnings * 12;

    // Calculate deductions
    this.totalMonthlyDeductions = 0;
    this.totalAnnualDeductions = 0;
    
    this.deductions.controls.forEach(control => {
      const monthlyValue = control.get('monthly_value')?.value || 0;
      this.totalMonthlyDeductions += monthlyValue;
    });
    this.totalAnnualDeductions = this.totalMonthlyDeductions * 12;

    // Calculate benefits
    this.totalMonthlyBenefits = 0;
    this.totalAnnualBenefits = 0;
    
    this.benefits.controls.forEach(control => {
      const monthlyValue = control.get('monthly_value')?.value || 0;
      this.totalMonthlyBenefits += monthlyValue;
    });
    this.totalAnnualBenefits = this.totalMonthlyBenefits * 12;

    // Calculate net salary
    this.netMonthlySalary = (this.grossMonthlyEarnings - this.totalMonthlyDeductions) + this.totalMonthlyBenefits;
    this.netAnnualSalary = this.netMonthlySalary * 12;
  }

  onSubmit() {
    if (this.salaryForm.valid) {
      console.log('Salary form submitted:', this.salaryForm.value);
      // Handle form submission
    }
  }
}

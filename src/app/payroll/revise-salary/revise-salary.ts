import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../core/services/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '../../core/services/toast.service';
import { log } from 'console';

interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  emp_id: string;
}

interface PreviousSalary {
  annual: number;
  monthly: number;
}

interface SalaryTemplate {
  id: number;
  name: string;
}

interface Earning {
  id: number;
  name: string;
  calculationType: string;
  monthlyAmount: number;
  annualAmount: number;
}

interface PayoutPreferences {
  effectiveFrom: string;
  payoutMonth: string;
  reason: string;
}

interface TotalGrossPay {
  monthly: number;
  annual: number;
}

@Component({
  selector: 'app-revise-salary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './revise-salary.html',
  styleUrl: './revise-salary.scss'
})
export class ReviseSalary implements OnInit, OnDestroy {
  employee: any | null = null;
  previousSalary: any = { annual: 0, monthly: 0 };
  selectedTemplate: string = '';
  salaryTemplates: any[] = [];
  earnings: any[] = [];
  totalGrossPay: TotalGrossPay = { monthly: 0, annual: 0 };

  // Form properties
  salaryForm: FormGroup;
  private destroy$ = new Subject<void>();

  // Salary Structure properties
  salaryStructures: any[] = [];
  selectedSalaryStructure: any = null;
  showSalaryStructureDropdown = false;
  salaryStructureSearchTerm = '';
  filteredSalaryStructures: any[] = [];
  
  // Payroll heads for component selection
  earning: any[] = [];
  deduction: any[] = [];
  benefit: any[] = [];
  
  // Search and select properties for earnings
  showEarningsDropdown: boolean[] = [];
  filteredEarnings: any[][] = [];
  earningsSearchTerms: string[] = [];
  
  // Salary calculation properties
  grossMonthlyEarnings = 0;
  grossAnnualEarnings = 0;
  totalMonthlyDeductions = 0;
  totalAnnualDeductions = 0;
  totalMonthlyBenefits = 0;
  totalAnnualBenefits = 0;
  netMonthlySalary = 0;
  netAnnualSalary = 0;

  // Salary data for structure
  salaryData: any;
  isPopulatingFromStructure = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: Api,
    private fb: FormBuilder,
    private toast: ToastService
  ) {
    this.salaryForm = this.fb.group({
      salaryStructure: [null],
      salaryStructureName: [''],
      annualCTC: [0],
      earnings: this.fb.array([]),
      deductions: this.fb.array([]),
      benefits: this.fb.array([]),
      grossMonthlyEarnings: [0],
      grossAnnualEarnings: [0],
      totalMonthlyDeductions: [0],
      totalAnnualDeductions: [0],
      totalMonthlyBenefits: [0],
      totalAnnualBenefits: [0],
      netMonthlySalary: [0],
      netAnnualSalary: [0],
      payout_month: [''],
      revised_salary_effective_from: [''],
      reason: ['']
    });
  }

  ngOnInit(): void {
    this.initializeMonthInputs();
    this.loadEmployeeData();
    this.getSalaryStructures();
    this.getPayrollheads();
    this.getSalaryheads();
    
    // Get salary data from router state - try multiple approaches
    const navigation = this.router.getCurrentNavigation();
    this.salaryData = navigation?.extras?.state?.['salaryData'];
    
    // Fallback: check if data is in history state
    if (!this.salaryData && (window as any).history?.state?.salaryData) {
      this.salaryData = (window as any).history.state.salaryData;
      console.log('Found Revise salaryData in history:', this.salaryData);
    }    
    if(this.salaryData){
      this.patchEarningsArray(this.salaryData);
      this.toast.show('Revise Salary', 'Salary already revised and approved', 'success');
    } else {
      console.log('No salary data provided, will load from employee data');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 // apply_revised_salary/
  applyRevisedSalary(): void {
    this.api.post('/employee/apply_revised_salary/', {}).subscribe((response: any) => {
      if(response.status == 200){
        console.log('Revised salary applied:', response);
      }
    });
  }
  initializeMonthInputs(): void {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
    
    // Set default values for month inputs (YYYY-MM-DD format for API)
    const monthStr = currentMonth.toString().padStart(2, '0');
    this.salaryForm.get('revised_salary_effective_from')?.setValue(`${currentYear}-${monthStr}-01`);
    this.salaryForm.get('payout_month')?.setValue(`${currentYear}-${monthStr}-01`);
  }

  loadEmployeeData(): void {
    const employeeId = this.route.snapshot.paramMap.get('id');
    if (employeeId) {
      // Load employee data from API
      this.api.get(`/employee/get_employee/${employeeId}/`).subscribe((response: any) => {
        if (response.status === 200) {
          this.employee = response.data;
          console.log(this.employee, 'employee');
          this.selectedSalaryStructure = this.employee.salary_components[0];
          this.salaryStructureSearchTerm = this.employee.salary_components[0]?.salaryStructureName;
          this.selectSalaryStructure(this.selectedSalaryStructure);
          this.salaryForm.get('salaryStructureName')?.patchValue(this.employee.salary_components[0]?.salaryStructureName);
          console.log(this.salaryForm.get('salaryStructureName')?.value,this.salaryForm.value, 'salaryStructureName');
          
          this.previousSalary = {
            annual: this.employee.salary_components[0]?.grossAnnualEarnings || 0,
            monthly: this.employee.salary_components[0]?.grossMonthlyEarnings || 0
          };
          
          // Check if we can patch earnings now that employee data is loaded
          this.checkAndPatchEarnings();
        }
      });
    }
  }

  patchEarningsArray(earningsData: any[]): void {
    if (!this.salaryData[0]?.id) {
      console.warn('Salary data not available, cannot patch earnings array');
      return;
    }
    console.log(earningsData, 'earningsData');
    
    // Clear existing earnings array
    this.clearEarningsForm();
    
    // Add earnings data to the form array
    earningsData.forEach((earning: any) => {
      this.earningsArray.push(this.createEarningItemFromStructure({
        head_id: earning.head_id || earning.id,
        head_name: earning.head_name,
        calculation_value: earning.calculation_value || 0,
        calculation_type: earning.calculation_type || 1,
        monthly_value: earning.monthly_value || earning.calculation_value || 0,
        annual_value: earning.annual_value || (earning.monthly_value || earning.calculation_value || 0) * 12,
        category_name: earning.category_name || earning.head_name,
        calculation_type_name: earning.calculation_type_name || this.getCalculationTypeName(earning.calculation_type || 1)
      }, false));
    });
    
    // Recalculate totals
    this.calculateSalary();
  }

  checkAndPatchEarnings(): void {
    // Check if both employee data and salary data are available
    if (this.employee && this.salaryData && this.employee.salary_components && this.employee.salary_components[0]?.earnings) {
      this.patchEarningsArray(this.employee.salary_components[0].earnings);
    }
  }

  // Getter for form arrays
  get earningsArray(): FormArray {
    return this.salaryForm.get('earnings') as FormArray;
  }

  get deductionsArray(): FormArray {
    return this.salaryForm.get('deductions') as FormArray;
  }

  get benefitsArray(): FormArray {
    return this.salaryForm.get('benefits') as FormArray;
  }

  // Salary Structure methods
  getSalaryStructures(): void {
    this.api.get('/employee/list_salary_component_maps/').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.salaryStructures = res.data;
          this.filteredSalaryStructures = [...this.salaryStructures];
          console.log('Salary structures loaded:', this.salaryStructures);
        }
      },
      error: (error) => {
        console.error('Error loading salary structures:', error);
      }
    });
  }

  getPayrollheads(): void {
    this.api.get('/employee/distributed_payroll_list/').subscribe({
      next: (res: any) => {
        if (res.status === 200 && res.data) {
          this.earning = res.data.Earning || [];
          this.deduction = res.data.Deduction || [];
          this.benefit = res.data.Benefits || [];
          console.log('Payroll heads loaded:', res.data);
        }
      },
      error: (error) => {
        console.error('Error loading payroll heads:', error);
      }
    });
  }

  getSalaryheads(): void {
    this.api.get('/employee/grouped_payroll_heads/').subscribe((res: any) => {
        if (res.status === 200) {
          this.salaryData = res.data;
          
          // Check if we can patch earnings now that salary data is loaded
          this.checkAndPatchEarnings();
          
          console.log('Salary heads loaded:', this.salaryData);
        }
      });
  }

    selectEarning(index: number, earning: any) {
        console.log('working', earning, index);
        
        console.log(earning, 'earning', index, 'index');
        
        const row = this.earnings.at(index);
        row.patchValue({
          head: earning.head_id || earning.id,
          head_name: earning.head_name,
          calculation_value: Number(earning.calculation_value) || 0,
          calculation_type: earning.calculation_type || 1,
          calculation_type_name: earning.calculation_type_name || 'Fixed'
        });
        this.earningsSearchTerms[index] = earning.head_name;
        this.showEarningsDropdown[index] = false;
      }
    onHeadChange(index: number) {
      console.log(index);
      
      const a = this.earningsArray.at(index) as FormGroup;
        const selectedValue = a.get('head_name')?.value;
    
    console.log(selectedValue, 'selected head');
    
      // Find the selected head from salaryData
      const selectedHead = this.salaryData[index]?.heads.find(
        (head: any) => head.head_name === selectedValue
      );
    console.log(selectedHead, 'selected head details');
    
      const earningGroup = this.earnings.at(index) as FormGroup;
    
      if (selectedHead) {
        earningGroup.patchValue({
          head_name: selectedHead.head_name,
          head: selectedHead.head_id || selectedHead.id,
          calculation_type: selectedHead.calculation_type || 1,
          calculation_value: this.safeNumber(selectedHead.calculation_value || 0),
          calculation_type_name: this.getCalculationTypeName(selectedHead.calculation_type || 1),
          monthly_value: this.safeNumber(selectedHead.monthly_value || 0),
          annual_value: this.safeNumber(selectedHead.annual_value || 0)
        });
    
        console.log('Updated earning row:', earningGroup.value);
    
        // earningGroup.get('isDropdown')?.setValue(false);
      }else{
        earningGroup.patchValue({
          head_name: '',
          head: null,
          calculation_type: 1,
          calculation_value: 0,
          calculation_type_name: 'Fixed',
          monthly_value: 0,
          annual_value: 0
        });
      }
    }
    
  createEarningItemFromStructure(earning: any, isDropdown = false): FormGroup {
    console.log('Create:', earning, 'isDropdown:', isDropdown);
    const hasHeads = this.salaryData ? this.salaryData.some((cat: { heads: any[]; }) =>
      cat.heads && cat.heads.some((h: any) => h.head_name === earning.head_name)
    ) : false;
  
    console.log(
      `Creating earning item for ${earning.head_name}, hasHeads:`,
      hasHeads
    );
    console.log(earning, 'earning');
    
    return this.fb.group({
      head: [earning.head_id || earning.id],
      head_name: [earning.head_name || ''],
      calculation_value: [earning.calculation_value || 0],
      calculation_type: [earning.calculation_type || 1],
      calculation_type_name: [this.getCalculationTypeName(earning.calculation_type || 1)],
      monthly_value: [this.safeNumber(earning.monthly_value)],
      annual_value: [this.safeNumber(earning.annual_value)],
      head_type: [earning.head_type || 1],
      head_type_name: [earning.head_type_name || 'Earning'],
      isDropdown: [hasHeads],   // ✅ store whether dropdown should show
      category_name: [earning.category_name || earning.head_name || 'Earning'] // ✅ store category name
    });
  }

  onTemplateChange(): void {
    if (this.selectedTemplate) {
      this.selectSalaryStructure(this.selectedTemplate);
    }
  }

filterSalaryStructures() {
  this.filteredSalaryStructures = this.salaryStructures.filter(structure =>
    structure.name.toLowerCase().includes(this.salaryStructureSearchTerm)
    // structure.description.toLowerCase().includes(this.salaryStructureSearchTerm)
  );
}
  selectSalaryStructure(structure: any) {
    console.log('=== SELECT SALARY STRUCTURE DEBUG ===');
    console.log('selectSalaryStructure called with:', structure);
    
    this.selectedSalaryStructure = structure;
    this.salaryForm.get('salaryStructure')?.setValue(structure.component_map_id);
    // this.salaryStructureSearchTerm = structure.name;
    this.showSalaryStructureDropdown = false;
    
    console.log('Structure details:', {
      id: structure.component_map_id,
      name: structure.name,
      earnings: structure.earnings,
      earningsCount: structure.earnings?.length || 0
    });
    
    if (structure.earnings && structure.earnings.length > 0) {
      console.log('=== EARNINGS DATA FROM API ===');
      structure.earnings.forEach((earning: any, index: number) => {
        console.log(`Earning earning in structure from API:`, {
          head_id: earning.head_id || earning.id,
          head_name: earning.head_name,
          calculation_type: earning.calculation_type,
          calculation_value: earning.calculation_value,
          monthly_value: earning.monthly_value,
          annual_value: earning.annual_value,
          monthly_value_type: typeof earning.monthly_value,
          annual_value_type: typeof earning.annual_value,
          monthly_value_raw: earning.monthly_value,
          annual_value_raw: earning.annual_value
        });
        
      });
    }
    
    // Populate form arrays with structure data
    this.populateEarningsFromStructure(structure);
  }

  clearEarningsForm(): void {
    while (this.earningsArray.length !== 0) {
      this.earningsArray.removeAt(0);
    }
  }

  populateEarningsFromStructure(component: any): void {
    console.log('populateEarningsFromStructure called with:', component);
    this.earningsArray.clear();

    if (component && component.earnings) {
      component.earnings.forEach((earning: any, index: number) => {
   
        const newIndex = this.earningsArray.length;
        
         const earningFormGroup = this.createEarningItemFromStructure(earning); 
         this.earningsArray.push(earningFormGroup);
         this.showEarningsDropdown[newIndex] = false;
         this.earningsSearchTerms[newIndex] = '';
         this.filteredEarnings[newIndex] = [...this.earning];
         // this.earnings.push(a);
         console.log(this.earningsArray, 'this.earnings 241023');
      });
    }
    this.calculateSalary();
  }

  onMonthlyAmountChange(index: number): void {
    // Skip recalculation if we're populating from structure
    if (this.isPopulatingFromStructure) {
      return;
    }
    
    const row = this.earningsArray.at(index);
    const monthlyAmount = parseFloat(row.get('monthly_value')?.value || '0');
    const calculationType = parseInt(row.get('calculation_type')?.value || '1');
    const calculationValue = parseFloat(row.get('calculation_value')?.value || '0');
    
    let calculatedMonthly = monthlyAmount;
    
    if (calculationType === 2) { // Percentage of Basic
      const basicRow = this.earningsArray.controls.find(c => c.get('head_name')?.value?.toLowerCase().includes('basic'));
      if (basicRow) {
        const basicAmount = parseFloat(basicRow.get('monthly_value')?.value || '0');
        calculatedMonthly = (basicAmount * calculationValue) / 100;
        row.patchValue({ monthly_value: calculatedMonthly }, { emitEvent: false });
      }
    }
    
    // Update annual value
    const annualAmount = calculatedMonthly * 12;
    row.patchValue({ annual_value: annualAmount }, { emitEvent: false });
    
    this.calculateSalary();
  }

  calculateSalary(): void {
    const earningsControls = this.earningsArray.controls;
    
    if (earningsControls.length > 0) {
      // Calculate gross earnings
      this.grossMonthlyEarnings = earningsControls.reduce((sum, ctrl) => {
        return sum + (ctrl.get('monthly_value')?.value || 0);
      }, 0);
      
      this.grossAnnualEarnings = earningsControls.reduce((sum, ctrl) => {
        return sum + (ctrl.get('annual_value')?.value || 0);
      }, 0);
      
      // Update form values
      this.salaryForm.patchValue({
        grossMonthlyEarnings: this.grossMonthlyEarnings,
        grossAnnualEarnings: this.grossAnnualEarnings
      });
      
      // Update total gross pay
      this.totalGrossPay = {
        monthly: this.grossMonthlyEarnings,
        annual: this.grossAnnualEarnings
      };
    }
  }

  safeNumber(value: any): number {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  getCalculationTypeName(type: number): string {
    const types: { [key: number]: string } = {
      1: 'Fixed',
      2: '% of Basic',
      3: 'Other'
    };
    return types[type] || 'Fixed';
  }

  toggleEarningDetails(index: number): void {
    // Toggle earning details if needed
    console.log('Toggle details for earning:', index);
  }

  // Salary structure search methods
  onSalaryStructureFocus(): void {
    this.showSalaryStructureDropdown = true;
  }

  onSalaryStructureInput(event: any): void {
    this.salaryStructureSearchTerm = event.target.value;
    this.filteredSalaryStructures = this.salaryStructures.filter(structure =>
      structure.name.toLowerCase().includes(this.salaryStructureSearchTerm.toLowerCase())
    );
  }

  onSalaryStructureBlur(): void {
    // Delay hiding to allow for click events
    setTimeout(() => {
      this.showSalaryStructureDropdown = false;
    }, 200);
  }

  onCalculationValueChange(index: number): void {
    this.onMonthlyAmountChange(index);
  }

  formatCurrency(amount: number): string {
    return `AED${amount.toFixed(2)}`;
  }

  onEffectiveFromChange(event: any): void {
    const monthYear = event.target.value; // Format: YYYY-MM
    if (monthYear) {
      // Set the first day of the selected month in YYYY-MM-DD format
      const effectiveDate = `${monthYear}-01`;
      this.salaryForm.get('revised_salary_effective_from')?.setValue(effectiveDate);
    }
  }

  onPayoutMonthChange(event: any): void {
    const monthYear = event.target.value; // Format: YYYY-MM
    if (monthYear) {
      // Set the first day of the selected month in YYYY-MM-DD format
      const payoutDate = `${monthYear}-01`;
      this.salaryForm.get('payout_month')?.setValue(payoutDate);
    }
  }

  // Helper method to get YYYY-MM format for month input display
  getMonthInputValue(dateValue: string): string {
    if (dateValue && dateValue.includes('-')) {
      return dateValue.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD
    }
    return dateValue || '';
  }

  saveAndApprove(): void {
    const formData = this.salaryForm.value;
    console.log(formData, 'formData');
    
    this.initializeMonthInputs()
    const salaryRevisionData = {
      employee: this.employee?.id,
      company: this.api.getCompanyId(),
      salaryStructure: formData.salaryStructure,
      salaryStructureName: formData.salaryStructureName,
      annual_ctc: formData.annualCTC,
      earnings: formData.earnings,
      deductions: formData.deductions,
      benefits: formData.benefits,
      gross_monthly_earnings: formData.grossMonthlyEarnings,
      gross_annual_earnings: formData.grossAnnualEarnings,
      payout_month: formData.payout_month,
      revised_salary_effective_from: formData.revised_salary_effective_from,
      reason: formData.reason,
      total_monthly_deductions: formData.totalMonthlyDeductions,
      total_annual_deductions: formData.totalAnnualDeductions,
      total_monthly_benefits: formData.totalMonthlyBenefits,
      total_annual_benefits: formData.totalAnnualBenefits,
      net_monthly_salary: formData.netMonthlySalary,
      net_annual_salary: formData.netAnnualSalary,
      id: this.salaryData[0].id
    };
    if(this.salaryData[0]?.id){
      salaryRevisionData.id = this.salaryData[0].id;
      // /employee/update_revise_salary_structure/1/
      this.api.put(`/employee/update_revise_salary_structure/${this.salaryData[0].id}/`, salaryRevisionData).subscribe((response: any) => {
        if (response.status === 200) {
          console.log('Salary revision updated:', response);
          this.toast.show('Salary Revision', 'Salary revision updated', 'success');
          this.router.navigate(['/payroll/employee-view-details', this.employee?.id],{
            state: { tab: 'salary' }
          });
        }
      });
    }else{
      salaryRevisionData.id = null;
    this.api.post('/employee/create_revise_salary_structure/', salaryRevisionData).subscribe((response: any) => {
      if (response.status === 200) {
        console.log('Salary revision saved:', response);
        this.toast.show('Salary Revision', 'Salary revision saved and approved', 'success');
        this.router.navigate(['/payroll/employee-view-details', this.employee?.id],{
          state: { tab: 'salary' }
        });
      }
    });
  }
  }

  cancelRevision(): void {
    this.router.navigate(['/payroll/employee-view-details', this.employee?.id],{
      state: { tab: 'salary' }
    });
  }

  closeRevision(): void {
    this.router.navigate(['/payroll/employee-view-details', this.employee?.id], {
      state: { tab: 'salary' }
    });
  }
}

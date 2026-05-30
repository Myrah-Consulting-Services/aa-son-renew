import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { NgbDropdownModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { Deduction } from '../deduction/deduction';
import { Benefit } from '../benefit/benefit';
import { ToastService } from '../../core/services/toast.service';

interface PayrollHead {
  id?: number;
  head_name: string;
  head_type: number; // 1: Earning, 2: Deduction, 3: Benefits
  calculation_type: number; // 1: Fixed, 2: Percentage
  calculation_value: number;
  is_customizable: boolean;
  active?: boolean;
  // description?: string;
}

interface SocialSecurityBenefit {
  id: string;
  name: string;
  checked: boolean;
}

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,FormsModule, NgbDropdownModule],
  templateUrl: './salary.html',
  styleUrl: './salary.scss'
})
export class Salary implements OnInit {
  activeTab: 'earnings' | 'benefits' | 'deductions' = 'earnings';
  showModal = false;
  isEditing = false;
  editingComponent: PayrollHead | null = null;
  showAddDropdown = false;
  selectedComponentType: 'Earning' | 'Correction' | 'Deduction' | 'Benefits' | '' = '';
  salaryForm: FormGroup;
  
  // Toast message properties
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' | 'warning' = 'success';
  isSubmitting = false;
  isModalLoading = false;

  // Social security benefits disabled state
  disabledSocialSecurityBenefits: { [key: string]: boolean } = {};

  // UAE Social Security Benefits
  socialSecurityBenefits: SocialSecurityBenefit[] = [
    { id: 'gpssa', name: 'General Pension And Social Security Authority (GPSSA)', checked: true },
    { id: 'adrpbf', name: 'Abu Dhabi Retirement Pension and Benefit Fund (ADRPBF)', checked: true },
    { id: 'gosi', name: 'General Organization for Social Insurance (GOSI)', checked: true },
    { id: 'sio', name: 'Social Insurance Organization (SIO)', checked: false },
    { id: 'pasi', name: 'Public Authority for Social Insurance (PASI)', checked: false },
    { id: 'piss', name: 'Public Institution for Social Security (PISS)', checked: true },
    { id: 'grsia', name: 'General Retirement and Social Insurance Authority (GRSIA)', checked: false }
  ];

  // Head Types with IDs
  headTypes = [
    { id: 1, name: 'Earning', value: 'Earning' },
    { id: 2, name: 'Deduction', value: 'Deduction' },
    { id: 3, name: 'Benefits', value: 'Benefits' }
  ];

  // Earning Types for dropdown
  earningTypes: any[] = [];
  filteredEarningTypes = [...this.earningTypes];





  // API data arrays - will be populated from API response
  earnings: any[] = [];
  benefits: any[] = [];
  deductions: any[] = [];
  isLoading = false;
  showcalculation: boolean=false;
  showairticket: boolean=false;
  formulaData: any;
  operators: any;
  functions: any;
  variables: any;
  input_variables:any
  time_variables:any

  constructor(private fb: FormBuilder, private api: Api, private modalService: NgbModal,
    private toast: ToastService
  ) {
    this.salaryForm = this.fb.group({
      earning_type:[,Validators.required],
      head_name: ['', [Validators.required, Validators.maxLength(100)]],
      head_type: [1, Validators.required], // Default to Earning (1)
      pay_type:[1],
      deduction_frequency:[1],
      calculation_type: [1],
      calculation_value: [0],
      is_scheduled_earning: [false],
      is_customizable: [true],
      calculate_on_pro_rata: [false],
      active: [true],
      is_gpssa:[false],
      is_adrpbf:[false],
      is_gosi:[false],
      is_sio:[false],
      is_pasi:[false],
      is_piss:[false],
      is_grsia:[false],
      payslip_name:['',[Validators.required,Validators.maxLength(100)]],
      annual_value:[0],
      monthly_value:[0],
      formula: ['']
    });
  }

  ngOnInit(): void {
    this.getPayrollheads()
    this.getheads()
    this.getFormulaDetails()
  }
  getheads(){
    this.api.get('/employee/payroll_head_categories/').subscribe({
      next: (res: any) => {
        console.log(res, 'Payroll heads loaded');
        // Store the complete earning type data including all properties
        this.earningTypes = res.data.map((item: any) => ({
          id: item.id,
          name: item.earning_type_formatted,
          // Social security benefit properties
          is_gpssa: item.is_gpssa,
          is_adrpbf: item.is_adrpbf,
          is_gosi: item.is_gosi,
          is_sio: item.is_sio,
          is_pasi: item.is_pasi,
          is_piss: item.is_piss,
          is_grsia: item.is_grsia,
          // Configuration properties
          is_pro_rata: item.is_pro_rata,
          can_change_pay_type: item.can_change_pay_type,
          calculation_type: item.calculation_type,
          // pay_type: item.pay_type,
          // Additional properties for conditional display
          is_variable: item.is_variable,
          is_included_in_salary_structure: item.is_included_in_salary_structure,
          is_scheduled_one_time_earnings_supported: item.is_scheduled_one_time_earnings_supported,
          is_user_configurable: item.is_user_configurable,
          is_formula_based_calculation_supported: item.is_formula_based_calculation_supported,
          show_in_payslip: item.show_in_payslip,
          is_opt_in: item.is_opt_in,
          can_change_schedule_earning_configuration: item.can_change_schedule_earning_configuration,
          can_change_default_percentage_variables: item.can_change_default_percentage_variables,
          is_included_in_ctc: item.is_included_in_ctc,
          can_customise_gpssa_compensations: item.can_customise_gpssa_compensations,
          formula_based_on: item.formula_based_on
        }));
        this.filteredEarningTypes = [...this.earningTypes];
      }
    });
  }

  getPayrollheads(){
    this.isLoading = true;
    this.api.get('/employee/distributed_payroll_list/').subscribe({
      next: (res: any) => {
        console.log(res,'Payroll heads loaded');
        
        if (res.status === 200 && res.data) {
          // Clear existing arrays
          this.earnings = [];
          this.benefits = [];
          this.deductions = [];
          
          // Populate earnings from API response
          if (res.data.Earning && Array.isArray(res.data.Earning)) {
            this.earnings = res.data.Earning.map((item: any) => ({
              ...item,
              head_type: 1, // Earning
              active: item.active !== undefined ? item.active : true // Use API value if provided, default to true
            }));
          }
          
          // Populate benefits from API response
          if (res.data.Benefits && Array.isArray(res.data.Benefits)) {
            this.benefits = res.data.Benefits.map((item: any) => ({
              ...item,
              head_type: 3, // Benefits
              active: item.active !== undefined ? item.active : true // Use API value if provided, default to true
            }));
          }
          
          // Populate deductions from API response
          if (res.data.Deduction && Array.isArray(res.data.Deduction)) {
            this.deductions = res.data.Deduction.map((item: any) => ({
              ...item,
              head_type: 2, // Deduction
              active: item.active !== undefined ? item.active : true // Use API value if provided, default to true
            }));
          }
          
          console.log('Processed data:', {
            earnings: this.earnings,
            benefits: this.benefits,
            deductions: this.deductions
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading payroll heads:', error);
        this.showToastMessage('Failed to load payroll heads. Please refresh the page.', 'error');
        this.isLoading = false;
      }
    });
  }
  setActiveTab(tab: 'earnings' | 'benefits' | 'deductions') {
    this.activeTab = tab;
  }

  toggleAddDropdown() {
    this.showAddDropdown = !this.showAddDropdown;
  }

  selectComponentType(type: 'Earning' | 'Correction' | 'Deduction' | 'Benefits') {
    this.selectedComponentType = type;
    this.showAddDropdown = false;
    
    // Set head_type based on component type selection
    let headType: number;
    switch(type) {
      case 'Earning':
        headType = 1;
        break;
      case 'Deduction':
        headType = 2;
        break;
      case 'Benefits':
        headType = 3;
        break;
      case 'Correction':
        headType = 2; // Correction is treated as Deduction
        break;
      default:
        headType = 1;
    }
    
    // Update the form with the selected head_type
    this.salaryForm.patchValue({
      head_type: headType
    });
    
    this.openModal();
  }
  getparticularpayrollhead(id: number) {
    this.isModalLoading = true;
    this.api.get(`/employee/get_payroll_head/${id}/`).subscribe({
      next: (res: any) => {
        console.log(res, 'Payroll head loaded');
        this.isModalLoading = false;
        
        if (res.status === 200 && res.data) {
          // Populate the form with the fetched data
          this.populateFormWithData(res.data);
        } else {
          this.showToastMessage('Failed to load payroll head details.', 'error');
          this.closeModal();
        }
      },
      error: (error) => {
        console.error('Error loading payroll head:', error);
        this.showToastMessage('Failed to load payroll head details. Please try again.', 'error');
        this.isModalLoading = false;
        this.closeModal();
      }
    });
  }

  populateFormWithData(data: any) {
    // Determine component type based on the data structure
    let componentType: 'Earning' | 'Deduction' | 'Benefits';
    let headType: number;
    
    if (data.head_type_name) {
      // API response structure
      switch(data.head_type_name) {
        case 'Earning':
          componentType = 'Earning';
          headType = 1;
          break;
        case 'Deduction':
          componentType = 'Deduction';
          headType = 2;
          break;
        case 'Benifits': // Note: API has typo in "Benifits"
          componentType = 'Benefits';
          headType = 3;
          break;
        default:
          componentType = 'Earning';
          headType = 1;
      }
    } else {
      // Legacy structure
      switch(data.head_type) {
        case 1:
          componentType = 'Earning';
          headType = 1;
          break;
        case 2:
          componentType = 'Deduction';
          headType = 2;
          break;
        case 3:
          componentType = 'Benefits';
          headType = 3;
          break;
        default:
          componentType = 'Earning';
          headType = 1;
      }
    }
    
    this.selectedComponentType = componentType;
    
    // Map calculation_type_name to numeric value
    let calculationType: number;
    if (data.calculation_type_name) {
      calculationType = data.calculation_type_name === 'Percentage' ? 2 : 1;
    } else {
      calculationType = data.calculation_type;
    }
    
    // Populate the form
    this.salaryForm.patchValue({
      earning_type: data.earning_type,
      payslip_name: data.payslip_name,
      deduction_frequency: data.deduction_frequency,
      is_scheduled_earning: data.is_scheduled_earning,
      calculate_on_pro_rata: data.calculate_on_pro_rata,
      is_gpssa: data.is_gpssa,
      is_adrpbf: data.is_adrpbf,
      is_gosi: data.is_gosi,
      is_sio: data.is_sio,
      is_pasi: data.is_pasi,
      is_piss: data.is_piss,
      is_grsia: data.is_grsia,
      head_name: data.head_name,
      head_type: data.head_type,
      calculation_type: data.calculation_type,
      calculation_value: data.calculation_value,
      pay_type: data.pay_type,
      annual_value: data.annual_value || 0,
      monthly_value: data.monthly_value || 0,
      is_customizable: data.is_customizable,
      active: data.active !== undefined ? data.active : true,
    });
    this.formula=data.formula
    // this.selectEarningType(data.earning_type)
    // this.salaryForm.get('earning_type')?.disable()
    // calll this function here it is used for edit this.selectEarningType(data.earning_type) but it should not disturb the creation one
    // this.selectEarningType(this.earningTypes.find(type => type.id === data.earning_type)) make another function what will be disable or not
    this.selectEarningTypeedit(this.earningTypes.find(type => type.id === data.earning_type))
    this.salaryForm.get('earning_type')?.disable()
    
  }
 selectEarningTypeedit(type: any) {
    console.log(type, 'type',typeof type.id);
   
    if(this.salaryForm.get('earning_type')?.value == 1){
      this.salaryForm.get('calculate_on_pro_rata')?.disable();
    }
    else{
      this.salaryForm.get('calculate_on_pro_rata')?.enable();
    }
    if(this.salaryForm.get('earning_type')?.value == 9 || this.salaryForm.get('earning_type')?.value == 10 || this.salaryForm.get('earning_type')?.value == 20){
      this.showcalculation=false
      this.showairticket=false
    }
    else if(this.salaryForm.get('earning_type')?.value == 19){
      this.showairticket=true
     this.showcalculation=false
    }else{
      this.showcalculation=true
      this.showairticket=false
    }
    // Update the input display value
    const input = document.getElementById('earning_type') as HTMLInputElement;
    if (input) {
      input.value = type.name;
    }
    
    // Update social security benefits based on selected earning type
    this.updateSocialSecurityBenefits(type);
  }
  openModal(component?: any) {
    this.showModal = true;
    if (component) {
      this.isEditing = true;
      this.editingComponent = component;
      
      // If component has an ID, fetch the latest data from API
      if (component.id) {
        this.getparticularpayrollhead(component.id);
        return; // Exit early, modal will be populated after API call
      }
      
      // Determine component type based on the data structure
    
    } else {
      this.isEditing = false;
      this.editingComponent = null;
      
      // Reset form with proper default values for new entry
      this.resetSalaryForm();
      
      // Keep the selected head_type
      this.salaryForm.patchValue({
        head_type: this.salaryForm.get('head_type')?.value || 1
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.isEditing = false;
    this.editingComponent = null;
    this.selectedComponentType = '';
    
    // Reset form with proper default values
    this.resetSalaryForm();
  }

  resetSalaryForm() {
    this.salaryForm.reset({
      earning_type: null,
      head_name: '',
      head_type: 1, // Default to Earning
      pay_type: 1,
      deduction_frequency: 1,
      calculation_type: 1,
      calculation_value: 0,
      annual_value: 0,
      monthly_value: 0,
      is_scheduled_earning: false,
      is_customizable: true,
      calculate_on_pro_rata: false,
      active: true,
      is_gpssa: false,
      is_adrpbf: false,
      is_gosi: false,
      is_sio: false,
      is_pasi: false,
      is_piss: false,
      is_grsia: false,
    });
    
    // Reset social security benefits to default state
    this.socialSecurityBenefits.forEach(benefit => {
      benefit.checked = false;
    });
    
    // Enable all social security benefit controls
    this.salaryForm.get('is_gpssa')?.enable();
    this.salaryForm.get('is_adrpbf')?.enable();
    this.salaryForm.get('is_gosi')?.enable();
    this.salaryForm.get('is_sio')?.enable();
    this.salaryForm.get('is_pasi')?.enable();
    this.salaryForm.get('is_piss')?.enable();
    this.salaryForm.get('is_grsia')?.enable();
    
    // Enable earning type field for new entries
    this.salaryForm.get('earning_type')?.enable();
    
    // Reset earning type display
    this.resetEarningTypeDisplay();
  }

  onSubmit() {
    if (this.salaryForm.valid) {
      this.isSubmitting = true;
      const formData = this.salaryForm.getRawValue();
      formData.formula=this.formula
      console.log('Payroll Head Form Data:', formData);

      // Here you would typically save to your backend
      if (this.isEditing && this.editingComponent?.id) {
        console.log('Updating payroll head:', this.editingComponent);
        // Add the ID to formData for update
        formData.id = this.editingComponent.id;
        this.api.put(`/employee/update_payroll_head/${this.editingComponent.id}/`, formData).subscribe({
          next: (res: any) => {
            console.log(res, 'after update api');
            this.toast.show('Success', 'Payroll head updated successfully', 'success');
            this.getPayrollheads(); // Refresh the list
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating payroll head:', error);
            this.showToastMessage('Failed to update payroll head. Please try again.', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        console.log('Adding new payroll head:', this.selectedComponentType);
        // here hit api for creation
        this.api.post('/employee/create_payroll_head/', formData).subscribe({
          next: (res: any) => {
            if(res.status==200){
            console.log(res, 'after api');
            this.toast.show('Success', 'Payroll head created successfully', 'success');
            this.getPayrollheads(); // Refresh the list
            this.isSubmitting = false;
            }else{
              this.toast.show('danger',res.error)
            }
          },
          error: (error) => {
            console.error('Error creating payroll head:', error);
            this.toast.show('Error', 'Failed to create payroll head. Please try again.', 'danger');
            this.isSubmitting = false;
          }
        });
      }
      
      this.closeModal();
    } else {
      this.markFormGroupTouched();
    }
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }



  deletePayrollHead(id: number, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      this.api.delete(`/employee/delete_payroll_head/${id}/`).subscribe({
        next: (res: any) => {
          console.log('Payroll head deleted:', res);
          this.showToastMessage(`"${name}" has been deleted successfully!`, 'success');
          this.getPayrollheads(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting payroll head:', error);
          this.showToastMessage('Failed to delete payroll head. Please try again.', 'error');
        }
      });
    }
  }

  markFormGroupTouched() {
    Object.keys(this.salaryForm.controls).forEach(key => {
      const control = this.salaryForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.salaryForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName} is required`;
      }
      if (control.errors['maxlength']) {
        return `${controlName} must be at most ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['min']) {
        return `${controlName} must be greater than or equal to 0`;
      }
    }
    return '';
  }

  getModalTitle(): string {
    if (this.isEditing) {
      return 'Edit Payroll Head';
    }
    switch (this.selectedComponentType) {
      case 'Earning':
        return 'New Earning';
      case 'Benefits':
        return 'Add Benefit';
      case 'Deduction':
        return 'New Deduction';
      case 'Correction':
        return 'New Correction';
      default:
        return 'Add Payroll Head';
    }
  }





  // Get display value for calculation type
  getCalculationTypeDisplay(type: any): string {
    if (typeof type === 'number') {
      return type === 1 ? 'Fixed Amount' : 'Percentage';
    } else if (typeof type === 'string') {
      return type === 'Fixed' ? 'Fixed Amount' : 'Percentage';
    }
    return 'Unknown';
  }



  // Format calculation value for display
  getCalculationValueDisplay(component: any) {
    const calculationType =  component.calculation_type;
    const calculationValue = component.calculation_value;
    
    if (calculationType == 2) {
      return `${calculationValue}% of basic`;
    } else if (calculationType == 3) {
      return `${calculationValue}% of CTC`;
    }
    else {
      return `AED ${calculationValue}`;
    }
  }

  // Earning Type dropdown methods
  filterEarningTypes(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredEarningTypes = this.earningTypes.filter(type => 
      type.name.toLowerCase().includes(searchTerm)
    );
  }

  resetEarningTypeFilter() {
    this.filteredEarningTypes = [...this.earningTypes];
  }

  resetEarningTypeDisplay() {
    // Reset the earning type input display
    const input = document.getElementById('earning_type') as HTMLInputElement;
    if (input) {
      input.value = '';
    }
  }

  selectEarningType(type: any) {
    console.log(type, 'type',typeof type.id);
    this.salaryForm.patchValue({
      earning_type: type.id,
      // Set pro-rata based on API data
      calculate_on_pro_rata: type.is_pro_rata,
      // Set calculation type if available
      calculation_type: 1,
      // Set pay type if available
      pay_type: 1
    });
    if(this.salaryForm.get('earning_type')?.value == 1){
      this.salaryForm.get('calculate_on_pro_rata')?.disable();
    }
    else{
      this.salaryForm.get('calculate_on_pro_rata')?.enable();
    }
    if(this.salaryForm.get('earning_type')?.value == 9 || this.salaryForm.get('earning_type')?.value == 10 || this.salaryForm.get('earning_type')?.value == 20){
      this.showcalculation=false
      this.showairticket=false
    }
    else if(this.salaryForm.get('earning_type')?.value == 19){
      this.showairticket=true
     this.showcalculation=false
    }else{
      this.showcalculation=true
      this.showairticket=false
    }
    // Update the input display value
    const input = document.getElementById('earning_type') as HTMLInputElement;
    if (input) {
      input.value = type.name;
    }
    
    // Update social security benefits based on selected earning type
    this.updateSocialSecurityBenefits(type);
  }

  updateSocialSecurityBenefits(earningType: any) {
    // Always set all social security benefit form controls, but some may be disabled
    this.salaryForm.patchValue({
      is_gpssa: earningType.is_gpssa ,
      is_adrpbf: earningType.is_adrpbf ,
      is_gosi: earningType.is_gosi ,
      is_sio: earningType.is_sio ,
      is_pasi: earningType.is_pasi ,
      is_piss: earningType.is_piss ,
      is_grsia: earningType.is_grsia 
    });

    // Store the disabled state for each benefit
    this.disabledSocialSecurityBenefits = {
      is_gpssa: !earningType.is_gpssa || earningType.is_gpssa,
      is_adrpbf: !earningType.is_adrpbf || earningType.is_adrpbf ,
      is_gosi: !earningType.is_gosi || earningType.is_gosi,
      is_sio: !earningType.is_sio || earningType.is_sio,
      is_pasi: !earningType.is_pasi || earningType.is_pasi,
      is_piss: !earningType.is_piss || earningType.is_piss,
      is_grsia: !earningType.is_grsia || earningType.is_grsia
    };

    // Disable/enable form controls based on applicability
    if (!earningType.is_gpssa || earningType.is_gpssa) {
      this.salaryForm.get('is_gpssa')?.disable();
    } else {
      this.salaryForm.get('is_gpssa')?.enable();
    }
    
    if (!earningType.is_adrpbf || earningType.is_adrpbf) {
      this.salaryForm.get('is_adrpbf')?.disable();
    } else {
      this.salaryForm.get('is_adrpbf')?.enable();
    }
    
    if (!earningType.is_gosi || earningType.is_gosi) {
      this.salaryForm.get('is_gosi')?.disable();
    } else {
      this.salaryForm.get('is_gosi')?.enable();
    }
    
    if (!earningType.is_sio || earningType.is_sio) {
      this.salaryForm.get('is_sio')?.disable();
    } else {
      this.salaryForm.get('is_sio')?.enable();
    }
    
    if (!earningType.is_pasi || earningType.is_pasi) {
      this.salaryForm.get('is_pasi')?.disable();
    } else {
      this.salaryForm.get('is_pasi')?.enable();
    }
    
    if (!earningType.is_piss || earningType.is_piss) {
      this.salaryForm.get('is_piss')?.disable();
    } else {
      this.salaryForm.get('is_piss')?.enable();
    }
    
    if (!earningType.is_grsia || earningType.is_grsia) {
      this.salaryForm.get('is_grsia')?.disable();
    } else {
      this.salaryForm.get('is_grsia')?.enable();
    }
  }

  getSelectedEarningType(): any {
    const selectedEarningTypeId = this.salaryForm.get('earning_type')?.value;
    if (!selectedEarningTypeId) return null;
    return this.earningTypes.find(type => type.id === selectedEarningTypeId);
  }

  getSocialSecurityBenefitsForEarningType(): any[] {
    const selectedEarningType = this.getSelectedEarningType();
    if (!selectedEarningType) return [];

    // Define all possible social security benefits with their display names
    const allBenefits = [
      { id: 'gpssa', name: 'General Pension And Social Security Authority (GPSSA)', checked: selectedEarningType.is_gpssa || false },
      { id: 'adrpbf', name: 'Abu Dhabi Retirement Pension and Benefit Fund (ADRPBF)', checked: selectedEarningType.is_adrpbf || false },
      { id: 'gosi', name: 'General Organization for Social Insurance (GOSI)', checked: selectedEarningType.is_gosi || false },
      { id: 'sio', name: 'Social Insurance Organization (SIO)', checked: selectedEarningType.is_sio || false },
      { id: 'pasi', name: 'Public Authority for Social Insurance (PASI)', checked: selectedEarningType.is_pasi || false },
      { id: 'piss', name: 'Public Institution for Social Security (PISS)', checked: selectedEarningType.is_piss || false },
      { id: 'grsia', name: 'General Retirement and Social Insurance Authority (GRSIA)', checked: selectedEarningType.is_grsia || false }
    ];

    // Return only the benefits that are applicable (checked = true)
    return allBenefits.filter(benefit => benefit.checked);
  }

  isSocialSecurityBenefitDisabled(benefitKey: string): boolean {
    return this.disabledSocialSecurityBenefits[benefitKey] || false;
  }

  hasAnySocialSecurityBenefits(): boolean {
    const selectedEarningType = this.getSelectedEarningType();
    if (!selectedEarningType) return false;
    
    return !!(selectedEarningType.is_gpssa || selectedEarningType.is_adrpbf || selectedEarningType.is_gosi || 
              selectedEarningType.is_sio || selectedEarningType.is_pasi || selectedEarningType.is_piss || selectedEarningType.is_grsia);
  }

  getEarningTypeDisplayName(id: number): string {
    const type = this.earningTypes.find(t => t.id === id);
    return type ? type.name : 'Select';
  }

  addCustomEarningType() {
    console.log('Add custom earning type clicked');
    // No-op for now; custom earning type feature not implemented yet.
    this.selectEarningType(this.earningTypes.find(type => type.id === 22));
  }

  openDeductionModal() {
    const modalRef = this.modalService.open(Deduction, { 
      centered: true, 
      size: 'lg',
      backdrop: 'static'
    });
    
    modalRef.result.then((result) => {
      if (result === 'updated' || result === 'created') {
        this.showToastMessage('Benefit updated successfully!', 'success');
        this.getPayrollheads(); // Refresh the list
      }
    }, (reason) => {
      // Modal was dismissed
      console.log('Benefit edit modal dismissed');
    });
  }

  openBenefitModal() {
    const modalRef = this.modalService.open(Benefit, { 
      centered: true, 
      size: 'lg',
      backdrop: 'static'
    });
    
    modalRef.result.then((result) => {
      if (result === 'updated' || result === 'created') {
        this.showToastMessage('Benefit updated successfully!', 'success');
        this.getPayrollheads(); // Refresh the list
      }
    }, (reason) => {
      // Modal was dismissed
      console.log('Benefit edit modal dismissed');
    });
  }

  openBenefitEditModal(benefit: any) {
    const modalRef = this.modalService.open(Benefit, { 
      centered: true, 
      size: 'lg',
      backdrop: 'static'
    });
    
    // Pass the benefit data to the modal component
    if (modalRef.componentInstance) {
      modalRef.componentInstance.setEditingData(benefit);
    }
    
    modalRef.result.then((result) => {
      if (result === 'updated' || result === 'created') {
        this.showToastMessage('Benefit updated successfully!', 'success');
        this.getPayrollheads(); // Refresh the list
      }
    }, (reason) => {
      // Modal was dismissed
      console.log('Benefit edit modal dismissed');
    });
  }

  openDeductionEditModal(deduction: any) {
    const modalRef = this.modalService.open(Deduction, { 
      centered: true, 
      size: 'lg',
      backdrop: 'static'
    });
    
    // Pass the deduction data to the modal component
    if (modalRef.componentInstance) {
      modalRef.componentInstance.setEditingData(deduction);
    }
    
    modalRef.result.then((result) => {
      if (result === 'updated' || result === 'created') {
        this.showToastMessage('Deduction updated successfully!', 'success');
        this.getPayrollheads(); // Refresh the list
      }
    }, (reason) => {
      // Modal was dismissed
      console.log('Deduction edit modal dismissed');
    });
  }
  // praju
  // GET ----- /employee/custom_formula_details/
  getFormulaDetails(){
    this.api.get("/employee/custom_formula_details/").subscribe((res:any)=>{
      if(res.status==200){
        this.formulaData=res.data
        this.variables=res.data.categories
        this.time_variables=res.data.time_variables
        this.input_variables=res.data.input_variables
        this.functions=res.data.functions
        this.operators=res.data.operators
      }
    })
  }

  
  formula: string = '';
  syntaxMessage: string = '';
  syntaxValid: boolean = false;

  insertComponent(component: string) {
    this.formula += component;
  }

  insertFunction(func: string) {
    this.formula += func;
  }

  insertOperator(op: string) {
    // Insert the operator at the current cursor position in the formula input
    const input = document.getElementById('formulaInput') as HTMLInputElement | null;
    if (input && typeof input.selectionStart === 'number' && typeof input.selectionEnd === 'number') {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const before = this.formula.slice(0, start);
      const after = this.formula.slice(end);
      // Insert operator with spaces around it
      this.formula = before + ` ${op} ` + after;
      // Update the input value and set cursor after the inserted operator
      setTimeout(() => {
        input.value = this.formula;
        const cursorPos = start + (` ${op} `).length;
        input.setSelectionRange(cursorPos, cursorPos);
        input.focus();
      });
    } else {
      // Fallback: append at the end
      this.formula += ` ${op} `;
    }    // this.formula += ` ${op} `;
  }

  checkSyntax() {
    // POST ---/employee/custom_formula_check/
    this.salaryForm.get('formula')?.patchValue(this.formula)
    this.api.post("/employee/custom_formula_check/",{formula:this.formula}).subscribe((res:any)=>{
      if(res.status==200){
        if(res.valid){
          this.toast.show("Syntax Valid",'info')
          this.syntaxMessage=''
          this.syntaxValid=true
        }else{
          this.syntaxMessage="Invalid Syntax !"
          this.syntaxValid=false
        }
      }
    })
  }
}


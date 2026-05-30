import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormsModule, AbstractControl } from '@angular/forms';
import { Api } from '../../core/services/api';

interface SalaryStructureComponent {
  headid: string;
  head_name: string;
  calculation_type: string;
  calculation_value: string;
  monthly_value: string;
  annual_value: string;
}

@Component({
  selector: 'app-salary-structure',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './salary-structure.html',
  styleUrl: './salary-structure.scss'
})
export class SalaryStructure implements OnInit {
  showModal = false;
  isEditing = false;
  editingStructureId: number | null = null;
  salaryStructureForm: FormGroup;
  componentForm: FormGroup;
  components: SalaryStructureComponent[] = [];
  earning: any[] = [];
  
  // Search and select properties for earnings
  showEarningsDropdown: boolean[] = [];
  filteredEarnings: any[][] = [];
  earningsSearchTerms: string[] = [];
  
  isDataLoaded: boolean = false;
  
  // Salary structures list
  salaryStructures: any[] = [];
  
  // Available components for selection
  availableComponents = [
    { id: '1', name: 'Basic Salary' },
    { id: '2', name: 'HR' },
    { id: '3', name: 'Housing Allowance' },
    { id: '4', name: 'Transport Allowance' }
  ];

  constructor(private fb: FormBuilder, private api: Api) {
    this.salaryStructureForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', Validators.required],
      active: [true],
      earnings: this.fb.array([])
    });

    this.componentForm = this.fb.group({
      headid: ['', Validators.required],
      head_name: ['', Validators.required],
      calculation_type: ['', Validators.required],
      calculation_value: ['', Validators.required],
      monthly_value: ['', Validators.required],
      annual_value: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Load payroll heads from API
    this.getPayrollheads();
    // Load existing salary structures
    this.loadSalaryStructures();
  }

  // Getter methods for FormArrays
  get earningsArray(): FormArray {
    return this.salaryStructureForm.get('earnings') as FormArray;
  }

  getPayrollheads(){
    this.api.get('/employee/grouped_payroll_heads/').subscribe({
      next: (res: any) => {
        console.log('API Response:', res);
        
        if (res.status === 200 && res.data) {
          // Extract all heads from all categories and filter only earnings
          this.earning = [];
          res.data.forEach((category: any) => {
            if (category.heads && Array.isArray(category.heads)) {
              category.heads.forEach((head: any) => {
                // Only include heads that are earnings (head_type_name === "Earning")
                if (head.head_type_name === "Earning") {
                  this.earning.push({
                    ...head,
                    category_name: category.category_name
                  });
                }
              });
            }
          });
          
          // Mark data as loaded
          this.isDataLoaded = true;
          console.log('Earning data loaded:', this.earning);
          console.log('Earning data length:', this.earning?.length);
        }
      },
      error: (error) => {
        console.error('Error loading payroll heads:', error);
        this.showToastMessage('Failed to load payroll heads. Please refresh the page.', 'error');
      }
    });
  }

  openModal() {
    this.showModal = true;
    this.isEditing = false;
    this.editingStructureId = null;
    
    // Reset search arrays for earnings section
    this.showEarningsDropdown = [];
    this.earningsSearchTerms = [];
    this.filteredEarnings = [];
    
    this.isDataLoaded = false;
    
    // Clear earnings FormArray
    this.earningsArray.clear();
    
    // Reset the form
    this.salaryStructureForm.patchValue({
      name: '',
      description: '',
      active: true
    });
    
    // Load payroll heads
    this.getPayrollheads();
  }

  closeModal() {
    this.showModal = false;
    this.salaryStructureForm.reset();
    this.components = [];
  }

  // Method to add new row to Earnings section
  addEarningsRow() {
    const newRow = this.fb.group({
      id: [''],
      head_name: ['', Validators.required],
      head_type: [''],
      calculation_type: [1], // Default to Fixed
      calculation_type_name: ['Fixed'],
      calculation_value: ['0'],
      monthly_value: ['0'],
      annual_value: ['0']
    });

    this.earningsArray.push(newRow);
    
    const newIndex = this.earningsArray.length - 1;
    
    // Initialize search arrays for the new row
    this.showEarningsDropdown[newIndex] = false;
    this.earningsSearchTerms[newIndex] = '';
    this.filteredEarnings[newIndex] = this.earning ? [...this.earning] : [];
    
    // Set up value change subscriptions for automatic calculations
    this.setupCalculationSubscriptions(newIndex);
    
    console.log('Earnings row added successfully at index:', newIndex);
  }

  // Method to remove row from Earnings section
  removeEarningsRow(index: number) {
    this.earningsArray.removeAt(index);
    
    // Clean up search arrays for the removed row
    this.showEarningsDropdown.splice(index, 1);
    this.earningsSearchTerms.splice(index, 1);
    this.filteredEarnings.splice(index, 1);
    
    console.log('Earnings row removed at index:', index);
  }

  onComponentSelectionChange() {
    const selectedComponentId = this.componentForm.get('headid')?.value;
    const selectedComponent = this.availableComponents.find(c => c.id === selectedComponentId);
    
    if (selectedComponent) {
      this.componentForm.patchValue({
        head_name: selectedComponent.name
      });
    }
  }

  addComponent() {
    if (this.componentForm.valid) {
      const componentData: SalaryStructureComponent = {
        headid: this.componentForm.get('headid')?.value,
        head_name: this.componentForm.get('head_name')?.value,
        calculation_type: this.componentForm.get('calculation_type')?.value,
        calculation_value: this.componentForm.get('calculation_value')?.value,
        monthly_value: this.componentForm.get('monthly_value')?.value,
        annual_value: this.componentForm.get('annual_value')?.value
      };

      this.components.push(componentData);
      this.componentForm.reset();
      this.showToastMessage('Component added successfully', 'success');
    } else {
      this.markFormGroupTouched(this.componentForm);
    }
  }

  removeComponent(index: number) {
    this.components.splice(index, 1);
    this.showToastMessage('Component removed', 'success');
  }

  onSubmit() {
    console.log(this.salaryStructureForm.value);
    if (this.salaryStructureForm.valid) {
      const formData = this.salaryStructureForm.value;
      
      console.log('Salary Structure Payload:', formData);
      
      if (this.isEditing && this.editingStructureId) {
        // Update existing salary structure
        this.api.put(`/employee/update_salary_component_map/${this.editingStructureId}/`, formData).subscribe({
          next: (res: any) => {
            if(res.status === 200){
              this.closeModal();
              this.loadSalaryStructures();
              this.showToastMessage('Salary Structure updated successfully', 'success');
            }else{
              this.showToastMessage('Error updating salary structure', 'error');
            }
          },
          error: (error) => {
            console.error('Error updating salary structure:', error);
            this.showToastMessage('Error updating salary structure', 'error');
          }
        });
      } else {
        // Create new salary structure
        this.api.post('/employee/create_salary_component_map/', formData).subscribe({
          next: (res: any) => {
            if(res.status === 200){
              this.closeModal();
              this.loadSalaryStructures();
              this.showToastMessage('Salary Structure created successfully', 'success');
            }else{
              this.showToastMessage('Error creating salary structure', 'error');
            }
          },
          error: (error) => {
            console.error('Error creating salary structure:', error);
            this.showToastMessage('Error creating salary structure', 'error');
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.salaryStructureForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(formGroup: FormGroup, controlName: string): string {
    const control = formGroup.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName} is required`;
      }
      if (control.errors['minlength']) {
        return `${controlName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  showToastMessage(message: string, type: 'success' | 'error' | 'warning') {
    console.log(`${type.toUpperCase()}: ${message}`);
  }

  // Earnings search and select methods
  onEarningsFocus(index: number) {
    this.showEarningsDropdown[index] = true;
    this.filterEarnings(index);
  }

  onEarningsInput(index: number, event: any) {
    const searchTerm = (event.target?.value || '').toLowerCase();
    this.earningsSearchTerms[index] = searchTerm;
    this.filterEarnings(index);
  }

  onEarningsBlur(index: number) {
    // Delay hiding dropdown to allow for selection
    setTimeout(() => {
      this.showEarningsDropdown[index] = false;
    }, 200);
  }

  filterEarnings(index: number) {
    const searchTerm = this.earningsSearchTerms[index]?.toLowerCase() || '';
    if (this.earning && Array.isArray(this.earning)) {
      this.filteredEarnings[index] = this.earning.filter((item: any) =>
        (item.head_name || '').toLowerCase().includes(searchTerm) ||
        (item.category_name || '').toLowerCase().includes(searchTerm)
      );
    } else {
      this.filteredEarnings[index] = [];
    }
  }

  selectEarning(index: number, earning: any) {
    const row = this.earningsArray.at(index);
    
    const updateData = {
      id: earning.id,
      head_name: earning.head_name,
      head_type: earning.head_type,
      calculation_type: earning.calculation_type,
      calculation_type_name: earning.calculation_type_name,
      calculation_value: earning.calculation_value,
      monthly_value: earning.monthly_value,
      annual_value: earning.annual_value
    };
    
    // Update the form control
    row.patchValue(updateData);
    
    // Update the search term to match the selected value
    this.earningsSearchTerms[index] = earning.head_name;
    
    this.showEarningsDropdown[index] = false;
    
    // Recalculate amounts after selecting earning
    setTimeout(() => {
      this.recalculateAmounts(index, earning.calculation_type, earning.calculation_value);
    }, 100);
  }

  // Load salary structures from API
  loadSalaryStructures() {
    this.api.get('/employee/list_salary_component_maps/').subscribe({
      next: (res: any) => {
        if(res.status === 200){
          this.salaryStructures = res.data;
          console.log('Salary structures loaded:', res.data);
        }
      }
    });
  }

  // View salary structure details
  viewStructure(structure: any) {
    console.log('Viewing structure:', structure);
    // You can implement a modal to show detailed view
    this.showToastMessage(`Viewing: ${structure.name}`, 'success');
  }

  // Edit salary structure
  editStructure(structure: any) {
    console.log('Editing structure:', structure);
    
    // Open the modal first
    this.showModal = true;
    this.isEditing = true;
    this.editingStructureId = structure.id;
    
    // Reset search arrays for earnings section
    this.showEarningsDropdown = [];
    this.earningsSearchTerms = [];
    this.filteredEarnings = [];
    
    this.isDataLoaded = false;
    
    // Clear earnings FormArray
    this.earningsArray.clear();
    
    // Load payroll heads first
    this.getPayrollheads();
    
    // Get detailed structure data from API
    this.api.get(`/employee/get_salary_component_map/${structure.id}/`).subscribe({
      next: (res: any) => {
        if(res.status === 200){
          console.log('Salary structure details loaded:', res.data);
          
          // Populate form with structure data
          this.salaryStructureForm.patchValue({
            name: res.data.name,
            description: res.data.description,
            active: res.data.active
          });
          
          // Populate the FormArrays with the API data
          this.populateFormArrays(res.data);
        } else {
          console.error('Failed to load salary structure details:', res);
          this.showToastMessage('Failed to load salary structure details', 'error');
        }
      },
      error: (error) => {
        console.error('Error loading salary structure details:', error);
        this.showToastMessage('Error loading salary structure details', 'error');
      }
    });
  }

  // Populate FormArrays with structure data
  populateFormArrays(structure: any) {
    // Populate Earnings
    if (structure.earnings && Array.isArray(structure.earnings)) {
      structure.earnings.forEach((earning: any) => {
        const newIndex = this.earningsArray.length;
        this.earningsArray.push(this.fb.group({
          id: [earning.id || null],
          head_name: [earning.head_name || ''],
          calculation_value: [earning.calculation_value || '0'],
          calculation_type: [earning.calculation_type || 1],
          calculation_type_name: [earning.calculation_type_name || 'Fixed'],
          monthly_value: [earning.monthly_value || '0'],
          annual_value: [earning.annual_value || '0'],
          head_type: [earning.head_type || 1],
          head_type_name: [earning.head_type_name || 'Earning'],
        }));
        
        // Initialize search arrays for the new row
        this.showEarningsDropdown[newIndex] = false;
        this.earningsSearchTerms[newIndex] = '';
        this.filteredEarnings[newIndex] = this.earning ? [...this.earning] : [];
        
        // Set up subscriptions for automatic calculations
        this.setupCalculationSubscriptions(newIndex);
      });
    }
    
    console.log('Form arrays populated with structure data:', structure);
  }

  // Delete salary structure
  deleteStructure(structureId: number) {
    if (confirm('Are you sure you want to delete this salary structure?')) {
      this.api.get(`/employee/delete_salary_component_maps/${structureId}/`).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.showToastMessage('Salary structure deleted successfully', 'success');
            this.loadSalaryStructures(); // Reload the list
          } else {
            this.showToastMessage('Error deleting salary structure', 'error');
          }
        },
        error: (error) => {
          console.error('Error deleting salary structure:', error);
          this.showToastMessage('Error deleting salary structure', 'error');
        }
      });
    }
  }

  // Get all components from a salary structure
  getAllComponents(structure: any): any[] {
    const components: any[] = [];
    
    // Add earnings with type
    if (structure.earnings && Array.isArray(structure.earnings)) {
      structure.earnings.forEach((item: any) => {
        components.push({ ...item, type: 'Earning' });
      });
    }
    
    return components;
  }

  // Get total number of components
  getTotalComponents(structure: any): number {
    const earnings = structure.earnings?.length || 0;
    return earnings;
  }

  // Calculate total annual amount from earnings
  getTotalAnnualAmount(): number {
    let total = 0;
    if (this.earningsArray && this.earningsArray.length > 0) {
      this.earningsArray.controls.forEach((control: AbstractControl) => {
        const annualValue = parseFloat(control.get('annual_value')?.value || '0');
        if (!isNaN(annualValue)) {
          total += annualValue;
        }
      });
    }
    return total;
  }

  // Calculate total monthly amount from earnings
  getTotalMonthlyAmount(): number {
    let total = 0;
    if (this.earningsArray && this.earningsArray.length > 0) {
      this.earningsArray.controls.forEach((control: AbstractControl) => {
        const monthlyValue = parseFloat(control.get('monthly_value')?.value || '0');
        if (!isNaN(monthlyValue)) {
          total += monthlyValue;
        }
      });
    }
    return total;
  }

  // Calculate annual amount based on monthly amount and calculation type
  calculateAnnualAmount(monthlyAmount: number, calculationType: number, calculationValue: number): number {
    if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
      return 0;
    }

    switch (calculationType) {
      case 1: // Fixed
        return monthlyAmount * 12;
      case 2: // % of Basic
        // For percentage calculations, monthly amount is already calculated
        return monthlyAmount * 12;
      case 3: // % of CTC
        // For percentage calculations, monthly amount is already calculated
        return monthlyAmount * 12;
      default:
        return monthlyAmount * 12;
    }
  }

  // Handle monthly amount change and calculate annual
  onMonthlyAmountChange(index: number) {
    const row = this.earningsArray.at(index);
    const monthlyAmount = parseFloat(row.get('monthly_value')?.value || '0');
    const calculationType = parseInt(row.get('calculation_type')?.value || '1');
    const calculationValue = parseFloat(row.get('calculation_value')?.value || '0');
    
    // Calculate annual amount
    const annualAmount = this.calculateAnnualAmount(monthlyAmount, calculationType, calculationValue);
    
    // Update annual amount without triggering change detection loop
    row.patchValue({ annual_value: annualAmount.toFixed(2) }, { emitEvent: false });
  }

  // Handle calculation type change and recalculate amounts
  onCalculationTypeChange(index: number) {
    const row = this.earningsArray.at(index);
    const calculationType = parseInt(row.get('calculation_type')?.value || '1');
    const calculationValue = parseFloat(row.get('calculation_value')?.value || '0');
    
    // Recalculate monthly and annual amounts based on new calculation type
    this.recalculateAmounts(index, calculationType, calculationValue);
  }

  // Handle calculation value change and recalculate amounts
  onCalculationValueChange(index: number) {
    const row = this.earningsArray.at(index);
    const calculationType = parseInt(row.get('calculation_type')?.value || '1');
    const calculationValue = parseFloat(row.get('calculation_value')?.value || '0');
    
    // Recalculate monthly and annual amounts based on new calculation value
    this.recalculateAmounts(index, calculationType, calculationValue);
  }

  // Recalculate amounts based on calculation type and value
  recalculateAmounts(index: number, calculationType: number, calculationValue: number) {
    const row = this.earningsArray.at(index);
    let monthlyAmount = 0;
    
    switch (calculationType) {
      case 1: // Fixed
        // For fixed amount, monthly amount should be manually entered
        // Just calculate annual from existing monthly
        const existingMonthly = parseFloat(row.get('monthly_value')?.value || '0');
        monthlyAmount = existingMonthly;
        break;
        
      case 2: // % of Basic
        // Find basic salary component to calculate percentage
        const basicSalary = this.getBasicSalaryAmount();
        monthlyAmount = (basicSalary * calculationValue) / 100;
        break;
        
      case 3: // % of CTC
        // Calculate based on total CTC (sum of all components)
        const totalCTC = this.getTotalMonthlyAmount();
        monthlyAmount = (totalCTC * calculationValue) / 100;
        break;
        
      default:
        monthlyAmount = 0;
    }
    
    // Update monthly amount
    row.patchValue({ monthly_value: monthlyAmount.toFixed(2) }, { emitEvent: false });
    
    // Calculate and update annual amount
    const annualAmount = this.calculateAnnualAmount(monthlyAmount, calculationType, calculationValue);
    row.patchValue({ annual_value: annualAmount.toFixed(2) }, { emitEvent: false });
  }

  // Get basic salary amount from earnings
  getBasicSalaryAmount(): number {
    let basicAmount = 0;
    if (this.earningsArray && this.earningsArray.length > 0) {
      this.earningsArray.controls.forEach((control: AbstractControl) => {
        const headName = control.get('head_name')?.value || '';
        const monthlyValue = parseFloat(control.get('monthly_value')?.value || '0');
        
        // Check if this is a basic salary component (you can customize this logic)
        if (headName.toLowerCase().includes('basic') && monthlyValue > 0) {
          basicAmount = monthlyValue;
        }
      });
    }
    return basicAmount;
  }



  // Set up subscriptions for automatic calculations
  setupCalculationSubscriptions(index: number) {
    const row = this.earningsArray.at(index);
    
    // Subscribe to calculation type changes
    row.get('calculation_type')?.valueChanges.subscribe((newValue) => {
      this.onCalculationTypeChange(index);
    });
    
    // Subscribe to calculation value changes
    row.get('calculation_value')?.valueChanges.subscribe((newValue) => {
      this.onCalculationValueChange(index);
    });
    
    // Subscribe to monthly value changes
    row.get('monthly_value')?.valueChanges.subscribe((newValue) => {
      this.onMonthlyAmountChange(index);
    });
  }

  // KPI Helper Methods
  getActiveStructuresCount(): number {
    return this.salaryStructures.filter(s => s.active === true).length;
  }

  getInactiveStructuresCount(): number {
    return this.salaryStructures.filter(s => s.active === false).length;
  }

  getTotalComponentsCount(): number {
    return this.salaryStructures.reduce((total, structure) => {
      return total + (this.getTotalComponents(structure) || 0);
    }, 0);
  }
} 
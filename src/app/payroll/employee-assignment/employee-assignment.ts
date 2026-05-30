import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Api } from '../../core/services/api';

interface Employee {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  designation: string;
  currentStructure?: SalaryStructure;
  salaryComponents: EmployeeSalaryComponent[];
  isActive: boolean;
}

interface SalaryStructure {
  id: number;
  name: string;
  description: string;
  payFrequency: 'Monthly' | 'Weekly' | 'Bi-weekly';
  isActive: boolean;
  components: SalaryStructureComponent[];
}

interface SalaryStructureComponent {
  id: number;
  componentId: number;
  componentName: string;
  componentType: 'Earning' | 'Deduction' | 'Benefit';
  calculationType: 'Fixed' | 'Percentage';
  calculationValue: number;
  isCustomizable: boolean;
  isDefault: boolean;
}

interface EmployeeSalaryComponent {
  id?: number;
  componentId: number;
  componentName: string;
  componentType: 'Earning' | 'Deduction' | 'Benefit';
  calculationType: 'Fixed' | 'Percentage';
  calculationValue: number;
  isOverridden: boolean;
  originalValue: number;
  isActive: boolean;
}

@Component({
  selector: 'app-employee-assignment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-assignment.html',
  styleUrl: './employee-assignment.scss'
})
export class EmployeeAssignment implements OnInit {
  showAssignmentModal = false;
  showOverrideModal = false;
  selectedEmployee: Employee | null = null;
  selectedStructure: SalaryStructure | null = null;
  selectedComponent: EmployeeSalaryComponent | null = null;
  assignmentForm: FormGroup;
  overrideForm: FormGroup;

  // Sample employees
  employees: Employee[] = [
    {
      id: 1,
      name: 'Ahmed Hassan',
      employeeId: 'EMP001',
             department: 'IT',
       designation: 'Senior Developer',
       currentStructure: undefined,
       salaryComponents: [],
      isActive: true
    },
    {
      id: 2,
      name: 'Fatima Al-Zahra',
      employeeId: 'EMP002',
             department: 'Sales',
       designation: 'Sales Manager',
       currentStructure: undefined,
       salaryComponents: [],
      isActive: true
    },
    {
      id: 3,
      name: 'Mohammed Ali',
      employeeId: 'EMP003',
             department: 'Operations',
       designation: 'Site Supervisor',
       currentStructure: undefined,
       salaryComponents: [],
      isActive: true
    }
  ];

  // Sample salary structures (from salary-structure component)
  salaryStructures: SalaryStructure[] = [
    {
      id: 1,
      name: 'Senior Management',
      description: 'Salary structure for senior management positions',
      payFrequency: 'Monthly',
      isActive: true,
      components: [
        {
          id: 1,
          componentId: 1,
          componentName: 'Basic Salary',
          componentType: 'Earning',
          calculationType: 'Fixed',
          calculationValue: 15000,
          isCustomizable: true,
          isDefault: true
        },
        {
          id: 2,
          componentId: 2,
          componentName: 'Housing Allowance',
          componentType: 'Earning',
          calculationType: 'Fixed',
          calculationValue: 5000,
          isCustomizable: true,
          isDefault: true
        }
      ]
    },
    {
      id: 2,
      name: 'Sales Team',
      description: 'Salary structure for sales team members',
      payFrequency: 'Monthly',
      isActive: true,
      components: [
        {
          id: 3,
          componentId: 1,
          componentName: 'Basic Salary',
          componentType: 'Earning',
          calculationType: 'Fixed',
          calculationValue: 8000,
          isCustomizable: true,
          isDefault: true
        },
        {
          id: 4,
          componentId: 3,
          componentName: 'Commission',
          componentType: 'Earning',
          calculationType: 'Percentage',
          calculationValue: 10,
          isCustomizable: true,
          isDefault: false
        }
      ]
    },
    {
      id: 3,
      name: 'Site Workers',
      description: 'Salary structure for site workers',
      payFrequency: 'Monthly',
      isActive: true,
      components: [
        {
          id: 5,
          componentId: 1,
          componentName: 'Basic Salary',
          componentType: 'Earning',
          calculationType: 'Fixed',
          calculationValue: 5000,
          isCustomizable: true,
          isDefault: true
        },
        {
          id: 6,
          componentId: 4,
          componentName: 'Overtime Pay',
          componentType: 'Earning',
          calculationType: 'Fixed',
          calculationValue: 25,
          isCustomizable: true,
          isDefault: false
        }
      ]
    }
  ];

  constructor(private fb: FormBuilder,private api:Api) {
    this.assignmentForm = this.fb.group({
      employeeId: ['', Validators.required],
      structureId: ['', Validators.required],
      effectiveDate: ['', Validators.required],
      notes: ['']
    });

    this.overrideForm = this.fb.group({
      calculationValue: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
      overrideReason: ['', Validators.required]
    });
  }

  ngOnInit(): void {

    this.api.get('/employee/list_employees/').subscribe((res:any)=>{
      console.log(res,'list emoloyee');
      
    })
  }

  openAssignmentModal(employee: Employee) {
    this.selectedEmployee = employee;
    this.showAssignmentModal = true;
    this.assignmentForm.patchValue({
      employeeId: employee.id,
      structureId: employee.currentStructure?.id || '',
      effectiveDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  }

  closeAssignmentModal() {
    this.showAssignmentModal = false;
    this.selectedEmployee = null;
    this.selectedStructure = null;
    this.assignmentForm.reset();
  }

  onStructureChange() {
    const structureId = this.assignmentForm.get('structureId')?.value;
    this.selectedStructure = this.salaryStructures.find(s => s.id === structureId) || null;
  }

  assignStructure() {
    if (this.assignmentForm.valid && this.selectedEmployee && this.selectedStructure) {
      const formData = this.assignmentForm.value;
      console.log('Assignment Form Data:', formData);
      
      // Update employee with new structure
      const employeeIndex = this.employees.findIndex(e => e.id === this.selectedEmployee?.id);
      if (employeeIndex !== -1) {
        this.employees[employeeIndex].currentStructure = this.selectedStructure;
        
        // Populate salary components from structure
        this.employees[employeeIndex].salaryComponents = this.selectedStructure.components.map(comp => ({
          id: Date.now() + Math.random(),
          componentId: comp.componentId,
          componentName: comp.componentName,
          componentType: comp.componentType,
          calculationType: comp.calculationType,
          calculationValue: comp.calculationValue,
          isOverridden: false,
          originalValue: comp.calculationValue,
          isActive: comp.isDefault
        }));
      }
      
      this.closeAssignmentModal();
    }
  }

  openOverrideModal(employee: Employee, component: EmployeeSalaryComponent) {
    this.selectedEmployee = employee;
    this.selectedComponent = component;
    this.showOverrideModal = true;
    this.overrideForm.patchValue({
      calculationValue: component.calculationValue,
      isActive: component.isActive,
      overrideReason: ''
    });
  }

  closeOverrideModal() {
    this.showOverrideModal = false;
    this.selectedEmployee = null;
    this.selectedComponent = null;
    this.overrideForm.reset();
  }

  saveOverride() {
    if (this.overrideForm.valid && this.selectedEmployee && this.selectedComponent) {
      const formData = this.overrideForm.value;
      console.log('Override Form Data:', formData);
      
      // Update component with override
      const employeeIndex = this.employees.findIndex(e => e.id === this.selectedEmployee?.id);
      if (employeeIndex !== -1) {
        const componentIndex = this.employees[employeeIndex].salaryComponents.findIndex(
          c => c.id === this.selectedComponent?.id
        );
        if (componentIndex !== -1) {
          this.employees[employeeIndex].salaryComponents[componentIndex] = {
            ...this.employees[employeeIndex].salaryComponents[componentIndex],
            calculationValue: formData.calculationValue,
            isOverridden: formData.calculationValue !== this.selectedComponent.originalValue,
            isActive: formData.isActive
          };
        }
      }
      
      this.closeOverrideModal();
    }
  }

  removeAssignment(employee: Employee) {
    if (confirm(`Are you sure you want to remove the salary structure assignment for ${employee.name}?`)) {
      const employeeIndex = this.employees.findIndex(e => e.id === employee.id);
      if (employeeIndex !== -1) {
        this.employees[employeeIndex].currentStructure = undefined;
        this.employees[employeeIndex].salaryComponents = [];
      }
    }
  }

  getTotalSalary(employee: Employee): number {
    return employee.salaryComponents
      .filter(comp => comp.isActive && comp.componentType === 'Earning')
      .reduce((total, comp) => total + comp.calculationValue, 0);
  }

  getTotalDeductions(employee: Employee): number {
    return employee.salaryComponents
      .filter(comp => comp.isActive && comp.componentType === 'Deduction')
      .reduce((total, comp) => total + comp.calculationValue, 0);
  }

  getNetSalary(employee: Employee): number {
    return this.getTotalSalary(employee) - this.getTotalDeductions(employee);
  }

  getOverriddenComponents(employee: Employee): EmployeeSalaryComponent[] {
    return employee.salaryComponents.filter(comp => comp.isOverridden);
  }

  getErrorMessage(formGroup: FormGroup, controlName: string): string {
    const control = formGroup.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${controlName} is required`;
      }
      if (control.errors['min']) {
        return `${controlName} must be greater than 0`;
      }
    }
    return '';
  }

  getAssignedStructuresCount(): number {
    return this.employees.filter(e => e.currentStructure).length;
  }

  getTotalComponentsCount(): number {
    return this.employees.reduce((total, e) => total + e.salaryComponents.length, 0);
  }

  getOverriddenComponentsCount(): number {
    return this.employees.reduce((total, e) => total + this.getOverriddenComponents(e).length, 0);
  }

  getActiveStructures(): any[] {
    return this.salaryStructures.filter(s => s.isActive);
  }
} 
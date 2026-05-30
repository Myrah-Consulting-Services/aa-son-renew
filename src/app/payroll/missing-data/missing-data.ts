import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AddEmployeeComponent } from '../add-employee/add-employee';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-missing-data',
  standalone: true,
  imports: [CommonModule, FormsModule,AddEmployeeComponent],
  templateUrl: './missing-data.html',
  styleUrl: './missing-data.scss'
})
export class MissingData implements OnInit {
  missingData: any = null;
  selectedEmployees: Set<number> = new Set();
  searchQuery: string = '';
  filteredEmployees: any[] = [];
  loading: boolean = true;
  error: string = '';
  selectedEmployee: any;
  skipReason: string = '';
  payAsArrears: boolean = false;
  skipFormSubmitted: boolean = false;
  payrollRunId: any;
  constructor(
    private api: Api,
    private router: Router,
    private modalService: NgbModal,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.payrollRunId = this.route.snapshot.params['payrollRunId'];
    this.loadMissingData();
  }

  loadMissingData() {
    this.loading = true;
    this.api.get('/employee/employees-missing-data/' + this.api.getUserCompany() + '/').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.missingData = res;
          this.filteredEmployees = this.getAllMissingEmployees();
        } else {
          this.error = 'Failed to load missing data';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error loading missing data';
        this.loading = false;
        console.error('Error loading missing data:', err);
      }
    });
  }

  getAllMissingEmployees(): any[] {
    const employees: any[] = [];
    
    if (this.missingData?.employees_without_salary_structure?.employees) {
      this.missingData.employees_without_salary_structure.employees.forEach((emp: any) => {
        employees.push({
          ...emp,
          missingType: 'salary_structure',
          missingTypeLabel: 'Missing Salary Structure',
          status: 'Pending',
          statusClass: 'status-pending'
        });
      });
    }

    if (this.missingData?.employees_without_labour_card?.employees) {
      this.missingData.employees_without_labour_card.employees.forEach((emp: any) => {
        employees.push({
          ...emp,
          missingType: 'labour_card',
          missingTypeLabel: 'Missing Labour Card',
          status: 'Pending',
          statusClass: 'status-pending'
        });
      });
    }

    return employees;
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.filteredEmployees = this.getAllMissingEmployees().filter(emp => 
      emp.first_name.toLowerCase().includes(query.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(query.toLowerCase()) ||
      emp.emp_id.toLowerCase().includes(query.toLowerCase()) ||
      emp.work_email.toLowerCase().includes(query.toLowerCase()) ||
      emp.designation_name.toLowerCase().includes(query.toLowerCase())
    );
  }

  toggleEmployeeSelection(employeeId: number) {
    if (this.selectedEmployees.has(employeeId)) {
      this.selectedEmployees.delete(employeeId);
    } else {
      this.selectedEmployees.add(employeeId);
    }
  }

  selectAllEmployees() {
    this.filteredEmployees.forEach(emp => {
      this.selectedEmployees.add(emp.id);
    });
  }

  deselectAllEmployees() {
    this.selectedEmployees.clear();
  }

  completeEmployee(modal: any,employeeId: any) {
    this.selectedEmployee = employeeId;
    if(modal){
      let modalRef= this.modalService.open(modal, {
        size: 'xl',
        // windowClass:'custom',
        centered: true,
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
      });
      modalRef.result.then((result: any) => {
        this.loadMissingData();
      }).catch((error: any) => {
        this.loadMissingData();
      });    }
  }

  skipEmployee(modal: any, employeeId: any) {
    this.selectedEmployee = employeeId;
    this.skipReason = '';
    this.payAsArrears = false;
    this.skipFormSubmitted = false;
    
    if (modal) {
    let modalRef=  this.modalService.open(modal, {
        size: 'lg',
        centered: true,
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
      });
    
    modalRef.result.then((result: any) => {
      this.loadMissingData();
    }).catch((error: any) => {
      this.loadMissingData();
    });
  }
  }

  completeSelectedEmployees() {
    if (this.selectedEmployees.size === 0) {
      alert('Please select at least one employee to complete.');
      return;
    }

    const selectedEmployeesList = this.filteredEmployees.filter(emp => 
      this.selectedEmployees.has(emp.id)
    );
    this.selectedEmployee = selectedEmployeesList;

    // Navigate to bulk completion or process individually
    this.router.navigate(['/payroll/add-employee'], {
      queryParams: { 
        employeeIds: Array.from(this.selectedEmployees).join(','),
        mode: 'bulk'
      }
    });
  }

  getTotalMissingCount(): number {
    const salaryCount = this.missingData?.employees_without_salary_structure?.count || 0;
    const labourCount = this.missingData?.employees_without_labour_card?.count || 0;
    return salaryCount + labourCount;
  }

  getMissingDataSummary() {
    return {
      salaryStructure: this.missingData?.employees_without_salary_structure?.count || 0,
      labourCard: this.missingData?.employees_without_labour_card?.count || 0,
      total: this.getTotalMissingCount()
    };
  }

  goBack() {
    this.router.navigate(['/payroll/pay-run-detail']);
  }

  getSelectedEmployeeName(): string {
    if (this.selectedEmployee) {
      const employee = this.filteredEmployees.find(emp => emp.id === this.selectedEmployee);
      return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
    }
    return 'Unknown Employee';
  }

  getPayrollPeriod(): string {
    // You can get this from your API or component data
    return '01 Sep 2025 - 30 Sep 2025';
  }

  isNewlyJoinedEmployee(): boolean {
    if (this.selectedEmployee) {
      const employee = this.filteredEmployees.find(emp => emp.id === this.selectedEmployee);
      if (employee) {
        // Check if employee joined recently (within last 30 days)
        const joiningDate = new Date(employee.joining_date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joiningDate > thirtyDaysAgo;
      }
    }
    return false;
  }

  proceedSkip(modal: any) {
    this.skipFormSubmitted = true;
    
    if (!this.skipReason.trim()) {
      return; // Don't proceed if reason is empty
    }
    // /employee/skip_employee_payroll_run/
    const payload = {
      "payroll_run_id": this.payrollRunId,
      "company_id": this.api.getUserCompany(),
      "employee_id": this.selectedEmployee,
      "reason": this.skipReason
    }
    this.api.post('/employee/skip_employee_payroll_run/', payload).subscribe((res: any) =>  {
      if(res.status == 200){
        this.toast.show('Employee skipped successfully', 'success');
        this.loadMissingData();
      } else {
        this.toast.show('Failed to skip employee', 'error');
      }
      console.log(res, 'res');
    })
    // Here you would typically make an API call to skip the employee
    console.log('Skipping employee:', {
      employeeId: this.selectedEmployee,
      reason: this.skipReason,
      payAsArrears: this.payAsArrears
    });

    // Remove employee from the list
    this.filteredEmployees = this.filteredEmployees.filter(emp => emp.id !== this.selectedEmployee);
    
    // Close modal
    modal.close('Proceed');
    
    // Reset form
    this.skipReason = '';
    this.payAsArrears = false;
    this.skipFormSubmitted = false;
  }
}

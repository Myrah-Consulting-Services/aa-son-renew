import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Camp, CampAssignment, CampService } from './camp.service';
import { Api } from '../../core/services/api';
import { DemoDataService } from '../../core/demo/demo-data.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-camp-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './camp-detail.html',
  styleUrls: ['./camp-detail.scss'],
})
export class CampDetail implements OnInit {
  camp: Camp | null = null;
  assignments: CampAssignment[] = [];
  allEmployees: any[] = [];
  searchEmp = '';
  showAssignPanel = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campService: CampService,
    private api: Api,
    private demo: DemoDataService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.camp = this.campService.getCamp(id);
    if (!this.camp) {
      this.toast.show('Camp not found', 'error');
      this.router.navigate(['/payroll/camp-management']);
      return;
    }
    this.reloadAssignments();
    this.loadEmployees();
  }

  reloadAssignments(): void {
    if (!this.camp) return;
    this.assignments = this.campService.getAssignmentsByCamp(this.camp.id);
  }

  loadEmployees(): void {
    this.api.post('/employee/list_employees/', {
      company: this.api.getCompanyId(),
      page: 1,
      limit: 500,
    }).subscribe({
      next: (res: any) => {
        const rows = res?.data || res?.results || [];
        this.allEmployees = this.demo.employees(Array.isArray(rows) ? rows : []);
      },
      error: () => {
        this.allEmployees = this.demo.employees([]);
      },
    });
  }

  get occupied(): number {
    return this.camp ? this.campService.getOccupied(this.camp.id) : 0;
  }

  get available(): number {
    return this.camp ? this.campService.getAvailableSlots(this.camp.id) : 0;
  }

  /** Employees not currently in any camp */
  get availableEmployees(): any[] {
    const assignedIds = new Set(
      this.campService.getAssignments().flatMap((a) => [String(a.employeeId), String(a.empCode)])
    );
    const q = this.searchEmp.trim().toLowerCase();
    return this.allEmployees.filter((e) => {
      const id = String(e.id || e.employee_id || '');
      const code = String(e.emp_id || e.employee_id || '');
      if (assignedIds.has(id) || assignedIds.has(code)) return false;
      if (!q) return true;
      const name = `${e.first_name || ''} ${e.last_name || ''} ${e.employee_name || ''} ${code}`.toLowerCase();
      const desig = (e.designation_name || e.designation || '').toLowerCase();
      return name.includes(q) || desig.includes(q);
    });
  }

  empLabel(e: any): string {
    return e.employee_name || `${e.first_name || ''} ${e.last_name || ''}`.trim() || 'Employee';
  }

  empCode(e: any): string {
    return e.emp_id || e.employee_id || String(e.id || '');
  }

  empDesig(e: any): string {
    return e.designation_name || e.designation || 'Staff';
  }

  assign(e: any): void {
    if (!this.camp) return;
    try {
      this.campService.assignEmployee({
        campId: this.camp.id,
        employeeId: String(e.id || e.employee_id || e.emp_id),
        empCode: this.empCode(e),
        employeeName: this.empLabel(e),
        designation: this.empDesig(e),
      });
      this.toast.show(`${this.empLabel(e)} assigned to camp`, 'success');
      this.reloadAssignments();
    } catch (err: any) {
      this.toast.show(err?.message || 'Assign failed', 'error');
    }
  }

  remove(a: CampAssignment): void {
    if (!confirm(`Remove ${a.employeeName} from this camp?`)) return;
    this.campService.removeAssignment(a.id);
    this.toast.show('Employee removed from camp', 'success');
    this.reloadAssignments();
  }

  goBack(): void {
    this.router.navigate(['/payroll/camp-management']);
  }
}

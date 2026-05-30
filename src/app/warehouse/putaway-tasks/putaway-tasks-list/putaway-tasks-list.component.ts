import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-putaway-tasks-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './putaway-tasks-list.html',
  styleUrls: ['./putaway-tasks-list.scss']
})
export class PutawayTasksListComponent implements OnInit {
  filterForm: FormGroup;
  selectedTasks: string[] = [];
  
  stats = {
    pendingTasks: 18,
    assignedTasks: 12,
    inProgressTasks: 8,
    completedToday: 25
  };

  tasks :any= [];

  filteredTasks :any;

  tableForm: FormGroup;
  taskFormArray: FormArray;

  locations: any[] = [];
  employees: any;
  workers: any;
  modal: any;
  bulkAssignForm: FormGroup;
  // Filters and pagination
  searchText = '';
  startDate = '';
  endDate = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalData = 0;
  Math = Math;
  constructor(private fb: FormBuilder, private router: Router, 
    private apiService: Api,
     private modalService: NgbModal,
    private toast:ToastService) {
    this.filterForm = this.fb.group({
      search: [''],
      status: [''],
      priority: [''],
      loadingBay: [''],
      worker: [''],
      assignedWorker: ['']
    });
    this.taskFormArray = this.fb.array([]);
    this.tableForm = this.fb.group({
      taskFormArray: this.taskFormArray
    });
    this.bulkAssignForm = this.fb.group({
      workerId: ['']
    });
  }

  ngOnInit(): void {
    this.getWorkers();
    // Set default date range to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    this.startDate = formattedToday;
    this.endDate = formattedToday;
    this.getLocations();
    this.getTasks();
    // this.applyFilters();
    // this.getEmployees();
  }

  getEmployees(): void {
    this.apiService.post('/employee/list_employees/',{company:1}).subscribe((res: any) => {
      if (res.status === 200) {
        this.employees = res || [];
      }
    });
  }

  getLocations(): void {
    this.apiService.post('/warehouses/list-location/', { warehouse: 1 }).subscribe((res: any) => {
      if (res.status === 200) {
        this.locations = res.data || [];
      }
    });
  }

  getTasks(page: number = this.currentPage): void {
    this.currentPage = page;
    const payload: any = {
      company: 1,
      page_number: this.currentPage,
      page_size: this.pageSize,
      start_date: this.startDate,
      end_date: this.endDate
    };
    const search = this.searchText ? this.searchText : '';
    this.apiService.post('/invoice/putaway-list/s=' + search + '/', payload).subscribe((res: any) => {
      if(res.status == 200){
        this.tasks = res.data;
        this.filteredTasks = [...this.tasks];
        if (res.paginated_data) {
          this.currentPage = res.paginated_data.current_page;
          this.totalPages = res.paginated_data.total_pages;
          this.totalData = res.paginated_data.total_count;
          this.pageSize = res.paginated_data.page_size;
        }
        // Populate FormArray for each task
        this.taskFormArray.clear();
        this.filteredTasks.forEach((task: any) => {
          this.taskFormArray.push(this.fb.group({
            id: [task.id],
            assignedWorker: [task.assignedWorker || ''],
            // add other fields as needed
          }));
        });
      }
    });
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    const apiParams: any = {
      status: filters.status || null,
      priority: filters.priority || null,
      company: 1
    };

    let url = '/invoice/putaway-tasks-list/s=/';
    if (filters.search) {
      url = '/invoice/putaway-tasks-list/s=' + filters.search + '/';
      apiParams.search = filters.search;
    }

    if (filters.loadingBay) {
      apiParams.loadingBay = filters.loadingBay;
    }

    this.apiService.post(url, apiParams).subscribe((res: any) => {
      if (res.status === 200) {
        this.tasks = res.data;
        this.filteredTasks = [...this.tasks];
        this.taskFormArray.clear();
        this.filteredTasks.forEach((task: any) => {
          this.taskFormArray.push(this.fb.group({
            id: [task.id],
            priority: [task.priority],
            status: [task.status],
            toLocation: [task.toLocation || ''],
            assignedWorker: [task.assignedWorker || null]
          }));
        });
      }
    });
  }

  getWorkers(): void {
    this.apiService.post('/employee/list_employees/',{company:1}).subscribe((res: any) => {
      if (res.status === 200) {
        this.workers = res.data;
      }
    });
  }

  getWorkerName(workerId: string): string {
    if (!this.workers) return '';
    const worker = this.workers?.find((w: any) => w.id == workerId);
    return worker ? `${worker.first_name} ${worker.last_name}` : '';
  }

  getEmployeeDesignation(id: number|string): string {
    if (!this.employees) return '';
    const emp = this.employees.find((e: any) => e.id == id);
    return emp && emp.designation ? emp.designation : '';
  }

  refreshData(): void {
    // Refresh task data
  }

  createTask(): void {
    this.router.navigate(['/warehouse/putaway-tasks/create']);
  }

  autoAssignAll(): void {
  }

  isOverdue(dueTime: Date): boolean {
    return new Date() > new Date(dueTime);
  }

  isDueSoon(dueTime: Date): boolean {
    const now = new Date();
    const due = new Date(dueTime);
    const timeDiff = due.getTime() - now.getTime();
    return timeDiff > 0 && timeDiff < 30 * 60 * 1000; // 30 minutes
  }

  // Selection methods
  toggleSelectAll(event: any): void {
    if (event.target.checked) {
      this.selectedTasks = this.filteredTasks
        .filter((task: any) => task.statusName !== 'Completed' && task.statusName !== 'Assigned')
        .map((task: any) => task.id);
    } else {
      this.selectedTasks = [];
    }
  }

  isAllSelected(): boolean {
    const selectableTasks = this.filteredTasks?.filter((task: any) => task.statusName !== 'Completed' && task.statusName !== 'Assigned');
    return selectableTasks?.length > 0 && selectableTasks?.every((task: any) => this.selectedTasks.includes(task.id));
  }

  toggleTaskSelection(taskId: string): void {
    const index = this.selectedTasks.indexOf(taskId);
    if (index > -1) {
      this.selectedTasks.splice(index, 1);
    } else {
      this.selectedTasks.push(taskId);
    }
  }

  isTaskSelected(taskId: string): boolean {
    return this.selectedTasks.includes(taskId);
  }

  // Task actions
  assignTask(index: number): void {
    const formGroup = this.taskFormArray.at(index) as FormGroup;
    const assignedWorker = formGroup.value.assignedWorker;
    const taskId = formGroup.value.id;
    // Call your API or handle assignment logic here
    if (!assignedWorker) {
      this.toast.show('Warning', 'Please select a worker before assigning.','warning');
      return;
    }
    if (confirm('Are you sure you want to assign this task?')) {
      this.apiService.post('/invoice/update-putaway-task/', { task_id: taskId, assignedWorker: assignedWorker }).subscribe((res: any) => {
        if (res.status === 200) {
          this.getTasks();
          this.toast.show('Success', 'Task assigned successfully!', 'success');
        } else {
          this.toast.show('Error', 'Failed to assign task.', 'danger');
        }
      });
    }
  }

  bulkAssign(noTasks: any): void {
    // Bulk assign selected tasks
    this.modal=this.modalService.open(noTasks, { size: 'lg', centered: true });
  }

  bulkComplete(): void {
    // Bulk complete selected tasks
  }

  getPriorityText(priority: number): string {
    switch(priority) {
      case 1: return 'Normal';
      case 2: return 'High';
      case 3: return 'Critical';
      default: return 'Unknown';
    }
  }

  getStatusText(status: number): string {
    switch(status) {
      case 1: return 'Pending';
      case 2: return 'Assigned';
      case 3: return 'In Progress';
      case 4: return 'Completed';
      default: return 'Unknown';
    }
  }

  onPriorityChange(task: any) {
    // Call API to update priority if needed
    // this.apiService.put('/update-priority', { id: task.id, priority: task.priority }).subscribe(...)
  }

  onStatusChange(task: any) {
    // Call API to update status if needed
    // this.apiService.put('/update-status', { id: task.id, status: task.status }).subscribe(...)
  }

  onToLocationChange(task: any) {
    // Call API to update toLocation if needed
    // this.apiService.put('/update-to-location', { id: task.id, toLocation: task.toLocation }).subscribe(...)
  }

  submitBulkAssign(modal: any): void {
    const workerId = this.bulkAssignForm.value.workerId;
    if (!workerId || this.selectedTasks.length === 0) {
      this.toast.show('Warning', 'Please select a worker and at least one task.','warning');
      return;
    }
    if (confirm('Are you sure you want to assign the selected tasks to this worker?')) {
      this.apiService.post('/invoice/update-putaway-task/', { task_id: this.selectedTasks, assignedWorker: workerId }).subscribe((res: any) => {
        if (res.status === 200) {
          // Optionally clear selection
          this.selectedTasks = [];
          this.getTasks();
          this.toast.show('Success', 'Tasks assigned successfully!', 'success');
          modal.close();
        } else {
          this.toast.show('Error', 'Failed to assign tasks.', 'danger');
        }
      });
    }
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.getTasks(page);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.getTasks(1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  }

  clearFilters() {
    this.searchText = '';
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    this.startDate = formattedToday;
    this.endDate = formattedToday;
    this.getTasks(1);
  }

  triggerSearch() {
    this.getTasks(1);
  }
} 
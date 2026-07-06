import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RequisitionForm } from '../requisition-form/requisition-form';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbPanelTitle } from "../../../../node_modules/@ng-bootstrap/ng-bootstrap/accordion/accordion";

export interface Item {
  id?: number;
  name: string;
  sku: string;
  units: string[];
  description?: string;
}

@Component({
  selector: 'app-requisition-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, ReactiveFormsModule, RouterModule, RequisitionForm],
  templateUrl: './requisition-list.html',
  styleUrl: './requisition-list.scss'
})
export class RequisitionList implements OnInit {
  requisitions: any[] = [];
  filteredRequisitions: any[] = [];
  loading = false;
  filterForm!: FormGroup;
  modal: any;
  emit: any;
  modalMode: 'create' | 'approve' | 'view' = 'approve';

  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalData = 0;
  totalPages = 0;
  Math = Math; // For template math

  constructor(
    public svc: Api,
    private modalService: NgbModal,
    private toast: ToastService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    const today = new Date();
    const endDate = today.toISOString().slice(0, 10);
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const startDate = oneMonthAgo.toISOString().slice(0, 10);
    this.filterForm = this.fb.group({
      searchText: [''],
      selectedStatus: [''],
      startDate: [startDate],
      endDate: [endDate]
    });
    this.loadData();
  }
  openmodal(noTasks:any,a:any, mode: 'create' | 'approve' | 'view' = 'approve'){
    this.modal=this.modalService.open(noTasks, { size: 'xl', centered: true });
    this.emit=a
    this.modalMode = mode;
  }
  get pendingCount(): number {
    return this.filteredRequisitions.filter(req => req.status === 1).length;
  }
  get approvedCount(): number {
    return this.filteredRequisitions.filter(req => req.status === 2).length;
  }
  get rejectedCount(): number {
    return this.filteredRequisitions.filter(req => req.status === 3).length;
  }

  // Update loadData to use currentPage and pageSize
  loadData(page: number = this.currentPage, filters?: any) {
    this.loading = true;
    this.currentPage = page;
    const formVals = filters || this.filterForm?.value || {};
    const payload: any = {
      company: this.svc.getCompanyId(),
      inward_type: 4,
      status: formVals.selectedStatus ? +formVals.selectedStatus : 0,
      start_date: formVals.startDate,
      end_date: formVals.endDate,
      search: formVals.searchText || '',
      page_number: this.currentPage,
      page_size: this.pageSize
    };
    this.svc.post('/invoice/notifications/s=' + payload.search + '/', payload).subscribe((res: any) => {
      if(res.status == 200){
        this.requisitions = res.data;
        this.filteredRequisitions = [...this.requisitions];
        if (res.paginated_data) {
          this.currentPage = res.paginated_data.current_page;
          this.totalPages = res.paginated_data.total_pages;
          this.totalData = res.paginated_data.total_data;
          this.pageSize = res.paginated_data.page_size;
        }
      }
      this.loading = false;
    });
  }

  onFilterSubmit() {
    this.loadData(this.filterForm.value);
  }

  clearFilters() {
    this.filterForm.reset();
    this.loadData();
  }

  getStatusName(status: number): string {
    switch(status) {
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 4: return 'Rejected';
      case 3: return 'Pickup';
      case 6: return  'Completed';
      case 8: return  'Dispatched';
      case 10: return	'Request Delivered';
      case 11: return	'Request Approved';
      case 12: return	'Request Assigned';
      case 13: return	'Request Stored';
      default: return 'Unknown';
    }
  }

  getStatusBadgeClass(status: number): string {
    switch(status) {
      case 1: return 'badge bg-warning';
      case 2: return 'badge bg-success';
      case 3: return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  }
  openPickupForm() {
    this.router.navigate(['/warehouse/pickup-task/new']);
  }
  openForm(modalTemplate: any) {
    this.openmodal(modalTemplate, null, 'create');
  }
  updateRequisitionStatus(requisitionId: number, newStatus: number) {
    const statusName = this.getStatusName(newStatus);
    if (confirm(`Are you sure you want to ${statusName.toLowerCase()} this requisition?`)) {
      this.svc.post('/invoice/change-requistion-status/', {
        inward_id: requisitionId,
        status_id: newStatus
      }).subscribe((res: any) => {
        if(res.status == 200){
          this.toast.show('Success', `Requisition ${statusName.toLowerCase()} successfully`, 'success');
          this.loadData();
        } else {
          this.toast.show('Error', 'Failed to update requisition status', 'danger');
        }
      }, (error) => {
        this.toast.show('Error', 'Failed to update requisition status', 'danger');
      });
    }
  }
  refreshData() {
    this.loadData();
  }
  getItem(itemId: number): any {
    return { name: 'Item ' + itemId };
  }

  onSubmit(a:any): void {
    const formValue = {
      requisition: a.id,
      status: 4,
      assignedWorker: null
    };
    if (confirm('Are you sure you want to reject this requisition?')) {
      this.svc.post('/invoice/requisition-update/', formValue).subscribe((res: any) => {
        if (res.status == 200) {
          // this.modalRef.close();
    this.loadData();

        }
      });
    }
  }

  // Add a method to change page
  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadData(page);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData(1);
  }
  requisitionCreated(a:any){
    this.loadData(1);

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
  viewRequisition(modalTemplate: any, req: any) {
    this.openmodal(modalTemplate, req.id, 'view');
  }
}

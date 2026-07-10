import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
    
@Component({
  selector: 'app-requisitions-report',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './requisitions-report.html',
  styleUrl: './requisitions-report.scss'
})
export class RequisitionsReport implements OnInit {
  requisitions: any[] = [];
  filteredRequisitions: any[] = [];
  items: any[] = [];
  loading = false;

  // Pagination
  currentPage = 1;
  pageSize: number = 10;
  totalPages = 0;
  totalData = 0;
  Math = Math;
  readonly pageSizeOptions = [10, 25, 50, 100];
  
  filters = {
    status: '',
    requestor: '',
    department: '',
    startDate: '',
    endDate: ''
  };

  constructor(
    private svc: Api,
    private route: ActivatedRoute,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Default date range: last 12 months through today (API requires dates)
    if (!this.filters.startDate || !this.filters.endDate) {
      const end = new Date();
      const start = new Date();
      start.setFullYear(end.getFullYear() - 1);
      this.filters.endDate = end.toISOString().split('T')[0];
      this.filters.startDate = start.toISOString().split('T')[0];
    }
    this.loadData(1);
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;

    const endDate = this.filters.endDate || new Date().toISOString().split('T')[0];
    let startDate = this.filters.startDate;
    if (!startDate) {
      const start = new Date(endDate);
      start.setFullYear(start.getFullYear() - 1);
      startDate = start.toISOString().split('T')[0];
    }

    const payload: any = {
      company: this.svc.getCompanyId(),
      start_date: startDate,
      end_date: endDate,
      inward_type: 4,
      status: this.filters.status ? Number(this.filters.status) : 0,
      page_number: this.currentPage,
      page_size: Number(this.pageSize) || 10,
    };

    // Backend route requires keyw: notifications/<keyw>/  (same as requisition-list)
    this.svc.post('/invoice/notifications/s=/', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 200) {
          this.requisitions = res.data || [];
          if (res.paginated_data) {
            this.currentPage = Number(res.paginated_data.current_page) || this.currentPage;
            this.totalPages = Number(res.paginated_data.total_pages) || 0;
            this.totalData = Number(res.paginated_data.total_data) || this.requisitions.length;
            this.pageSize = Number(res.paginated_data.page_size) || this.pageSize;
          } else {
            this.totalData = this.requisitions.length;
            this.totalPages = 1;
          }
          this.applyFilters();
        } else {
          this.requisitions = [];
          this.filteredRequisitions = [];
          this.totalData = 0;
          this.totalPages = 0;
          this.toast.show('Error', res.error || 'Failed to load requisitions', 'danger');
        }
      },
      error: () => {
        this.loading = false;
        this.requisitions = [];
        this.filteredRequisitions = [];
        this.totalData = 0;
        this.totalPages = 0;
        this.toast.show('Error', 'Failed to load requisitions', 'danger');
      }
    });

    this.svc.listItems('').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.items = res.data || [];
        }
      }
    });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadData(page);
    }
  }

  onPageSizeChange() {
    this.pageSize = Number(this.pageSize) || 10;
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

  get showingFrom(): number {
    if (!this.totalData) return 0;
    return (this.currentPage - 1) * Number(this.pageSize) + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * Number(this.pageSize), this.totalData);
  }

  /** Client-side filters for requestor/department; status/dates are applied via API on reload. */
  applyFilters() {
    this.filteredRequisitions = this.requisitions.filter(req => {
      const requestor = this.filters.requestor?.toLowerCase().trim();
      const department = this.filters.department;

      if (requestor) {
        const haystack = [
          req.requestor,
          req.created_by_user,
          req.assignedWorkerName,
          req.receivedBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(requestor)) return false;
      }
      if (department && req.department !== department) return false;

      return true;
    });
  }

  onStatusOrDateChange() {
    this.loadData(1);
  }

  /** Align with requisition-list TransactionStatus ids */
  getStatusName(status: number | string | null | undefined): string {
    const id = Number(status);
    switch (id) {
      case 1: return 'Pending';
      case 2: return 'Approved';
      case 3: return 'Pickup';
      case 4: return 'Rejected';
      case 6: return 'Completed';
      case 8: return 'Dispatched';
      case 10: return 'Request Delivered';
      case 11: return 'Request Approved';
      case 12: return 'Request Assigned';
      case 13: return 'Request Stored';
      default: return (typeof status === 'string' && status) ? status : 'Unknown';
    }
  }

  getStatusBadgeClass(status: number | string | null | undefined): string {
    const id = Number(status);
    if (id === 1 || id === 8) return 'bg-warning';
    if (id === 2 || id === 6 || id === 10 || id === 11) return 'bg-success';
    if (id === 4 || id === 13) return 'bg-danger';
    if (id === 3 || id === 12) return 'bg-info';
    return 'bg-secondary';
  }

  getRequestor(req: any): string {
    return req?.requestor || req?.created_by_user || req?.assignedWorkerName || req?.receivedBy || 'N/A';
  }

  getDepartment(req: any): string {
    return req?.department || req?.warehouseName || req?.toWarehouseName || 'Showroom';
  }

  getDepartmentOptions(): string[] {
    const set = new Set<string>();
    this.requisitions.forEach(req => {
      const d = this.getDepartment(req);
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }

  // Action methods for approve/reject
  approveRequisition(requisitionId: number) {
    if (confirm('Are you sure you want to approve this requisition?')) {
      this.updateRequisitionStatus(requisitionId, 2);
    }
  }

  rejectRequisition(requisitionId: number) {
    if (confirm('Are you sure you want to reject this requisition?')) {
      this.updateRequisitionStatus(requisitionId, 4);
    }
  }

  updateRequisitionStatus(requisitionId: number, newStatus: number) {
    const statusName = this.getStatusName(newStatus);
    
    this.svc.post('/invoice/change-requistion-status/', {
      inward_id: requisitionId,
      status_id: newStatus
    }).subscribe({
      next: (res: any) => {
        if (res.status == 200) {
          this.toast.show('Success', `Requisition ${statusName.toLowerCase()} successfully`, 'success');
          this.loadData(this.currentPage);
        } else {
          this.toast.show('Error', 'Failed to update requisition status', 'danger');
        }
      },
      error: () => {
        this.toast.show('Error', 'Failed to update requisition status', 'danger');
      }
    });
  }

  getItemName(item: any): string {
    if (!item) return 'Unknown';
    if (typeof item === 'object') {
      if (item.item_name) return item.item_name;
      const id = item.itemId;
      const found = this.items.find((i: any) => i.id === id);
      return found?.name || (id != null ? `Item #${id}` : 'Unknown');
    }
    const found = this.items.find((i: any) => i.id === item);
    return found?.name || 'Unknown';
  }

  getTotalItems(): number {
    return this.filteredRequisitions.reduce((total, req) => {
      return total + this.getTotalItemsForRequisition(req);
    }, 0);
  }

  getPendingCount(): number {
    return this.filteredRequisitions.filter(req => Number(req.status) === 1).length;
  }

  getApprovedCount(): number {
    return this.filteredRequisitions.filter(req => {
      const s = Number(req.status);
      return s === 2 || s === 11;
    }).length;
  }

  getRejectedCount(): number {
    return this.filteredRequisitions.filter(req => Number(req.status) === 4).length;
  }

  getTotalItemsForRequisition(req: any): number {
    if (req?.total_quantity != null) return Number(req.total_quantity) || 0;
    if (req?.total_items != null && !req?.items?.length) return Number(req.total_items) || 0;
    return req.items?.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0) || 0;
  }

  getRequisitionsByStatus() {
    const statusMap = new Map<number, number>();
    this.filteredRequisitions.forEach(req => {
      const id = Number(req.status);
      const count = statusMap.get(id) || 0;
      statusMap.set(id, count + 1);
    });
    return Array.from(statusMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([status, count]) => ({
        status: this.getStatusName(status),
        count
      }));
  }

  getRequisitionsByDepartment() {
    const deptMap = new Map<string, number>();
    this.filteredRequisitions.forEach(req => {
      const dept = this.getDepartment(req);
      const count = deptMap.get(dept) || 0;
      deptMap.set(dept, count + 1);
    });
    return Array.from(deptMap.entries()).map(([department, count]) => ({ department, count }));
  }

  exportToCSV() {
    const headers = ['Date', 'Invoice No', 'Requestor', 'Department', 'Created By', 'Items', 'Status', 'Total Qty'];
    const csvContent = [
      headers.join(','),
      ...this.filteredRequisitions.map(req => {
        const itemsList = req.items?.map((item: any) =>
          `${this.getItemName(item)} (${item.quantity})`
        ).join('; ') || 'No items';
        const totalItems = this.getTotalItemsForRequisition(req);
        return [
          new Date(req.date).toLocaleDateString(),
          req.invoiceNo || `REQ-${req.id}`,
          this.getRequestor(req),
          this.getDepartment(req),
          req.created_by_user || 'System',
          `"${itemsList.replace(/"/g, '""')}"`,
          this.getStatusName(req.status),
          totalItems
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `requisitions-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    this.toast.show('Success', 'Report exported successfully', 'success');
  }

  clearFilters() {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    this.filters = {
      status: '',
      requestor: '',
      department: '',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
    this.loadData(1);
  }
} 
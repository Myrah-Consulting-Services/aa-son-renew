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
    this.loadData();
    this.applyFilters();
  }

  loadData() {
    this.loading = true;
    this.svc.post('/invoice/notifications/',{ 
      "company": this.svc.getCompanyId(),
      "start_date": "2024-01-01",
      "end_date": "2025-12-31",
      "inward_type": 4,
      "status": 0
    }).subscribe((res: any) => {
      if(res.status == 200){
        this.requisitions = res.data;
        this.filteredRequisitions = [...res.data];
        this.applyFilters();
      }
      this.loading = false;
    });
    
    this.svc.listItems('', { warehouse: 1 }).subscribe((res: any) => {
      if(res.status == 200){
        this.items = res.data;
      }
    });
  }

  applyFilters() {
    this.filteredRequisitions = this.requisitions.filter(req => {
      const status = this.filters.status;
      const requestor = this.filters.requestor;
      const department = this.filters.department;
      const startDate = this.filters.startDate;
      const endDate = this.filters.endDate;

      if (status && req.status != status) return false;
      if (requestor && !req.requestor?.toLowerCase().includes(requestor.toLowerCase())) return false;
      if (department && req.department !== department) return false;
      if (startDate && new Date(req.date) < new Date(startDate)) return false;
      if (endDate && new Date(req.date) > new Date(endDate)) return false;

      return true;
    });
  }

  // Status methods for numeric status (1=pending, 2=approved, 3=rejected)
  getStatusName(status: number): string {
    switch(status) {
      case 1: return 'Pending';
      case 2: return 'Approved'; 
      case 3: return 'Rejected';
      default: return 'Unknown';
    }
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 1: return 'bg-warning';
      case 2: return 'bg-success';
      case 3: return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  // Action methods for approve/reject
  approveRequisition(requisitionId: number) {
    if (confirm('Are you sure you want to approve this requisition?')) {
      this.updateRequisitionStatus(requisitionId, 2);
    }
  }

  rejectRequisition(requisitionId: number) {
    if (confirm('Are you sure you want to reject this requisition?')) {
      this.updateRequisitionStatus(requisitionId, 3);
    }
  }

  updateRequisitionStatus(requisitionId: number, newStatus: number) {
    const statusName = this.getStatusName(newStatus);
    
    this.svc.post('/invoice/change-requistion-status/', {
      inward_id: requisitionId,
      status_id: newStatus
    }).subscribe((res: any) => {
      if(res.status == 200){
        this.toast.show('Success', `Requisition ${statusName.toLowerCase()} successfully`, 'success');
        this.loadData(); // Reload data to reflect changes
      } else {
        this.toast.show('Error', 'Failed to update requisition status', 'danger');
      }
    }, (error) => {
      this.toast.show('Error', 'Failed to update requisition status', 'danger');
    });
  }

  getItemName(id: number): string {
    const item = this.items.find(i => i.id === id);
    return item ? item.name : 'Unknown';
  }

  getTotalItems(): number {
    return this.filteredRequisitions.reduce((total, req) => {
      return total + (req.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0);
    }, 0);
  }

  getPendingCount(): number {
    return this.filteredRequisitions.filter(req => req.status === 1).length;
  }

  getApprovedCount(): number {
    return this.filteredRequisitions.filter(req => req.status === 2).length;
  }

  getRejectedCount(): number {
    return this.filteredRequisitions.filter(req => req.status === 3).length;
  }

  getTotalItemsForRequisition(req: any): number {
    return req.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  }

  getRequisitionsByStatus() {
    const statusMap = new Map<number, number>();
    this.filteredRequisitions.forEach(req => {
      const count = statusMap.get(req.status) || 0;
      statusMap.set(req.status, count + 1);
    });
    return Array.from(statusMap.entries()).map(([status, count]) => ({ 
      status: this.getStatusName(status), 
      count 
    }));
  }

  getRequisitionsByDepartment() {
    const deptMap = new Map<string, number>();
    this.filteredRequisitions.forEach(req => {
      const dept = req.department || 'Unknown';
      const count = deptMap.get(dept) || 0;
      deptMap.set(dept, count + 1);
    });
    return Array.from(deptMap.entries()).map(([department, count]) => ({ department, count }));
  }

  exportToCSV() {
    const headers = ['Date', 'Invoice No', 'Requestor', 'Department', 'Created By', 'Items', 'Status', 'Total Items'];
    const csvContent = [
      headers.join(','),
      ...this.filteredRequisitions.map(req => {
        const itemsList = req.items?.map((item: any) => 
          `${this.getItemName(item.itemId)} (${item.quantity})`
        ).join('; ') || 'No items';
        const totalItems = this.getTotalItemsForRequisition(req);
        return [
          new Date(req.date).toLocaleDateString(),
          req.invoiceNo || `REQ-${req.id}`,
          req.requestor || 'N/A',
          req.department || 'N/A',
          req.created_by_user || 'System',
          itemsList,
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
    this.filters = {
      status: '',
      requestor: '',
      department: '',
      startDate: '',
      endDate: ''
    };
    this.applyFilters();
  }
} 
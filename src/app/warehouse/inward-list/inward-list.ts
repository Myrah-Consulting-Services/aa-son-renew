import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { InwardForm } from '../inward-form/inward-form';
import { Api } from '../../core/services/api';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../core/services/toast.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface InwardReceipt {
  id: number;
  date: string;
  poNo: any;
  invoiceNo: string;
  grnNo: string;
  vehicleNo: string;
  transporter: string;
  lrNo: string;
  deliveryNoteNo: string;
  receivedBy: string;
  remarks: string;
  totalAmount: number;
  deleted: boolean;
  created_at: string;
  updated_at: string | null;
  company: number;
  inwardType: number;
  supplierId: number;
  warehouseId: number;
  locationId: number;
  supplier?: any;
  warehouse?: any;
  location?: any;
  items?: any[];
  putaway_status_id?: number;
  putaway_status_name?: string;
}

@Component({
  selector: 'app-inward-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterModule],
  templateUrl: './inward-list.html',
  styleUrl: './inward-list.scss'
})
export class InwardList implements OnInit {
  receipts: InwardReceipt[] = [];
  filteredReceipts: InwardReceipt[] = [];
  loading = false;
  searchText = '';
  fromDate = '';
  toDate = '';
  suppliers: any[] = [];
  warehouses: any[] = [];
  locations: any[] = [];
  items: any[] = [];
  currentDate = new Date();
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalData = 0;
  // Summary data
  totalReceipts = 0;
  totalAmount = 0;
  todayReceipts = 0;
  thisMonthReceipts = 0;
  
  constructor(
    private svc: Api,
    private modalService: NgbModal,
    private toast: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.setDefaultDates();
    this.loadData();
    this.loadMasterData();
  }

  setDefaultDates() {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.fromDate = firstDayOfMonth.toISOString().split('T')[0];
    this.toDate = lastDayOfMonth.toISOString().split('T')[0];
  }
  getcurrency(){
   
    return this.svc.getcurrencies();
  }
  getcurrencysecond(){
   
    return this.svc.getcurrenciesecond();
  }

  getDate() {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    };
  }

  loadMasterData() {
    // Load suppliers
    this.svc.post('/party/list-party/s=/', { company: this.svc.getCompanyId(), partyType: 2 }).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.suppliers = res.data;
          // this.toast.show('Success', 'Suppliers loaded successfully', 'success');
        }
      },
      error: (error) => {
        this.toast.show('Error', 'Failed to load suppliers', 'danger');
      }
    });
  }

  loadData(page: number = 1) {
    this.loading = true;
    this.currentPage = page;
    const payload: any = {
      company: this.svc.getCompanyId(),
      start_date: this.fromDate,
      end_date: this.toDate,
      page_number: this.currentPage,
      page_size: this.pageSize
    };
    const search = this.searchText ? this.searchText : '';
    this.svc.post('/invoice/list-inward/s=' + search + '/', payload).subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.receipts = res.data || [];
          this.filteredReceipts = [...this.receipts];

          if (res.kpis) {
            this.totalReceipts = res.kpis.total_receipts ?? 0;
            this.totalAmount = Number(res.kpis.total_amount ?? 0);
            this.todayReceipts = res.kpis.today ?? 0;
            this.thisMonthReceipts = res.kpis.this_month ?? 0;
          } else {
            this.calculateSummary();
          }

          if (res.paginated_data) {
            this.currentPage = res.paginated_data.current_page ?? this.currentPage;
            this.totalPages = res.paginated_data.total_pages ?? 0;
            this.totalData = res.paginated_data.total_data ?? res.paginated_data.total_count ?? 0;
            const apiPageSize = res.paginated_data.page_size;
            if (apiPageSize != null) {
              this.pageSize = typeof apiPageSize === 'string' ? parseInt(apiPageSize, 10) : apiPageSize;
            }
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toast.show('Error', 'Failed to load inward list', 'danger');
      }
    });
  }

  calculateSummary() {
    this.totalReceipts = this.receipts.length;
    this.totalAmount = Number(this.receipts.reduce((sum, receipt) => sum + (receipt.totalAmount || 0), 0));
    
    const today = new Date().toISOString().split('T')[0];
    this.todayReceipts = this.receipts.filter(receipt => receipt.date === today).length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    this.thisMonthReceipts = this.receipts.filter(receipt => {
      const receiptDate = new Date(receipt.date);
      return receiptDate.getMonth() === currentMonth && receiptDate.getFullYear() === currentYear;
    }).length;
  }

  filterByDate() {
    if (!this.fromDate || !this.toDate) {
      this.toast.show('Warning', 'Please select both from and to dates', 'warning');
      return;
    }
    this.currentPage = 1;
    this.loadData(1);
  }

  clearFilter() {
    this.setDefaultDates();
    this.searchText = '';
    this.currentPage = 1;
    this.loadData(1);
  }

  searchReceipts() {
    this.currentPage = 1;
    this.loadData(1);
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.loadData(page);
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.loadData(1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  openForm(id?: number) {
    const modalRef = this.modalService.open(InwardForm, { 
      centered: true, 
      size: 'xl'
    });
    
    // Set the editInwardId for edit mode
    if (id) {
      modalRef.componentInstance.editInwardId = id;
    }
    
    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
        // Show success message based on the action
        const action = id ? 'updated' : 'created';
        this.toast.show('Success', `Inward receipt ${action} successfully`, 'success');
      }
    }).catch(() => {
      // Modal was dismissed - no action needed
    }) .finally(() => {
      this.loadData();
    });
  }

  getSupplierName(supplierId: number): string {
    if (!supplierId || !this.suppliers || this.suppliers.length === 0) {
      return 'Unknown Supplier';
    }
    
    const supplier = this.suppliers.find(s => s.id == supplierId);
    if (supplier) {
      return supplier.partyName || supplier.party_name || supplier.company_name || 'Unknown Supplier';
    }
    
    return `Supplier ID: ${supplierId}`;
  }

  getWarehouseName(warehouseId: number): string {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  }

  getLocationName(locationId: number): string {
    const location = this.locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown Location';
  }

  getInwardTypeName(type: number): string {
    const types = {
      1: 'Purchase',
      2: 'Return',
      3: 'Transfer',
      4: 'Other'
    };
    return types[type as keyof typeof types] || 'Unknown';
  }

  getInwardTypeBadgeClass(type: number): string {
    const classes = {
      1: 'badge bg-success',
      2: 'badge bg-warning',
      3: 'badge bg-info',
      4: 'badge bg-secondary'
    };
    return classes[type as keyof typeof classes] || 'badge bg-secondary';
  }

  canEditReceipt(receipt: InwardReceipt): boolean {
    return (receipt.putaway_status_name || '').trim().toLowerCase() === 'pending';
  }

  getPutawayStatusBadgeClass(statusName?: string): string {
    const status = (statusName || '').trim().toLowerCase();
    if (status === 'pending') return 'badge bg-warning';
    if (status === 'completed') return 'badge bg-success';
    if (status === 'in progress') return 'badge bg-info';
    return 'badge bg-secondary';
  }

  deleteReceipt(id: number) {
    if (confirm('Are you sure you want to delete this inward receipt?')) {
      this.svc.delete('/warehouses/delete-inward-transaction/' + id).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.loadData();
            this.toast.show('Success', 'Inward receipt deleted successfully', 'success');
          }
        },
        error: (error) => {
          this.toast.show('Error', 'Failed to delete inward receipt', 'danger');
        }
      });
    }
  }

  refreshData() {
    this.loadData();
  }

  exportData() {
    const company  = this.svc.getCompanyId();
    const start    = this.fromDate;
    const end      = this.toDate;

    if (!start || !end) {
      this.toast.show('Warning', 'Please set date range before exporting', 'warning');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const url = `https://aasonsapi.esarwa.com/invoice/export-inward/?company=${company}&start_date=${start}&end_date=${end}`;

    this.toast.show('Info', 'Preparing export...', 'info');

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob: Blob) => {
        // Determine file extension from blob type
        const isExcel = blob.type.includes('spreadsheet') || blob.type.includes('excel') || blob.type.includes('openxmlformats');
        const ext      = isExcel ? 'xlsx' : 'csv';
        const fileName = `inward_${start}_to_${end}.${ext}`;

        // Trigger browser download
        const url    = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href     = url;
        anchor.download = fileName;
        anchor.click();
        window.URL.revokeObjectURL(url);

        this.toast.show('Success', 'Export downloaded successfully', 'success');
      },
      error: () => {
        this.toast.show('Error', 'Failed to export data', 'danger');
      }
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
import { CreateInvoice } from '../../Invoices/create-invoice/create-invoice';
import { ActivatedRoute, RouterModule } from '@angular/router';

interface SalesInvoice {
  id: number;
  party_name: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  terms: number;
  taxable_amt: number;
  total_vat: number;
  total_discount: number;
  extra_charge: any[];
  round_off: boolean;
  full_payment: boolean;
  receivable: number;
  received_amount: number;
  final_total_amount: number;
  notes: string;
  exchange_rate: number;
  merge_items: boolean;
  discount_on_total: number;
  financial_year: string;
  deleted_at: string | null;
  deleted: boolean;
  created_at: string | null;
  created_by_user: any;
  update_at: string | null;
  updated_by_user: any;
  deleted_by_user: any;
  against_grn_inv: any;
  company: number;
  invoice_type: number;
  party: number;
  handover_to: number | null;
  bank: number | null;
  received_amount_by: number;
  payment_status: number;
  created_by: number | null;
  updated_by: number | null;
  deleted_by: number | null;
  warehouse: number | null;
}

interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_data: number;
  page_size: number;
}

@Component({
  selector: 'app-sales-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './sales-register.html',
  styleUrl: './sales-register.scss'
})
export class SalesRegister implements OnInit {
  salesInvoices: SalesInvoice[] = [];
  loading = false;
  error = '';
  filterForm: FormGroup;
  dictionary_name: string = '';
  
  // Pagination properties
  pagination: PaginationInfo = {
    current_page: 1,
    total_pages: 1,
    total_data: 0,
    page_size: 10
  };
  currentPage: number = 1;
  pageSize: number = 10;
  
  // Make Math available in template
  Math = Math;

  constructor(
    private api: Api,
    private fb: FormBuilder,
    private modalService:NgbModal,
    private toast:ToastService,
    private route: ActivatedRoute
  ) {
    this.filterForm = this.fb.group({
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      invoice_type: ['', Validators.required],
      company: ['1', Validators.required],
      search: [''] // Add search field
    });
  }

  ngOnInit() {
    // Set default dates (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    this.filterForm.patchValue({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    });
    this.loadInvoiceTypeFromUrl();
  }

  getSalesRegister(page: number = 1) {
    this.loading = true;
    this.error = '';
    this.currentPage = page;
    
    const formValue = this.filterForm.value;
    const searchTerm = formValue.search || '';
    
    // Build URL with search term
    const apiUrl = `/invoice/list-invoice/s=${searchTerm}/`;
    
    this.api.post(apiUrl, {
      company: formValue.company,
      start_date: formValue.start_date,
      end_date: formValue.end_date,
      invoice_type: formValue.invoice_type,
      page_number: page,
      page_size: this.pageSize
    }).subscribe({
      next: (response: any) => {
        console.log('Sales Register Response:', response);
        if (response && response.status === 200) {
          this.salesInvoices = response.data || [];
          this.pagination = response.pagination || {
            current_page: 1,
            total_pages: 1,
            total_data: 0,
            page_size: 10
          };
          this.initializePaginationIfMissing(response);
        } else {
          this.error = 'Failed to load sales register data';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching sales register:', error);
        this.error = 'Error loading sales register data';
        this.loading = false;
      }
    });
  }

  onFilterSubmit() {
    if (this.filterForm.valid) {
      this.currentPage = 1; // Reset to first page when filtering
      this.getSalesRegister(1);
    } else {
      this.filterForm.markAllAsTouched();
    }
  }

  // Clear search and reset to first page
  clearSearch() {
    this.filterForm.patchValue({ search: '' });
    this.currentPage = 1;
    this.getSalesRegister(1);
  }

  // Handle search input changes (optional: for real-time search)
  onSearchChange() {
    // Reset to first page when search changes
    this.currentPage = 1;
    this.getSalesRegister(1);
  }

  // Pagination methods
  onPageChange(page: number) {
    if (page >= 1 && page <= this.pagination.total_pages) {
      console.log('Changing to page:', page);
      this.getSalesRegister(page);
    } else {
      console.warn('Invalid page number:', page, 'Total pages:', this.pagination.total_pages);
    }
  }

  onPageSizeChange(newPageSize: number) {
    console.log('Changing page size to:', newPageSize);
    this.pageSize = newPageSize;
    this.currentPage = 1; // Reset to first page when changing page size
    this.getSalesRegister(1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const totalPages = this.pagination.total_pages;
    const currentPage = this.pagination.current_page;
    
    // Show up to 5 page numbers around current page
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + 4);
      } else {
        startPage = Math.max(1, endPage - 4);
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Handle cases where API doesn't return pagination data
  private initializePaginationIfMissing(response: any) {
    if (!response.pagination && response.data) {
      // If no pagination data, create a simple one-page pagination
      this.pagination = {
        current_page: 1,
        total_pages: 1,
        total_data: response.data.length,
        page_size: response.data.length
      };
    }
  }

  getPaymentStatus(status: number): string {
    switch (status) {
      case 1: return 'Unpaid';
      case 2: return 'Partial';
      case 3: return 'Paid';
      default: return 'Unknown';
    }
  }

  getStatusBadgeClass(status: number): string {
    switch (status) {
      case 1: return 'badge bg-danger';
      case 2: return 'badge bg-warning text-dark';
      case 3: return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }

  viewInvoice(id: any) {
    // console.log('View invoice:', invoice);
      const modalRef = this.modalService.open(CreateInvoice, { 
        centered: true, 
        windowClass: 'my-class',
        size: 'xl'
      });
      modalRef.componentInstance.isModal = true;
      // Set the editOutwardId for edit mode
      if (id) {
        modalRef.componentInstance.editinvoiceId = id;
      }
      
      modalRef.result.then((result) => {
        if (result) {
          // this.loadData();
    this.getSalesRegister(this.currentPage);

          // Show success message based on the action
          // const action = id ? 'updated' : 'created';
          // this.toast.show('Success', `Outward dispatch ${action} successfully`, 'success');
        }
      }).catch(() => {
        // Modal was dismissed - no action needed
      });
    
    // Implement view functionality
  }

  downloadInvoice(invoice: SalesInvoice) {
    console.log('Download invoice:', invoice);
    // Implement download functionality
  }

  // Computed properties for summary totals
  get totalInvoices(): number {
    return this.salesInvoices.length;
  }

  get totalTaxableAmount(): number {
    return this.salesInvoices.reduce((sum, inv) => sum + inv.taxable_amt, 0);
  }

  get totalVAT(): number {
    return this.salesInvoices.reduce((sum, inv) => sum + inv.total_vat, 0);
  }

  get totalDiscount(): number {
    return this.salesInvoices.reduce((sum, inv) => sum + inv.total_discount, 0);
  }

  get totalAmount(): number {
    return this.salesInvoices.reduce((sum, inv) => sum + inv.final_total_amount, 0);
  }

  get paidInvoices(): number {
    return this.salesInvoices.filter(inv => inv.payment_status === 3).length;
  }

  get partialInvoices(): number {
    return this.salesInvoices.filter(inv => inv.payment_status === 2).length;
  }

  get unpaidInvoices(): number {
    return this.salesInvoices.filter(inv => inv.payment_status === 1).length;
  }

  getcurrency() {
    return this.api.getcurrencies();
  }

  private loadInvoiceTypeFromUrl(): void {
    // Get invoice type and search from URL parameters
    this.route.queryParams.subscribe(params => {
      const invoiceType = params['type'];
      const searchTerm = params['search'];
      console.log('URL Invoice Type Parameter:', invoiceType);
      console.log('URL Search Parameter:', searchTerm);

      if (invoiceType) {
        let selectedType = '';

        // Map URL parameters to invoice type values
        switch (invoiceType.toLowerCase()) {
          case 'sales':
            selectedType = '1';
            this.dictionary_name = 'Sales';
            break;
          case 'purchase':
            selectedType = '2';
            this.dictionary_name = 'Purchase';
            break;
          case 'sales-return':
            selectedType = '3';
            this.dictionary_name = 'Sales Return';
            break;
          case 'purchase-return':
            selectedType = '4';
            this.dictionary_name = 'Purchase Return';
            break;
          case 'quotation':
            selectedType = '5';
            this.dictionary_name = 'Quotation';
            break;
          case 'delivery-challan':
            selectedType = '6';
            this.dictionary_name = 'Delivery Challan';
            break;
          case 'proforma':
            selectedType = '7';
            this.dictionary_name = 'Proforma';
            break;
          case 'purchase-order':
            selectedType = '8';
            this.dictionary_name = 'Purchase Order';
            break;
          case 'sales-order':
            selectedType = '9';
            this.dictionary_name = 'Sales Order';
            break;

          default:
            // For other types, use the provided value directly
            selectedType = invoiceType;
        }

        console.log('Setting Invoice Type to:', selectedType);
        this.filterForm.patchValue({
          invoice_type: selectedType,
          search: searchTerm || ''
        });
        this.currentPage = 1; // Reset to first page when loading from URL
        this.getSalesRegister(1);
      } else if (searchTerm) {
        // If only search term is present in URL
        this.filterForm.patchValue({
          search: searchTerm
        });
        this.currentPage = 1;
        this.getSalesRegister(1);
      }
    });
  }

  deleteInvoice(id: any) {
    if(confirm('Are you sure you want to delete this invoice?')){
      this.api.delete('/invoice/delete-invoice/'+id+'/').subscribe((res:any)=>{
        if(res.status==200){
          this.getSalesRegister(this.currentPage);
          this.toast.show('Success', 'Invoice deleted successfully', 'success');
        }
      })
    }else{
      this.toast.show('Error', 'Invoice not deleted', 'danger');
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { OutwardForm } from '../outward-form/outward-form';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { OutwardReq } from '../outward-req/outward-req';
import * as pdfMake from 'pdfmake/build/pdfmake';

@Component({
  selector: 'app-outward-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterModule],
  templateUrl: './outward-list.html',
  styleUrl: './outward-list.scss'
})
export class OutwardList implements OnInit {
  outwardTransactions: any[] = [];
  filteredTransactions: any[] = [];
  loading = false;
  searchText = '';
  selectedStatus = '';
  selectedType = '';
  fromDate = '';
  toDate = '';
  currentDate = new Date();
  startDate = '';
  endDate = '';
  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalData = 0;
  Math = Math;

  // Summary statistics
  totalDispatches = 0;
  totalAmount = 0;
  todayDispatches = 0;
  thisMonthDispatches = 0;
  data: any;
  companyData: any;

  constructor(
    private api: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    // Set startDate and endDate to today by default
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    this.startDate = formattedToday;
    this.endDate = formattedToday;
    this.loadData();
    this.getCompany();
  }

  loadData(page: number = this.currentPage) {
    this.loading = true;
    this.currentPage = page;
    const payload: any = {
      company: 1,
      page_number: this.currentPage,
      page_size: this.pageSize,
      status: this.selectedStatus || '',
      start_date: this.startDate || '',
      end_date: this.endDate || ''
    };
    // Add searchText to payload and endpoint like requisition-list
    const search = this.searchText ? this.searchText : '';
    this.api.post('/invoice/list-Outward/s=' + search + '/', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status == 200) {
          this.outwardTransactions = res.data || [];
          this.filteredTransactions = [...this.outwardTransactions];
          this.calculateStatistics();
          if (res.paginated_data) {
            this.currentPage = res.paginated_data.current_page;
            this.totalPages = res.paginated_data.total_pages;
            this.totalData = res.paginated_data.total_data;
            this.pageSize = res.paginated_data.page_size;
          }
        } else {
          // this.setDefaultData();
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading outward transactions:', error);
        // this.toast.show('Error', 'Failed to load outward transactions', 'danger');
      }
    });
  }

  calculateStatistics(): void {
    this.totalDispatches = this.outwardTransactions.length;
    this.totalAmount = this.outwardTransactions.reduce((sum, dispatch) => sum + (dispatch.totalAmount || 0), 0);
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    this.todayDispatches = this.outwardTransactions.filter(dispatch => 
      dispatch.date === today
    ).length;
    
    this.thisMonthDispatches = this.outwardTransactions.filter(dispatch => {
      const dispatchDate = new Date(dispatch.date);
      return dispatchDate.getMonth() === currentMonth && dispatchDate.getFullYear() === currentYear;
    }).length;
  }

  openForm(id?:any) {
    console.log(id,'89');
    const modalRef = this.modalService.open(OutwardReq, { 
      centered: true, 
      windowClass: 'my-class',
      size: 'xl'
    });
    
    // Set the editOutwardId for edit mode
    if (id) {
      modalRef.componentInstance.editOutwardId = id.id;
    }
    modalRef.componentInstance.outwardType = id.outwardType;
    modalRef.result.then((result) => {
      if (result) {
        this.loadData();
        // Show success message based on the action
        const action = id ? 'updated' : 'created';
        this.toast.show('Success', `Outward dispatch ${action} successfully`, 'success');
      }
    }).catch(() => {
      // Modal was dismissed - no action needed
    })
    .finally(() => {
      this.loadData();
    });
  }

  deleteDispatch(id: number): void {
    if (confirm('Are you sure you want to delete this dispatch record?')) {
      this.api.delete(`/warehouse/outward/${id}/`).subscribe({
        next: (res: any) => {
          if (res.status === 200) {
            this.toast.show('Success', 'Dispatch record deleted successfully', 'success');
            this.loadData();
          } else {
            this.toast.show('Error', 'Failed to delete dispatch record', 'danger');
          }
        },
        error: (error) => {
          console.error('Error deleting dispatch record:', error);
          this.toast.show('Error', 'Failed to delete dispatch record', 'danger');
        }
      });
    }
  }

  filterByStatus(): void {
    this.loadData(1);
  }

  filterByType(): void {
    this.loadData(1);
  }

  filterByDate(): void {
    if (!this.fromDate || !this.toDate) {
      this.toast.show('Warning', 'Please select both from and to dates', 'warning');
      return;
    }

    this.filteredTransactions = this.outwardTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const from = new Date(this.fromDate);
      const to = new Date(this.toDate);
      return transactionDate >= from && transactionDate <= to;
    });

    this.toast.show('Info', `Filtered ${this.filteredTransactions.length} records`, 'info');
  }

  clearFilter(): void {
    this.searchText = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.fromDate = '';
    this.toDate = '';
    this.loadData(1)
    // this.filteredTransactions = [...this.outwardTransactions];
    // this.toast.show('Info', 'Filters cleared', 'info');
  }

  refreshData(): void {
    this.loadData();
    this.toast.show('Info', 'Data refreshed', 'info');
  }

  exportData(): void {
    // Implement export functionality
    this.toast.show('Info', 'Export functionality will be implemented', 'info');
  }

  // New methods for the redesigned interface
  viewDispatch(id: number): void {
    // Implement view details functionality
    this.toast.show('Info', `Viewing dispatch details for ID: ${id}`, 'info');
  }

  dispatchOrder(id: number): void {
    const dispatch = this.outwardTransactions.find(d => d.id === id);
    if (!dispatch) {
      this.toast.show('Error', 'Dispatch record not found', 'danger');
      return;
    }

    // Confirm dispatch action
    if (confirm(`Are you sure you want to dispatch order ${dispatch.dispatchNo}?`)) {
      // Call API to update status
      this.api.put(`/warehouse/outward/${id}/`, { 
        status: 'DISPATCHED',
        dispatchedAt: new Date().toISOString(),
        actualDispatchTime: new Date().toISOString().substring(11, 16)
      }).subscribe({
        next: (res: any) => {
          if (res.status === 200 || res.success) {
            // Update local data
            dispatch.status = 'DISPATCHED';
            dispatch.dispatchedAt = new Date().toISOString();
            dispatch.actualDispatchTime = new Date().toISOString().substring(11, 16);
            
            // Update filtered data if needed
            this.loadData(1);
            this.calculateStatistics();
            
            this.toast.show('Success', `Order ${dispatch.dispatchNo} has been dispatched successfully!`, 'success');
          } else {
            this.toast.show('Error', 'Failed to update dispatch status', 'danger');
          }
        },
        error: (error: any) => {
          console.error('Error updating dispatch status:', error);
          
          // For demo purposes, update locally even if API fails
          dispatch.status = 'DISPATCHED';
          dispatch.dispatchedAt = new Date().toISOString();
          dispatch.actualDispatchTime = new Date().toISOString().substring(11, 16);
          
          this.loadData(1);
          this.calculateStatistics();
          
          this.toast.show('Error', 'Failed to update dispatch status (local update only)', 'danger');
        }
      });
    }
  }

  printDispatch(id: any): void {
    // First fetch the company data, then fetch the PDF data
    this.api.get('/company/get-company/' + this.api.getUserCompany() + '/').subscribe((companyRes: any) => {
      if (companyRes.status === 200 && companyRes.data) {
        this.companyData = companyRes.data;
      }
      
      // Then fetch the PDF data
      this.api.get('/invoice/outward_pdf/' + id.id + '/'+id.outwardType+'/').subscribe((res: any) => {
        console.log(res);
        this.data = res.data;
        const docDefinition: any = this.downloadPDFpur();
        pdfMake.createPdf(docDefinition).open();
      });
    });
  }
  getCompany() {
    this.api.get('/company/get-company/' + this.api.getUserCompany() + '/').subscribe((res: any) => {
      console.log('Company API Response:', res);
      if (res.status === 200 && res.data) {
        this.companyData = res.data;
      }
    });
  }
  downloadPDFpur() {
    if (!this.data) {
      alert('Data not loaded yet!');
      return;
    }
    // @ts-ignore
    const pdfMake = window['pdfMake'];
    const d = this.data;

    // Build item rows from API data
    const itemRows = d.items.map((item: any, idx: number) => [
      { text: (idx + 1).toString(), alignment: 'center' },
      { text: item.item_info?.item_code || '', alignment: 'center' },
      { text: item.item_info?.name || '' },
      { text: item.barcode || '', alignment: 'center' },
      { text: (item.item_info?.units?.[0]?.name?.split(' - ')[0]) || '', alignment: 'center' },
      { text: Number(item.quantity || 0).toFixed(2), alignment: 'right' },
    ]);

    // Compute extra height for total row to push signature to bottom
    const minVisibleRows =30; // tweak to fit page height
    const approxRowHeight = 12; // px per row approximation
    const missingRowCount = Math.max(0, minVisibleRows - itemRows.length);
    const extraTotalTopMargin = missingRowCount * approxRowHeight;

    const totalQty = d.items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0).toFixed(2);

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [20, 16, 20, 40],
    
      footer: (currentPage: number, pageCount: number) => {
        return {
          columns: [
            { text: `Print Date & Time :  ${new Date().toLocaleString()}`, alignment: 'left', fontSize: 9 },
            { text: `User :  ${d.user || ''}`.trim(), alignment: 'center', fontSize: 9 },
            { text: `Page No :  ${currentPage} / ${pageCount}`, alignment: 'right', fontSize: 9 }
          ],
          margin: [20, 5, 20, 10]
        };
      },
      content: [
        // Header block
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                      { text: this.companyData?.business_name, style: 'companyTitle' },
                    { text: this.companyData?.address1, style: 'companySubTitle' },
                    { text: this.companyData?.email, style: 'companyInfo' },
                    { text: 'TEL :' + this.companyData?.phone_no + ' Email : ' + this.companyData?.email, style: 'companyInfo' },
                    { text: 'TRN : ' + this.companyData?.tax_registration_number, style: 'trn' }
                  ],
                  alignment: 'center',
                  margin: [0, 4, 0, 4]
                }
              ]
            ]
          },
          layout: {
            // remove bottom border
            hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        {
          table: {
            widths: ['*'],
            body: [
              [ { text: 'DELIVERY NOTE', style: 'docTitle', margin: [0, 2, 0, 2], alignment: 'center' } ]
            ]
          },
          layout: {
            // Keep only outer left/right borders; no inner verticals
            vLineWidth: function(i: number, node: any) {
              return (i === 0 || i === node.table.widths.length) ? 1 : 0;
            },
            // Only draw the top border; bottom border removed to match sample
            hLineWidth: function(i: number, node: any) {
              return i === 0 ? 1 : (i === node.table.body.length ? 0 : 0);
            },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },

        // Details block with border
        {
          table: {
            widths: ['50%', '50%'],
            body: [
              [
                {
                  stack: [
                    { text: [{ text: 'Delivered To   : ', bold: true }, { text: d.to_warehouseName || '' }] },
                    { text: [{ text: 'Address        : ', bold: true }, { text: d.to_warehouseAdd || '' }] },
                    { text: ' ' },
                    { text: [{ text: 'Delivered From : ', bold: true }, { text: d.warehouseIdName || '' }] },
                    { text: [{ text: 'Address        : ', bold: true }, { text: d.warehouseIdAdd || '' }] }
                  ]
                },
                {
                  stack: [
                    { text: [{ text: 'Doc No       : ', bold: true }, { text: d.invoiceNo || '' }] },
                    { text: [{ text: 'Doc Date     : ', bold: true }, { text: d.date || '' }] },
                    { text: [{ text: 'Customer Code: ', bold: true }, { text: d.customer_code || '' }] },
                    { text: [{ text: 'Reg/Req No   : ', bold: true }, { text: d.reference_no || '' }] },
                    { text: [{ text: 'Outlet       : ', bold: true }, { text: d.outlet_name || '' }] },
                    { text: [{ text: 'Branch       : ', bold: true }, { text: d.branch_name || '' }] }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function(i: number) { return 1; },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },

        // Items table
        {
          table: {
            headerRows: 1,
            widths: [25, 60, '*', 70, 35, 40],
            body: [
              [
                { text: 'S.No', bold: true, alignment: 'center' },
                { text: 'Item Code', bold: true, alignment: 'center' },
                { text: 'Description', bold: true, alignment: 'center' },
                { text: 'I.T.Barcode 1', bold: true, alignment: 'center' },
                { text: 'Unit', bold: true, alignment: 'center' },
                { text: 'Qty', bold: true, alignment: 'center' }
              ],
              ...itemRows,
              [
                { colSpan: 5, text: 'Total', bold: true, italics: true, alignment: 'center',margin: [0, 0, 0, extraTotalTopMargin] 
                }, {}, {}, {}, {},
                { text: totalQty, bold: true, italics: true, alignment: 'right',  border: [false, true, true, true] }
              ]
            ]
          },
            layout: {
            hLineWidth: function(i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function(i: number) { return 1; },
            hLineColor: function() { return 'black'; },
            vLineColor: function() { return 'black'; }
          },
          fontSize: 9,
          margin: [0, 0, 0, 0] 
        },

        // Remarks
        {
          table: {
            widths: [80, '*'],
            body: [
              [
                { text: 'Remarks', bold: true, fontSize: 11, margin: [0, 0, 0, 0],border: [true, true, true, false] },
                { text: d.notes || ':', fontSize: 11, margin: [0, 0, 0, 0] }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number, node: any) { return i === node.table.body.length ? 0 : 1; },
            vLineWidth: function (i: number, node: any) {
              return (i === 0 || i === node.table.widths.length) ? 1 : 0;
            },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        },
        // Signature section with outer border, directly under main table
        {
          table: {
            widths: ['*'],
            body: [
              [
                {
                  stack: [
                    { text: 'For '+this.companyData?.business_name, alignment: 'right', margin: [0, 10, 0, 6], fontSize: 11 },
                    {
                      table: {
                        widths: ['33%', '33%', '34%'],
                        body: [[
                          { text: 'Received By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Checked By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] },
                            { text: 'Approved By', bold: true, alignment: 'center', fontSize: 11, margin: [0, 16, 0, 0] }
                        ]]
                      },
                      layout: 'noBorders',
                      margin: [0, 0, 0, 0]
                    }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i: number) { return 1; },
            vLineWidth: function (i: number) { return 1; },
            hLineColor: function () { return 'black'; },
            vLineColor: function () { return 'black'; }
          },
          margin: [0, 0, 0, 0]
        }
      ]
    };
    // @ts-ignore
    // pdfMake.createPdf(docDefinition).download('Material_Receipt_Note_Header.pdf');
    return docDefinition;
  }
  getTotalQuantity(items: any[]): number {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  getOutwardTypeShort(type: string): string {
    const shortNames = {
      'REQ': 'REQ',
      'SALES_ORDER': 'SO', 
      'DIRECT_DISPATCH': 'DIR'
    };
    return shortNames[type as keyof typeof shortNames] || type;
  }

  getStatusShort(status: string): string {
    const shortNames = {
      'PENDING_APPROVAL': 'Pending',
      'APPROVED': 'Approved',
      'PICKING_IN_PROGRESS': 'Picking',
      'DISPATCHED': 'Dispatched',
      'DELIVERED': 'Done',
      'CANCELLED': 'Cancel',
      'Completed':  'Completed'
    };
    return shortNames[status as keyof typeof shortNames] || status;
  }

  // Helper methods for display
  getOutwardTypeName(type: string): string {
    const typeNames = {
      'REQUISITION': 'Requisition-based',
      'SALES_ORDER': 'Sales Order',
      'DIRECT_DISPATCH': 'Direct Dispatch'
    };
    return typeNames[type as keyof typeof typeNames] || type;
  }

  getOutwardTypeBadgeClass(type: string): string {
    const typeClasses = {
      'REQ': 'bg-success',
      'SALES_ORDER': 'bg-primary', 
      'DIRECT_DISPATCH': 'bg-info'
    };
    return typeClasses[type as keyof typeof typeClasses] || 'bg-secondary';
  }

  getPriorityBadgeClass(priority: string): string {
    const priorityClasses = {
      'LOW': 'bg-light text-dark',
      'NORMAL': 'bg-info',
      'HIGH': 'bg-warning',
      'URGENT': 'bg-danger'
    };
    return priorityClasses[priority as keyof typeof priorityClasses] || 'bg-secondary';
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'PENDING_APPROVAL': 'bg-warning',
      'APPROVED': 'bg-info',
      'PICKING_IN_PROGRESS': 'bg-primary',
      'READY_FOR_DISPATCH': 'bg-success',
      'Ready': 'bg-success',
      'DELIVERED': 'bg-success',
      'CANCELLED': 'bg-danger',
      'Completed': 'bg-info',

    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-secondary';
  }

  // Legacy methods for compatibility (if needed)
  getWarehouseName(id: number): string {
    // This could be enhanced to return actual warehouse names
    return `Warehouse ${id}`;
  }

  getLocationName(id: number): string {
    // This could be enhanced to return actual location names
    return `Location ${id}`;
  }

  getItem(id: number): any {
    // This could be enhanced to return actual item data
    return { id: id, name: `Item ${id}` };
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadData(page);
    }
  }

  onPageSizeChange() {
    this.currentPage = 1;
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
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddItem } from '../add-item/add-item';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { RouterModule } from '@angular/router';
import { ItemLedgers } from '../item-ledgers/item-ledgers';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DemoDataService } from '../../../core/demo/demo-data.service';

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [AddItem, CommonModule, RouterModule,ItemLedgers],
  templateUrl: './item-list.html',
  styleUrl: './item-list.scss'
})
export class ItemList implements OnInit {
  @ViewChild('importModal') importModal: any;
  
  itemData: any;
  items: any[] = [];
  selectedItem: any = null;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isDragging: boolean = false;
  importModalRef: any = null;
  
  constructor(
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal,
    private demo: DemoDataService
  ) {}
  
  ngOnInit() {
    this.loadItems();
  }
  
  onAddItem(item: any) {
    console.log('Add button clicked for item:', item);
    this.itemData = item;
    this.selectedItem = item;
  }
  
  loadItems() {
    this.api.listItems('', {
      type: 1,
      page: 1,
      page_size: 9
    }).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.items = this.demo.items(response.data);
          if (this.items.length > 0) {
            this.onAddItem(this.items[0]);
            this.selectedItem = this.items[0];
          }
        }
      },
      error: (error) => {
        console.error('Error fetching item list:', error);
        this.items = this.demo.items([]);
        if (this.items.length > 0) {
          this.onAddItem(this.items[0]);
          this.selectedItem = this.items[0];
        }
      }
    });
  }

  onItemSelected(item: any) {
    this.selectedItem = item;
  }

  exportItems(){
    const company = this.api.getUserCompany();
    this.api.postBlob('/items/export-items/', { company }).subscribe({
      next: (blob: Blob) => {
        this.api.handleBlobExport(
          blob,
          `Company_${company}_Item_Excel.xlsx`,
          (message) => this.toast.show('Export failed', message, 'danger')
        );
      },
      error: () => {
        this.toast.show('Export failed', 'Unable to export items', 'danger');
      }
    });
  }

  getCurrency() {
    return this.api.getcurrencies();
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (error) {
      return '-';
    }
  }

  openImportModal() {
    this.importModalRef = this.modalService.open(this.importModal, { 
      size: 'md', 
      centered: true, 
      backdrop: 'static' 
    });
  }

  closeImportModal() {
    if (this.importModalRef) {
      this.importModalRef.close();
      this.selectedFile = null;
      this.isUploading = false;
      this.uploadProgress = 0;
    }
  }

  downloadSampleFile() {
    // Nablus Road Contracting (Dubai) materials & services sample
    const sampleData = [
      ['Item Name', 'Item Code', 'Item Type', 'Sales Price', 'Purchase Price', 'Unit', 'HSN Code', 'Description'],
      ['Asphalt Mix Hot (Base Course)', 'ASP-BASE-01', 'Product', '285.00', '220.00', 'TON', '27150000', 'Hot mix asphalt for road base course'],
      ['Asphalt Mix Hot (Wearing Course)', 'ASP-WEAR-01', 'Product', '320.00', '250.00', 'TON', '27150000', 'Wearing course asphalt for finished roads'],
      ['Crushed Aggregate 20mm', 'AGG-20MM', 'Product', '45.00', '32.00', 'TON', '25171000', '20mm crushed stone aggregate'],
      ['Bitumen 60/70', 'BIT-6070', 'Product', '1850.00', '1620.00', 'TON', '27132000', 'Penetration grade bitumen 60/70'],
      ['Road Marking Paint - White', 'RMP-WHT', 'Product', '85.00', '62.00', 'LTR', '32089090', 'Thermoplastic road marking paint'],
      ['Steel Rebar 16mm', 'STL-16MM', 'Product', '3200.00', '2850.00', 'TON', '72142000', 'Deformed steel reinforcement bars'],
      ['Asphalt Paving Service', 'SVC-PAVE', 'Service', '18.50', '0.00', 'M2', '998311', 'Machine asphalt paving per sq.m'],
      ['Site Survey & Setting Out', 'SVC-SURVEY', 'Service', '2500.00', '0.00', 'JOB', '998311', 'Topographic survey and setting out']
    ];

    // Convert to CSV
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'items_import_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.toast.show('Success', 'Sample file downloaded', 'success');
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.validateAndSetFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.validateAndSetFile(files[0]);
    }
  }

  validateAndSetFile(file: File) {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedExtensions.includes(fileExtension) && !allowedTypes.includes(file.type)) {
      this.toast.show('Error', 'Please select a valid file format (.xlsx, .xls, or .csv)', 'danger');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      this.toast.show('Error', 'File size should be less than 10MB', 'danger');
      return;
    }

    this.selectedFile = file;
  }

  removeFile() {
    this.selectedFile = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.toast.show('Error', 'Please select a file to upload', 'danger');
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('company', this.api.getUserCompany().toString());

    // Simulate progress (replace with actual upload progress if available)
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    this.api.post('/items/import-items/', formData).subscribe({
      next: (response: any) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          if (response.status === 200) {
            this.toast.show('Success', 'Items imported successfully', 'success');
            this.closeImportModal();
            this.loadItems(); // Reload items list
          } else {
            this.toast.show('Error', response.message || 'Failed to import items', 'danger');
            this.isUploading = false;
            this.uploadProgress = 0;
          }
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('Import error:', error);
        this.toast.show('Error', error.error?.message || 'Failed to import items', 'danger');
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }
}

import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Party } from '../party/party';
import { AddParty } from '../add-party/add-party';
import { PartyLegers } from '../party-legers/party-legers';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-party-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AddParty, PartyLegers],
  templateUrl: './party-list.html',
  styleUrl: './party-list.scss'
})
export class PartyList implements OnInit {
  @ViewChild('importModal') importModal: any;
  
  partyData: any;
  parties: any[] = [];
  selectedParty: any = null;
  emitparty: any;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  uploadProgress: number = 0;
  isDragging: boolean = false;
  importModalRef: any = null;
  
  constructor(
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal
  ) {}
  
  ngOnInit() {
    this.loadParties();
  }

  onAddParty(party: any) {
    console.log('Add button clicked for party:', party);
    this.partyData = party;
    this.emitparty = party.id;
    this.selectedParty = party; // Update the selected party for highlighting
  }
  
  loadParties() {
    this.api.post('/party/list-party/s=/', {
      page_size: 9,
      page: 1,
      company:this.api.getUserCompany()
    }).subscribe({
      next: (response: any) => {
        if(response.status === 200){
          this.parties = response.data;
          if(response.data.length > 0){
            this.onAddParty(response.data[0])
            this.selectedParty = response.data[0];
          }
        }
      },
      error: (error) => {
        console.error('Error fetching party list:', error);
        this.toast.show('Error', 'Failed to load parties', 'danger');
      }
    });
  }

  onPartySelected(party: any) {
    this.selectedParty = party;
  }

  exportParties(){
    this.api.post('/party/party-export/', {
      company: this.api.getUserCompany()
    }).subscribe((res:any) => {
      if(res.status === 200){
        window.location.href = res.url
      }
    });
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
    // Create sample file content
    const sampleData = [
      ['Party Name', 'Party Type', 'Mobile Number', 'Email', 'TRN', 'Billing Address', 'Shipping Address', 'Opening Balance'],
      ['Sample Customer', 'Customer', '1234567890', 'customer@example.com', 'TRN123', '123 Main St', '123 Main St', '0.00'],
      ['Sample Vendor', 'Vendor', '0987654321', 'vendor@example.com', 'TRN456', '456 Oak Ave', '456 Oak Ave', '0.00']
    ];

    // Convert to CSV
    const csvContent = sampleData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'parties_import_sample.csv');
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

    this.api.post('/party/import-parties/', formData).subscribe({
      next: (response: any) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          if (response.status === 200) {
            this.toast.show('Success', 'Parties imported successfully', 'success');
            this.closeImportModal();
            this.loadParties(); // Reload parties list
          } else {
            this.toast.show('Error', response.message || 'Failed to import parties', 'danger');
            this.isUploading = false;
            this.uploadProgress = 0;
          }
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        console.error('Import error:', error);
        this.toast.show('Error', error.error?.message || 'Failed to import parties', 'danger');
        this.isUploading = false;
        this.uploadProgress = 0;
      }
    });
  }
}
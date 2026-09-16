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
import { DemoDataService } from '../../../core/demo/demo-data.service';

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
    private modalService: NgbModal,
    private demo: DemoDataService
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
          this.parties = this.demo.parties(response.data);
          if(this.parties.length > 0){
            this.onAddParty(this.parties[0])
            this.selectedParty = this.parties[0];
          }
        } else {
          this.parties = this.demo.parties([]);
          if(this.parties.length > 0){
            this.onAddParty(this.parties[0]);
            this.selectedParty = this.parties[0];
          }
        }
      },
      error: (error) => {
        console.error('Error fetching party list:', error);
        this.parties = this.demo.parties([]);
        if(this.parties.length > 0){
          this.onAddParty(this.parties[0]);
          this.selectedParty = this.parties[0];
        }
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
    // Nablus Road Contracting (Dubai) import sample
    const sampleData = [
      ['Party Name', 'Party Type', 'Mobile Number', 'Email', 'TRN', 'Billing Address', 'Shipping Address', 'Opening Balance'],
      ['Dubai Municipality - Roads', 'Customer', '97143122222', 'roads@dm.gov.ae', '100111222333444', 'Dubai Municipality HQ, Deira, Dubai', 'Dubai Municipality HQ, Deira, Dubai', '125000.00'],
      ['RTA Dubai', 'Customer', '97148000000', 'procurement@rta.ae', '100222333444555', 'Roads & Transport Authority, Dubai', 'RTA HQ, Dubai', '85000.00'],
      ['Emaar Properties PJSC', 'Customer', '97143668888', 'contracts@emaar.ae', '100333444555666', 'Emaar Square, Downtown Dubai', 'Emaar Square, Downtown Dubai', '42000.00'],
      ['Al Futtaim Building Materials', 'Vendor', '97142955555', 'sales@afbm.ae', '100444555666777', 'Al Quoz Industrial Area, Dubai', 'Al Quoz Industrial Area, Dubai', '18000.00'],
      ['National Asphalt Co. LLC', 'Vendor', '97143321000', 'orders@nationalasphalt.ae', '100555666777888', 'Jebel Ali Industrial, Dubai', 'Jebel Ali Industrial, Dubai', '9500.00']
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
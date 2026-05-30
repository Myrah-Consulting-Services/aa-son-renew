import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Party } from '../party/party';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-add-party',
  standalone: true,
  imports: [CommonModule, Party,FormsModule],
  templateUrl: './add-party.html',
  styleUrl: './add-party.scss'
})
export class AddParty implements OnInit {
  @Input() showAddButton: boolean = true;
  @Input() selectedParty: any;
  parties: any[] = [];
  modalMode: 'create' | 'edit' = 'create';
  partyList: any[] = [];
  searchText: string = '';
  private searchSubject = new Subject<string>();
  selectedType: number = 0; // 0 for all, 1 for customer, 2 for vendor
  partymodel = { Party_name: '', mobile_number: '' };
  @Output() addParty = new EventEmitter<any>();
  modalRef: any;
  loading = false;

  constructor(
    private modalService: NgbModal,
    private api: Api,
    private toast: ToastService
  ) {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(500), // Wait 500ms after user stops typing
      distinctUntilChanged() // Only emit if value has changed
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  ngOnInit() {
    this.loadParties();
  }

  // Handle search input changes
  onSearchChange() {
    this.selectedType = 0; // Reset to "All" when searching
    this.searchSubject.next(this.searchText);
  }

  // Clear search and reload all parties
  clearSearch() {
    this.searchText = '';
    this.loadParties();
  }

  // Perform search API call
  performSearch(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.loadParties();
      return;
    }

    if (this.loading) return;
    this.loading = true;
    this.parties = [];

    const searchParams = {
      company:this.api.getUserCompany(),
      type: this.selectedType // Use the selected type filter
    };

    this.api.post('/party/list-party/s='+searchTerm+'/', searchParams).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          this.parties = response.data || [];
          // this.toast.show('Success', `Found ${this.parties.length} parties`, 'success');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching parties:', error);
        this.toast.show('Error', 'Failed to search parties', 'danger');
        this.loading = false;
      }
    });
  }

  // Load parties by type
  loadPartiesByType(type: number) {
    this.selectedType = type;
    if (this.loading) return;
    this.loading = true;
    this.parties = [];

    const params = {
      company:this.api.getUserCompany(),
      type: type // 0 for all, 1 for customer, 2 for vendor
    };

    this.api.post('/party/list-party/s=/', params).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          this.parties = response.data || [];
          const typeName = type === 0 ? 'all' : type === 1 ? 'customers' : 'vendors';
          // this.toast.show('Success', `Loaded ${this.parties.length} ${typeName}`, 'success');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching party list:', error);
        this.toast.show('Error', 'Failed to load parties', 'danger');
        this.loading = false;
      }
    });
  }

  loadParties() {
    this.loadPartiesByType(this.selectedType);
  }

  createparty(){
    this.api.post('/party/create-party/', this.partymodel).subscribe({
      next: (response: any) => {
        console.log('Party created:', response);
        if(response.status === 200){
          this.toast.show('Success', 'Party created successfully', 'success');
        }
      },
      error: (error) => {
        console.error('Error creating party:', error);
        this.toast.show('Error', 'Failed to create party', 'danger');
      }
    });
  }

  openPartyModal(modalTemplate: any, party?: any) {
    this.modalMode = party ? 'edit' : 'create';
    this.selectedParty = party ? { ...party } : null; // Clone party data for edit mode
    
    this.modalRef = this.modalService.open(modalTemplate, {
      size: 'xl',
      centered: true,
      backdrop: 'static',
      keyboard: false
    });

    this.modalRef.closed.subscribe(() => {
      this.resetModalState();
      this.loadParties(); // Refresh list after modal closes
    });

    this.modalRef.dismissed.subscribe(() => {
      this.resetModalState();
    });
  }

  closeModal() {
    this.modalService.dismissAll();
  }

  resetModalState() {
    this.selectedParty = null;
    this.modalMode = 'create';
  }

  handlePartySubmit(partyData: any) {
    this.closeModal();
    this.loadParties();
    // this.toast.show('Success', 'Party updated successfully', 'success');
  }

  deleteParty(partyId: string) {
    if (confirm('Are you sure you want to delete this party?')) {
      this.api.delete(`/party/delete-party/${partyId}/`).subscribe({
        next: (response: any) => {
          this.loadParties(); // Refresh list after deletion
          this.toast.show('Success', 'Party deleted successfully', 'success');
        },
        error: (error) => {
          console.error('Error deleting party:', error);
          this.toast.show('Error', 'Failed to delete party', 'danger');
        }
      });
    }
  }

  onAddParty(party: any) {
    console.log('Add button clicked for party:', party);
    // Implement yourit should emit  add logic here
    this.addParty.emit(party);
  }
}

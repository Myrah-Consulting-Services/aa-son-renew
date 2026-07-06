import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateItem } from '../create-item/create-item';

@Component({
  selector: 'app-item-master',
  imports: [CommonModule, FormsModule,CreateItem],
  templateUrl: './item-master.html',
  styleUrl: './item-master.scss'
})
export class ItemMaster {
  @ViewChild('createItemModal') createItemModal: any;

  items: any[] = [];
  loading = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  
  // Search
  searchText = '';

  // Math reference for template
  Math = Math;
  itemId: any;
  modalMode: 'create' | 'edit' = 'create';
  modalRef: any = null;

  constructor(
    private api: Api,
    private toast: ToastService,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadItems();
  }

  loadItems(page: number = 1,reset = true) {
    this.loading = true;
    this.currentPage = page;
    
    const params = {
      page: this.currentPage,
      page_size: this.pageSize
    };

    this.api.listItems('', params).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          this.items = response.data || [];
          this.totalCount = response.total_count || 0;
          this.totalPages = response.total_pages || 0;
          this.currentPage = response.page || 1;
          this.pageSize = response.page_size || 10;
          
          // this.toast.show('Success', 'Items loaded successfully', 'success');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading items:', error);
        this.toast.show('Error', 'Failed to load items', 'danger');
        this.loading = false;
      }
    });
  }

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.loadItems(page);
    }
  }

  onSearch() {
    // Reset to first page when searching
    this.currentPage = 1;
    this.loading = true;
    
    const params = {
      page: this.currentPage,
      page_size: this.pageSize
    };

    this.api.listItems(this.searchText, params).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          this.items = response.data || [];
          this.totalCount = response.total_count || 0;
          this.totalPages = response.total_pages || 0;
          this.currentPage = response.page || 1;
          this.pageSize = response.page_size || 10;
          
          if (this.searchText) {
            this.toast.show('Success', `Found ${this.items.length} items matching "${this.searchText}"`, 'success');
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error searching items:', error);
        this.toast.show('Error', 'Failed to search items', 'danger');
        this.loading = false;
      }
    });
  }

  clearSearch() {
    this.searchText = '';
    this.currentPage = 1;
    // this.toast.show('Info', 'Search cleared, showing all items', 'info');
    this.loadItems();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  editItem(item: any) {
    console.log('Edit item:', item);
    this.modalMode = 'edit';
    this.itemId = item.id;
    this.modalRef = this.modalService.open(this.createItemModal, { size: 'xl', centered: true, backdrop: 'static' });
    // Implement edit functionality
  }
  openCreateItemModal() {
    this.modalMode = 'create';
    this.itemId = null;
    this.modalRef = this.modalService.open(this.createItemModal, { size: 'xl', centered: true, backdrop: 'static' });
  }
  deleteItem(item: any) {
    if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
      console.log('Delete item:', item);
      this.api.delete('/items/delete-item/'+item.id+'/').subscribe((res:any)=>{
        if(res.status==200){
          this.loadItems();
          this.toast.show('Success', 'Item deleted successfully', 'success');
        }
      })
      // Implement delete functionality
    }
  }
  handleItemSubmit(item: any) {
    console.log('Item submitted:', item);
    this.modalRef.dismiss();
    this.loadItems();
  }

  closeModal() {
    this.modalRef.dismiss();
  }
}

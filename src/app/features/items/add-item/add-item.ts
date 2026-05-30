import { Component, ViewChild, Input, Output, EventEmitter, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateItem } from '../create-item/create-item';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-add-item',
  standalone: true,
  imports: [FormsModule, CommonModule, CreateItem],
  templateUrl: './add-item.html',
  styleUrl: './add-item.scss'
})
export class AddItem {
  @ViewChild('createItemModal') createItemModal: any;

  @Input() showAddButton: boolean = true;
  @Input() selectedItem: any;
  @Input() warehouse: any;
  @Output() selectItem = new EventEmitter<any>();
  @Output() addItem = new EventEmitter<any>();
  searchText: string = '';
  private searchSubject = new Subject<string>();

  items: any[] = [];

  modalMode: 'create' | 'edit' = 'create';
  modalRef: any = null;
  itemId: any;

  loading = false;
  warehouse_value=0;
  filterType: 'all' | 'product' | 'service' = 'all';

  constructor(
    private modalService: NgbModal,
    private api: Api,
    private elementRef: ElementRef,
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // Clicked outside the component
      this.selectedItem = null;
    }
  }

  ngOnInit() {
    this.loadItems();
    console.log('warehouse in ngOnInit:', this.warehouse);
  }

  ngOnChanges(changes: any) {
    if (changes['warehouse']) {
      console.log('warehouse changed in ngOnChanges:', changes['warehouse'].currentValue);
      console.log('Previous value:', changes['warehouse'].previousValue);
      console.log('Current value:',typeof changes['warehouse'].currentValue);
      if(changes['warehouse'].currentValue == null  || changes['warehouse'].currentValue == undefined){
        this.warehouse_value = 0;
        this.items = [];
      }
      else{
        this.warehouse_value = changes['warehouse'].currentValue;
        this.items=[]        
      }
      this.loadItems();
    }
  }

  // Handle search input changes
  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  // Clear search and reload all items
  clearSearch() {
    this.searchText = '';
    this.loadItems(true);
  }

  // Perform search API call
  performSearch(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.loadItems(true);
      return;
    }

    if (this.loading) return;
    this.loading = true;
    this.items = [];

    const searchParams = {
      company:  this.api.getUserCompany(),
      search: searchTerm.trim()
    };

    this.api.post('/items/list-item/s='+searchTerm+'/', searchParams).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          let itemsFromApi = [];
          if (response.data && Array.isArray(response.data.results)) {
            itemsFromApi = response.data.results;
          } else if (Array.isArray(response.data)) {
            itemsFromApi = response.data;
          }
          this.items = itemsFromApi.map((item: any) => ({...item, qty: 1}));
          this.toast.show('Success', `Found ${this.items.length} items`, 'success');
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

  loadItems(reset = false) {
    if (this.loading) return;
    this.loading = true;
    if (reset) {
      this.items = [];
    }
    this.api.post('/items/list-item/s=/', {company:  this.api.getUserCompany(), warehouse: this.warehouse_value}).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          let itemsFromApi = [];
          if (response.data && Array.isArray(response.data.results)) {
            itemsFromApi = response.data.results;
          } else if (Array.isArray(response.data)) {
            itemsFromApi = response.data;
          }
          this.items = [...(this.items || []), ...itemsFromApi.map((item: any) => ({...item, qty: 1}))];
          // this.toast.show('Success', 'Items loaded successfully', 'success');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching item list:', error);
        this.toast.show('Error', 'Failed to load items', 'danger');
        this.loading = false;
      }
    });
  }

  onSelectItem(item: any) {
    this.selectedItem = item;
    // this.selectItem.emit(item);
    this.addItem.emit(item);

  }

  onAddItem(item: any) {
    console.log('Add button clicked for item:', item);
    this.addItem.emit(item);
  }

  openCreateItemModal() {
    this.modalMode = 'create';
    this.itemId = null;
    this.modalRef = this.modalService.open(this.createItemModal, { size: 'xl', centered: true, backdrop: 'static' });
  }

  decrement(item: any) {
    if (item.qty > 1) item.qty--;
  }

  increment(item: any) {
    item.qty++;
  }

  addToCart(item: any) {
    // Emit item with quantity to parent component
    const itemWithQty = {
      ...item,
      qty: item.qty || 1
    };
    this.addItem.emit(itemWithQty);
    this.toast.show('Success', `Added ${item.name} (Qty: ${item.qty || 1}) to cart`, 'success');
  }

  editItem(item: any) {
    this.modalMode = 'edit';
    this.itemId = item.id;
    this.modalRef = this.modalService.open(this.createItemModal, { size: 'xl', centered: true, backdrop: 'static' });
  }

  deleteItem(item: any) {
    // Delete item logic here
    if(confirm('Are you sure you want to delete this item?')){
   this.api.delete('/items/delete-item/'+item.id+'/').subscribe((res:any)=>{
    if(res.status==200){
      this.loadItems(true);
      this.toast.show('Success', 'Item deleted successfully', 'success');
    }
   })}else{

   }
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  onBarcodeClick() {
    // Barcode scan logic here
    alert('Barcode scan clicked!');
  }

  handleItemSubmit(itemData: any) {
    this.closeModal();
    this.loadItems(true);
    // this.toast.show('Success', 'Item updated successfully', 'success');
  }

  onWarehouseChanged(warehouseValue: any) {
    console.log('Warehouse value received in add-item from create-invoice:', warehouseValue);
    // Call your function here when warehouse changes
    this.handleWarehouseChange(warehouseValue);
  }

  handleWarehouseChange(warehouseValue: any) {
    console.log('Handling warehouse change:', warehouseValue);
    // Add your custom logic here
    // For example, filter items by warehouse, update UI, etc.
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }

  getFilteredItems() {
    if (this.filterType === 'all') {
      return this.items;
    } else if (this.filterType === 'product') {
      return this.items.filter(item => item.item_type === 1);
    } else if (this.filterType === 'service') {
      return this.items.filter(item => item.item_type === 2);
    }
    return this.items;
  }
}

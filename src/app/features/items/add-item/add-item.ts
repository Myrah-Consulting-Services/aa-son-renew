import { Component, ViewChild, Input, Output, EventEmitter, ElementRef, HostListener, OnInit } from '@angular/core';
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
export class AddItem implements OnInit {
  @ViewChild('createItemModal') createItemModal: any;

  @Input() showAddButton: boolean = true;
  @Input() selectedItem: any;
  @Input() warehouse: any;
  @Output() selectItem  = new EventEmitter<any>();
  @Output() addItem     = new EventEmitter<any>();

  searchText: string = '';
  private searchSubject = new Subject<string>();

  items: any[] = [];

  modalMode: 'create' | 'edit' = 'create';
  modalRef: any = null;
  itemId: any;

  loading        = false;
  warehouse_value = 0;

  // ── Type filter (from API) ──────────────────────────────────────────────
  itemTypes: { id: number; name: string }[] = [];
  selectedTypeId: number | null = null;   // null = All

  // kept for backwards-compat (getFilteredItems still uses it)
  filterType: 'all' | 'product' | 'service' = 'all';

  // Pagination
  currentPage = 1;
  pageSize    = 10;

  constructor(
    private modalService: NgbModal,
    private api: Api,
    private elementRef: ElementRef,
    private toast: ToastService
  ) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => this.performSearch(searchTerm));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.selectedItem = null;
    }
  }

  ngOnInit() {
    this.loadItemTypes();
    this.loadItems();
  }

  ngOnChanges(changes: any) {
    if (changes['warehouse']) {
      if (changes['warehouse'].currentValue == null || changes['warehouse'].currentValue == undefined) {
        this.warehouse_value = 0;
        this.items = [];
      } else {
        this.warehouse_value = changes['warehouse'].currentValue;
        this.items = [];
      }
      this.loadItems();
    }
  }

  // ── Load item types from API ─────────────────────────────────────────────
  loadItemTypes(): void {
    this.api.get('/items/item-types/').subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.itemTypes = res.data || [];
        }
      },
      error: () => {}
    });
  }

  // ── Type filter button click ─────────────────────────────────────────────
  selectTypeFilter(typeId: number | null): void {
    this.selectedTypeId = typeId;
    this.currentPage    = 1;
    this.loadItems(true);
  }

  // ── Search ────────────────────────────────────────────────────────────────
  onSearchChange() {
    this.searchSubject.next(this.searchText);
  }

  clearSearch() {
    this.searchText  = '';
    this.currentPage = 1;
    this.loadItems(true);
  }

  performSearch(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.loadItems(true);
      return;
    }
    if (this.loading) return;
    this.loading = true;
    this.items   = [];

    const payload: any = {
      company:   this.api.getUserCompany(),
      page:      this.currentPage,
      page_size: this.pageSize,
    };
    if (this.selectedTypeId !== null) payload['type'] = this.selectedTypeId;

    this.api.post('/items/list-item/s=' + searchTerm + '/', payload).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          const raw = response.data;
          const list = Array.isArray(raw?.results) ? raw.results : Array.isArray(raw) ? raw : [];
          this.items = list.map((item: any) => ({ ...item, qty: 1 }));
        }
        this.loading = false;
      },
      error: () => {
        this.toast.show('Error', 'Failed to search items', 'danger');
        this.loading = false;
      }
    });
  }

  // ── Main loader — sends type in payload ──────────────────────────────────
  loadItems(reset = false) {
    if (this.loading) return;
    this.loading = true;
    if (reset) this.items = [];

    const payload: any = {
      company:   this.api.getUserCompany(),
      warehouse: this.warehouse_value,
      page:      this.currentPage,
      page_size: this.pageSize,
    };
    if (this.selectedTypeId !== null) {
      payload['type'] = this.selectedTypeId;
    }

    this.api.post('/items/list-item/s=/', payload).subscribe({
      next: (response: any) => {
        if (response && response.status === 200) {
          const raw  = response.data;
          const list = Array.isArray(raw?.results) ? raw.results : Array.isArray(raw) ? raw : [];
          this.items = [...(this.items || []), ...list.map((item: any) => ({ ...item, qty: 1 }))];
        }
        this.loading = false;
      },
      error: () => {
        this.toast.show('Error', 'Failed to load items', 'danger');
        this.loading = false;
      }
    });
  }

  // ── Kept intact for backwards-compat ─────────────────────────────────────
  getFilteredItems() {
    // When type is filtered server-side, return all; otherwise apply legacy local filter
    if (this.selectedTypeId !== null) return this.items;
    if (this.filterType === 'product') return this.items.filter(item => item.item_type === 1);
    if (this.filterType === 'service') return this.items.filter(item => item.item_type === 2);
    return this.items;
  }

  onSelectItem(item: any) {
    this.selectedItem = item;
    this.addItem.emit(item);
  }

  onAddItem(item: any) {
    this.addItem.emit(item);
  }

  openCreateItemModal() {
    this.modalMode = 'create';
    this.itemId    = null;
    this.modalRef  = this.modalService.open(this.createItemModal, { size: 'xl', centered: true, backdrop: 'static' });
  }

  decrement(item: any) { if (item.qty > 1) item.qty--; }
  increment(item: any) { item.qty++; }

  addToCart(item: any) {
    this.addItem.emit({ ...item, qty: item.qty || 1 });
    this.toast.show('Success', `Added ${item.name} (Qty: ${item.qty || 1}) to cart`, 'success');
  }

  editItem(item: any) {
    this.modalMode = 'edit';
    this.itemId    = item.id;
    this.modalRef  = this.modalService.open(this.createItemModal, { size: 'xl', centered: true, backdrop: 'static' });
  }

  deleteItem(item: any) {
    if (confirm('Are you sure you want to delete this item?')) {
      this.api.delete('/items/delete-item/' + item.id + '/').subscribe((res: any) => {
        if (res.status == 200) {
          this.loadItems(true);
          this.toast.show('Success', 'Item deleted successfully', 'success');
        }
      });
    }
  }

  closeModal() { if (this.modalRef) this.modalRef.close(); }

  handleItemSubmit(itemData: any) { this.closeModal(); this.loadItems(true); }

  onWarehouseChanged(warehouseValue: any)   { this.handleWarehouseChange(warehouseValue); }
  handleWarehouseChange(warehouseValue: any) { /* custom logic */ }

  getcurrency() { return this.api.getcurrencies(); }

  onBarcodeClick() { alert('Barcode scan clicked!'); }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { LocationForm } from '../location-form/location-form';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-location-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './location-list.html',
  styleUrl: './location-list.scss'
})
export class LocationList implements OnInit {
  locations: any[] = [];
  filteredLocations: any[] = [];
  warehouses: any[] = [];
  selectedWarehouse: string = '';
  searchText: string = '';
  loading = false;

  constructor(
    private svc: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  // Getter methods for template calculations
  get activeLocationsCount(): number {
    return this.filteredLocations.filter(l => l.is_active).length;
  }

  get inactiveLocationsCount(): number {
    return this.filteredLocations.filter(l => !l.is_active).length;
  }

  loadData() {
    this.loading = true;
    
    // Load warehouses
    this.svc.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      if(res.status == 200){
        this.warehouses = res.data;
      }
    });

    // Load locations
    this.svc.post('/warehouses/list-location/').subscribe((res: any) => {
      if(res.status == 200){
        this.locations = res.data;
        this.filteredLocations = [...this.locations];
        this.applyFilters();
      }
      this.loading = false;
    });
  }

  applyFilters() {
    let filtered = [...this.locations];

    // Filter by warehouse
    if (this.selectedWarehouse) {
      filtered = filtered.filter(location => 
        location.warehouse == this.selectedWarehouse || location.warehouseId == this.selectedWarehouse
      );
    }

    // Filter by search text
    if (this.searchText.trim()) {
      const searchTerm = this.searchText.toLowerCase();
      filtered = filtered.filter(location =>
        location.name?.toLowerCase().includes(searchTerm) ||
        location.description?.toLowerCase().includes(searchTerm) ||
        this.getWarehouseName(location.warehouse || location.warehouseId)?.toLowerCase().includes(searchTerm)
      );
    }

    this.filteredLocations = filtered;
  }

  onWarehouseFilter() {
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedWarehouse = '';
    this.searchText = '';
    this.filteredLocations = [...this.locations];
  }

  getWarehouseName(warehouseId: number): string {
    if (!warehouseId) return 'No Warehouse';
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown Warehouse';
  }

  openForm(id?: number) {
    const modalRef = this.modalService.open(LocationForm, { centered: true, size: 'lg' });
    if (id) {
      modalRef.componentInstance.id = id;
    }
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }

  delete(id: number) {
    if (confirm('Are you sure you want to delete this location?')) {
      this.svc.post('/warehouses/delete-location/', { id: id }).subscribe((res: any) => {
        if(res.status == 200){
          this.loadData();
          this.toast.show('Success', 'Location deleted successfully', 'success');
        }
      });
    }
  }

  refreshData() {
    this.loadData();
  }
}

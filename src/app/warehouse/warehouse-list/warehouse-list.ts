import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WarehouseForm } from '../warehouse-form/warehouse-form';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './warehouse-list.html',
  styleUrl: './warehouse-list.scss'
})
export class WarehouseList implements OnInit {
  warehouses: any[] = [];
  filteredWarehouses: any[] = [];
  loading = false;
  searchText = '';
  selectedStatus = '';

  constructor(
    private svc: Api,
    private modalService: NgbModal,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loadWarehouses();
  }

  loadWarehouses() {
    this.loading = true;
    this.svc.get('/warehouses/list-warehouse/').subscribe((res: any) => {
      this.loading = false;
      if(res.status == 200){
        this.warehouses = res.data || [];
        this.filteredWarehouses = [...this.warehouses];
      } else {
        this.setDefaultData();
      }
    }, (error) => {
      this.loading = false;
      console.error('Error loading warehouses:', error);
      this.setDefaultData();
    });
  }

  setDefaultData() {
    this.warehouses = [
      {
        id: 1,
        name: 'Main Warehouse',
        code: 'WH-001',
        address: 'Industrial Zone 1, Dubai',
        city: 'Dubai',
        state: 'UAE',
        contactPerson: 'Ahmad Al Mansouri',
        phone: '+971 50 123 4567',
        email: 'ahmad@warehouse.com',
        status: 'active',
        locations: 25,
        capacity: 85,
        totalCapacity: 100
      },
      {
        id: 2,
        name: 'Showroom Warehouse',
        code: 'WH-002',
        address: 'Business Bay, Sheikh Zayed Road',
        city: 'Dubai',
        state: 'UAE',
        contactPerson: 'Fatima Al Zahra',
        phone: '+971 50 987 6543',
        email: 'fatima@showroom.com',
        status: 'active',
        locations: 12,
        capacity: 65,
        totalCapacity: 80
      },
      {
        id: 3,
        name: 'Cold Storage Facility',
        code: 'WH-003',
        address: 'Jebel Ali Free Zone',
        city: 'Dubai',
        state: 'UAE',
        contactPerson: 'Omar Abdullah',
        phone: '+971 50 555 1234',
        email: 'omar@coldstorage.com',
        status: 'active',
        locations: 8,
        capacity: 45,
        totalCapacity: 60
      },
      {
        id: 4,
        name: 'Electronics Warehouse',
        code: 'WH-004',
        address: 'Silicon Oasis, Dubai',
        city: 'Dubai',
        state: 'UAE',
        contactPerson: 'Layla Mohammed',
        phone: '+971 50 777 8888',
        email: 'layla@electronics.com',
        status: 'maintenance',
        locations: 18,
        capacity: 30,
        totalCapacity: 50
      },
      {
        id: 5,
        name: 'Furniture Storage',
        code: 'WH-005',
        address: 'Al Quoz Industrial Area',
        city: 'Dubai',
        state: 'UAE',
        contactPerson: 'Hassan Al Maktoum',
        phone: '+971 50 999 0000',
        email: 'hassan@furniture.com',
        status: 'inactive',
        locations: 15,
        capacity: 20,
        totalCapacity: 40
      }
    ];
    this.filteredWarehouses = [...this.warehouses];
    this.toast.show('Info', 'Showing default warehouse data', 'info');
  }

  refreshData() {
    this.loadWarehouses();
  }

  searchWarehouses() {
    this.applyFilters();
  }

  filterByStatus() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.warehouses];

    // Apply text search
    if (this.searchText.trim()) {
      const searchLower = this.searchText.toLowerCase();
      filtered = filtered.filter(warehouse =>
        warehouse.name?.toLowerCase().includes(searchLower) ||
        warehouse.code?.toLowerCase().includes(searchLower) ||
        warehouse.address?.toLowerCase().includes(searchLower) ||
        warehouse.contactPerson?.toLowerCase().includes(searchLower) ||
        warehouse.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(warehouse => warehouse.status === this.selectedStatus);
    }

    this.filteredWarehouses = filtered;
  }

  clearFilters() {
    this.searchText = '';
    this.selectedStatus = '';
    this.filteredWarehouses = [...this.warehouses];
    this.toast.show('Info', 'Filters cleared', 'info');
  }

  // Statistics methods
  getActiveWarehouses(): number {
    return this.warehouses.filter(w => w.status === 'active').length;
  }

  getTotalLocations(): number {
    return this.warehouses.reduce((total, w) => total + (w.locations || 0), 0);
  }

  getTotalCapacity(): number {
    return this.warehouses.reduce((total, w) => total + (w.totalCapacity || 0), 0);
  }

  getCapacityPercentage(warehouse: any): number {
    if (!warehouse.totalCapacity || warehouse.totalCapacity === 0) return 0;
    return Math.round((warehouse.capacity / warehouse.totalCapacity) * 100);
  }

  getCapacityText(warehouse: any): string {
    const percentage = this.getCapacityPercentage(warehouse);
    return `${warehouse.capacity}/${warehouse.totalCapacity} (${percentage}%)`;
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses = {
      'active': 'bg-success',
      'inactive': 'bg-secondary',
      'maintenance': 'bg-warning'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'bg-success';
  }

  viewWarehouse(id: number): void {
    const warehouse = this.warehouses.find(w => w.id === id);
    if (warehouse) {
      this.toast.show('Info', `Viewing details for ${warehouse.name}`, 'info');
      // Implement detailed view functionality
    }
  }

  openForm(id?: number) {
    const modalRef = this.modalService.open(WarehouseForm, { centered: true, size: 'lg' });
    if (id) {
      modalRef.componentInstance.id = id;
    }
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadWarehouses();
      }
    })
  }

  delete(id: number) {
    const warehouse = this.warehouses.find(w => w.id === id);
    if (warehouse && confirm(`Are you sure you want to delete ${warehouse.name}?`)) {
      this.svc.delete('/warehouses/delete-warehouse/' + id).subscribe((res: any) => {
        if(res.status == 200){
          this.loadWarehouses();
          this.toast.show('Warehouse Deleted', 'Warehouse has been deleted successfully.', 'success');
        }
      }, (error) => {
        console.error('Error deleting warehouse:', error);
        this.toast.show('Error', 'Failed to delete warehouse', 'danger');
      });
    }
  }
}

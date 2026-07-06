import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DamageForm } from '../damage-form/damage-form';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-damage-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './damage-list.html',
  styleUrl: './damage-list.scss'
})
export class DamageList implements OnInit {
  damages: any[] = [];
  warehouses: any[] = [];
  locations: any[] = [];
  items: any[] = [];

  constructor(
    private svc: Api,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.svc.post('/warehouses/list-damage-report/', { company: this.svc.getCompanyId() }).subscribe((res: any) => {
      if(res.status == 200){
        this.damages = res.data;
      }
    });
  
  }
  
  openForm() {
    const modalRef = this.modalService.open(DamageForm, { centered: true, size: 'lg' });
    modalRef.result.then((result) => {
      if (result === 'saved') {
        this.loadData();
      }
    }).catch(() => {});
  }

  getItemName(itemId: number) {
    const item = this.items.find(i => i.id === itemId);
    return item ? item.name : 'Unknown';
  }

  getWarehouseName(warehouseId: number) {
    const warehouse = this.warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.name : 'Unknown';
  }

  getLocationName(locationId: number) {
    const location = this.locations.find(l => l.id === locationId);
    return location ? location.name : 'Unknown';
  }
}

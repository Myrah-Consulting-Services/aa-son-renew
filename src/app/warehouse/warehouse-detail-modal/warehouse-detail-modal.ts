import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-warehouse-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './warehouse-detail-modal.html',
  styleUrl: './warehouse-detail-modal.scss'
})
export class WarehouseDetailModal implements OnInit {
  @Input() id!: number;

  warehouse: any = null;
  loading = true;
  error: string | null = null;

  constructor(
    public activeModal: NgbActiveModal,
    private svc: Api
  ) {}

  ngOnInit() {
    this.loadWarehouse();
  }

  loadWarehouse() {
    this.loading = true;
    this.error = null;
    this.svc.get('/warehouses/get-warehouse/' + this.id).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 200) {
          this.warehouse = res.data;
        } else {
          this.error = 'Unable to load warehouse details.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to fetch warehouse details. Please try again.';
      }
    });
  }

  close() {
    this.activeModal.dismiss();
  }
}

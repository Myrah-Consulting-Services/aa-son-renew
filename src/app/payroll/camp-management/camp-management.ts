import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Camp, CampService } from './camp.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-camp-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './camp-management.html',
  styleUrls: ['./camp-management.scss'],
})
export class CampManagement implements OnInit {
  camps: Camp[] = [];
  showForm = false;
  editingId: string | null = null;
  form = {
    name: '',
    location: '',
    capacity: 20,
    description: '',
    status: 'active' as 'active' | 'inactive',
  };
  search = '';

  constructor(
    private campService: CampService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.camps = this.campService.getCamps();
  }

  get filteredCamps(): Camp[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.camps;
    return this.camps.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }

  occupied(campId: string): number {
    return this.campService.getOccupied(campId);
  }

  available(campId: string): number {
    return this.campService.getAvailableSlots(campId);
  }

  occupancyPct(camp: Camp): number {
    if (!camp.capacity) return 0;
    return Math.min(100, Math.round((this.occupied(camp.id) / camp.capacity) * 100));
  }

  openCreate(): void {
    this.editingId = null;
    this.form = { name: '', location: '', capacity: 20, description: '', status: 'active' };
    this.showForm = true;
  }

  openEdit(camp: Camp): void {
    this.editingId = camp.id;
    this.form = {
      name: camp.name,
      location: camp.location,
      capacity: camp.capacity,
      description: camp.description,
      status: camp.status,
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  saveCamp(): void {
    if (!this.form.name.trim()) {
      this.toast.show('Camp name is required', 'error');
      return;
    }
    if (!this.form.capacity || this.form.capacity < 1) {
      this.toast.show('Capacity must be at least 1', 'error');
      return;
    }
    try {
      this.campService.saveCamp({
        id: this.editingId || undefined,
        name: this.form.name.trim(),
        location: this.form.location.trim(),
        capacity: Number(this.form.capacity),
        description: this.form.description.trim(),
        status: this.form.status,
      });
      this.toast.show(this.editingId ? 'Camp updated' : 'Camp created', 'success');
      this.cancelForm();
      this.reload();
    } catch (e: any) {
      this.toast.show(e?.message || 'Failed to save camp', 'error');
    }
  }

  deleteCamp(camp: Camp): void {
    if (!confirm(`Delete camp "${camp.name}"?`)) return;
    try {
      this.campService.deleteCamp(camp.id);
      this.toast.show('Camp deleted', 'success');
      this.reload();
    } catch (e: any) {
      this.toast.show(e?.message || 'Failed to delete', 'error');
    }
  }

  openCamp(camp: Camp): void {
    this.router.navigate(['/payroll/camp-management', camp.id]);
  }

  get totalCapacity(): number {
    return this.camps.reduce((s, c) => s + (c.capacity || 0), 0);
  }

  get totalOccupied(): number {
    return this.camps.reduce((s, c) => s + this.occupied(c.id), 0);
  }
}

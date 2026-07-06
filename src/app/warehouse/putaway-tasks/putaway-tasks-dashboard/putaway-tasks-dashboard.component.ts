import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-putaway-tasks-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './putaway-tasks-dashboard.component.html',
  styleUrls: ['./putaway-tasks-dashboard.component.scss']
})
export class PutawayTasksDashboardComponent implements OnInit {

  // ── Filters ──────────────────────────────────────────────────────────────────
  filterStartDate: string = '';
  filterEndDate: string   = '';
  selectedType: number | null = null;   // null = All
  dashboardLoading = false;

  // ── Type dropdown ─────────────────────────────────────────────────────────────
  itemTypes: { id: number; name: string }[] = [];
  typesLoading = false;

  // ── KPI stats ─────────────────────────────────────────────────────────────────
  stats = {
    totalTasks: 0,
    pendingTasks: 0,
    assignedTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0
  };

  priorityTasks:    any[] = [];
  workerPerformance: any[] = [];
  loadingBays:      any[] = [];

  constructor(private api: Api) {}

  ngOnInit(): void {
    const range = this.api.getDateRange();
    this.filterStartDate = range.start_date;
    this.filterEndDate   = range.end_date;
    this.loadItemTypes();
    this.loadDashboardData();
  }

  // ── Load type options from API ────────────────────────────────────────────────
  loadItemTypes(): void {
    this.typesLoading = true;
    this.api.get('/items/item-types/').subscribe({
      next: (res: any) => {
        this.typesLoading = false;
        if (res.status === 200) {
          this.itemTypes = res.data || [];
          // selectedType stays null → "All Types" is the default
        }
      },
      error: () => { this.typesLoading = false; }
    });
  }

  // ── Dashboard API ─────────────────────────────────────────────────────────────
  loadDashboardData(): void {
    if (!this.filterStartDate || !this.filterEndDate) return;
    this.dashboardLoading = true;

    const payload: any = {
      company:    this.api.getCompanyId(),
      warehouse:  null,
      start_date: this.filterStartDate,
      end_date:   this.filterEndDate,
    };

    // Only include type in payload when a type is selected
    if (this.selectedType !== null) {
      payload['type'] = this.selectedType;
    }

    this.api.post('/invoice/putaway-dashboard/', payload).subscribe({
      next: (res: any) => {
        this.dashboardLoading = false;
        if (res.status === 200) {
          const summary   = res.summary || {};
          this.stats.totalTasks = summary.total_tasks ?? 0;

          const byStatus: any[] = summary.by_putaway_status || [];
          this.stats.pendingTasks    = byStatus.find((s: any) => s.putaway_status === 'Pending')?.count     ?? 0;
          this.stats.assignedTasks   = byStatus.find((s: any) => s.putaway_status === 'Assigned')?.count    ?? 0;
          this.stats.inProgressTasks = byStatus.find((s: any) => s.putaway_status === 'In Progress')?.count ?? 0;
          this.stats.completedTasks  = byStatus.find((s: any) => s.putaway_status === 'Completed')?.count   ?? 0;

          this.priorityTasks = (res.high_priority_tasks || []).map((t: any) => ({
            id:               t.task_id ?? t.id,
            grnRef:           t.grn_ref ?? '',
            itemName:         t.item_name ?? '',
            quantity:         t.quantity ?? 0,
            remainingQty:     t.remaining_qty ?? 0,
            fromLocation:     t.from_location ?? '',
            toLocation:       t.to_location ?? '',
            route:            t.route ?? '',
            workerName:       t.worker_name ?? null,
            workerRole:       t.worker_role ?? null,
            dueTime:          t.due_time ?? null,
            minutesRemaining: t.minutes_remaining ?? 0,
            status:           t.putaway_status ?? '',
            statusId:         t.putaway_status_id ?? 0,
          }));

          this.workerPerformance = (res.worker_performance || []).map((w: any) => ({
            name:           w.worker_name ?? '',
            designation:    w.role ?? '',
            tasksToday:     w.tasks_today ?? 0,
            completedToday: w.completed ?? 0,
            inProgress:     w.in_progress ?? 0,
          }));

          this.loadingBays = (res.loading_bay_status || []).map((b: any) => ({
            name:        b.bay_name ?? '',
            utilization: b.load_percent ?? 0,
            itemsCount:  b.items_waiting ?? 0,
            qtyWaiting:  b.qty_waiting ?? 0,
          }));
        }
      },
      error: () => { this.dashboardLoading = false; }
    });
  }

  applyFilter(): void {
    this.loadDashboardData();
  }

  onTypeChange(): void {
    this.loadDashboardData();
  }

  // ── Existing actions kept intact ──────────────────────────────────────────────
  autoAssignTasks(): void {}
  createTask(): void {}
  prioritizeUrgent(): void {}
  generateReport(): void {}

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      'Pending':     'bg-warning',
      'Assigned':    'bg-info',
      'In Progress': 'bg-primary',
      'Completed':   'bg-success',
    };
    return map[status] ?? 'bg-secondary';
  }
}

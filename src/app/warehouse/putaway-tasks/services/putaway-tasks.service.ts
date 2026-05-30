import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Api } from '../../../core/services/api';

export interface PutawayTask {
  id: string;
  grnRef: string;
  itemId: number;
  itemName: string;
  quantity: number;
  fromLocation: string;
  fromLocationId: string;
  toLocation: string;
  toLocationId?: string;
  rackId?: number;
  priority: 'normal' | 'high' | 'critical';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedWorker?: string;
  workerName?: string;
  workerRole?: string;
  estimatedTime: number;
  actualTime?: number;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  equipmentRequired?: string;
  isFragile: boolean;
  requiresColdStorage: boolean;
  dimensions?: {
    length: number;
    breadth: number;
    height: number;
  };
}

export interface TaskAssignment {
  taskId: string;
  workerId: string;
  workerName: string;
  assignedAt: string;
  estimatedCompletion: string;
  status: 'assigned' | 'in_progress' | 'completed';
}

export interface LoadingBayStatus {
  id: string;
  name: string;
  capacity: number;
  currentLoad: number;
  utilization: number;
  itemsCount: number;
  pendingTasks: number;
  priority: 'normal' | 'urgent';
}

@Injectable({
  providedIn: 'root'
})
export class PutawayTasksService {
  private tasks$ = new BehaviorSubject<PutawayTask[]>([]);
  private assignments$ = new BehaviorSubject<TaskAssignment[]>([]);
  private loadingBays$ = new BehaviorSubject<LoadingBayStatus[]>([]);

  constructor(private api: Api) {}

  // Task Management
  getTasks(): Observable<PutawayTask[]> {
    return this.tasks$.asObservable();
  }

  getAssignments(): Observable<TaskAssignment[]> {
    return this.assignments$.asObservable();
  }

  getLoadingBayStatus(): Observable<LoadingBayStatus[]> {
    return this.loadingBays$.asObservable();
  }

  createTask(task: Partial<PutawayTask>): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/create', task);
  }

  createTasksFromGRN(grnId: string, items: any[]): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/create-from-grn', {
      grnId,
      items
    });
  }

  updateTaskStatus(taskId: string, status: string, data?: any): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/status`, { status, ...data });
  }

  assignWorker(taskId: string, workerId: string): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/assign`, { 
      workerId,
      assignedAt: new Date().toISOString()
    });
  }

  startTask(taskId: string): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/start`, {
      startedAt: new Date().toISOString()
    });
  }

  completeTask(taskId: string, actualTime: number, rackId?: number): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/complete`, {
      completedAt: new Date().toISOString(),
      actualTime,
      rackId
    });
  }

  cancelTask(taskId: string, reason: string): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/cancel`, { reason });
  }

  // Auto-Assignment
  autoAssignTasks(): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/auto-assign', {});
  }

  assignTasksByPriority(): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/assign-by-priority', {});
  }

  getAvailableWorkers(equipmentType?: string): Observable<any> {
    return this.api.get('/warehouse/workers/available', { equipmentType });
  }

  // Prioritization
  prioritizeTask(taskId: string, priority: string): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/prioritize`, { priority });
  }

  prioritizeUrgentTasks(): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/prioritize-urgent', {});
  }

  // Rack Assignment
  assignToRack(taskId: string, rackId: number): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/assign-rack`, { rackId });
  }

  getSuggestedRacks(taskId: string): Observable<any> {
    return this.api.get(`/warehouse/putaway-tasks/${taskId}/suggested-racks`);
  }

  validateRackAssignment(taskId: string, rackId: number): Observable<any> {
    return this.api.post(`/warehouse/putaway-tasks/${taskId}/validate-rack`, { rackId });
  }

  // Statistics and Reports
  getTaskStatistics(): Observable<any> {
    return this.api.get('/warehouse/putaway-tasks/statistics');
  }

  getWorkerPerformance(): Observable<any> {
    return this.api.get('/warehouse/putaway-tasks/worker-performance');
  }

  getLoadingBayUtilization(): Observable<any> {
    return this.api.get('/warehouse/putaway-tasks/loading-bay-utilization');
  }

  exportTasks(filters?: any): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/export', filters);
  }

  generateReport(type: string, filters?: any): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/reports', { type, filters });
  }

  // Mobile Integration
  getTasksForWorker(workerId: string): Observable<any> {
    return this.api.get(`/warehouse/putaway-tasks/worker/${workerId}`);
  }

  updateTaskFromMobile(taskId: string, data: any): Observable<any> {
    return this.api.put(`/warehouse/putaway-tasks/${taskId}/mobile-update`, data);
  }

  // Real-time Updates
  subscribeToTaskUpdates(): Observable<any> {
    // WebSocket or EventSource implementation for real-time updates
    return this.api.get('/warehouse/putaway-tasks/subscribe');
  }

  // Bulk Operations
  bulkAssign(taskIds: string[], workerId: string): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/bulk-assign', { taskIds, workerId });
  }

  bulkPrioritize(taskIds: string[], priority: string): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/bulk-prioritize', { taskIds, priority });
  }

  bulkComplete(taskIds: string[]): Observable<any> {
    return this.api.post('/warehouse/putaway-tasks/bulk-complete', { taskIds });
  }

  // Load data methods
  loadTasks(filters?: any): void {
    this.api.get('/warehouse/putaway-tasks', filters).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.tasks$.next(response.data);
        }
      }
    });
  }

  loadAssignments(): void {
    this.api.get('/warehouse/putaway-tasks/assignments').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.assignments$.next(response.data);
        }
      }
    });
  }

  loadLoadingBayStatus(): void {
    this.api.get('/warehouse/loading-bays/status').subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.loadingBays$.next(response.data);
        }
      }
    });
  }
} 
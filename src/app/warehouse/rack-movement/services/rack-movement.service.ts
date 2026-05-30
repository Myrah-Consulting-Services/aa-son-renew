import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Api } from '../../../core/services/api';

export interface RackMovement {
  id: string;
  fromRackId: number;
  toRackId: number;
  itemId: number;
  itemName: string;
  quantity: number;
  reason: string;
  reasonCategory: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  initiatedBy: string;
  initiatorName: string;
  initiatorRole: string;
  assignedWorker: string;
  executorName: string;
  executorRole: string;
  initiationType: 'manual' | 'system_generated';
  systemTrigger?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  movementNotes: string;
  requiresEquipment: boolean;
  equipmentType: string;
  urgencyLevel: 'normal' | 'high' | 'critical';
  approvalRequired: boolean;
  approvedBy?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MovementHistory {
  movementId: string;
  itemId: number;
  itemName: string;
  quantity: number;
  movementType: 'inward' | 'internal' | 'outward';
  fromLocation: string;
  toLocation: string;
  locationDetails: any;
  timestamp: string;
  performedBy: string;
  grnReference?: string;
  poReference?: string;
  status: 'completed' | 'cancelled';
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RackMovementService {
  private movements$ = new BehaviorSubject<RackMovement[]>([]);
  private history$ = new BehaviorSubject<MovementHistory[]>([]);

  constructor(private api: Api) {}

  // Movement Management
  getMovements(): Observable<RackMovement[]> {
    return this.movements$.asObservable();
  }

  getMovementHistory(): Observable<MovementHistory[]> {
    return this.history$.asObservable();
  }

  createMovement(movement: Partial<RackMovement>): Observable<any> {
    return this.api.post('/warehouse/rack-movements/create', movement);
  }

  updateMovementStatus(movementId: string, status: string, data?: any): Observable<any> {
    return this.api.put(`/warehouse/rack-movements/${movementId}/status`, { status, ...data });
  }

  assignWorker(movementId: string, workerId: string): Observable<any> {
    return this.api.put(`/warehouse/rack-movements/${movementId}/assign`, { workerId });
  }

  startMovement(movementId: string): Observable<any> {
    return this.api.put(`/warehouse/rack-movements/${movementId}/start`, {
      startedAt: new Date().toISOString()
    });
  }

  completeMovement(movementId: string, actualDuration: number): Observable<any> {
    return this.api.put(`/warehouse/rack-movements/${movementId}/complete`, {
      completedAt: new Date().toISOString(),
      actualDuration
    });
  }

  cancelMovement(movementId: string, reason: string): Observable<any> {
    return this.api.put(`/warehouse/rack-movements/${movementId}/cancel`, { reason });
  }

  // System Triggers
  triggerSystemMovement(
    triggerType: string,
    sourceRackId: number,
    targetRackId: number,
    itemId: number,
    quantity: number
  ): Observable<any> {
    return this.api.post('/warehouse/rack-movements/trigger', {
      triggerType,
      sourceRackId,
      targetRackId,
      itemId,
      quantity
    });
  }

  // Statistics and Reports
  getMovementStatistics(): Observable<any> {
    return this.api.get('/warehouse/rack-movements/statistics');
  }

  exportMovements(filters?: any): Observable<any> {
    return this.api.post('/warehouse/rack-movements/export', filters);
  }

  exportHistory(filters?: any): Observable<any> {
    return this.api.post('/warehouse/rack-movements/history/export', filters);
  }

  // Validation
  validateRackMovement(fromRackId: number, toRackId: number, itemId: number, quantity: number): Observable<any> {
    return this.api.post('/warehouse/rack-movements/validate', {
      fromRackId,
      toRackId,
      itemId,
      quantity
    });
  }

  // Auto-Assignment
  autoAssignWorkers(): Observable<any> {
    return this.api.post('/warehouse/rack-movements/auto-assign', {});
  }

  getAvailableWorkers(equipmentType?: string): Observable<any> {
    return this.api.get('/warehouse/workers/available', { equipmentType });
  }

  // Real-time Updates
  subscribeToMovementUpdates(): Observable<any> {
    // WebSocket or EventSource implementation for real-time updates
    return this.api.get('/warehouse/rack-movements/subscribe');
  }

  // Load data methods
  loadMovements(filters?: any): void {
    this.api.get('/warehouse/rack-movements', filters).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.movements$.next(response.data);
        }
      }
    });
  }

  loadHistory(filters?: any): void {
    this.api.get('/warehouse/rack-movements/history', filters).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.history$.next(response.data);
        }
      }
    });
  }
} 
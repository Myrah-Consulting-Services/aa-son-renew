import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-task-assignment',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './task-assignment.component.html',
  styleUrls: ['./task-assignment.component.scss']
})
export class TaskAssignmentComponent implements OnInit {
  assignmentForm: FormGroup;
  selectedTask: any = null;

  unassignedTasks = [
    {
      id: 'PT002',
      grnRef: 'GRN-20241201-002',
      itemName: 'Steel Pipes',
      quantity: 50,
      fromLocation: 'Loading Bay B',
      priority: 'normal',
      dueTime: new Date(Date.now() + 3600000),
      estimatedTime: 45,
      isFragile: false,
      requiresColdStorage: false,
      equipmentRequired: 'Pallet Jack'
    },
    {
      id: 'PT004',
      grnRef: 'GRN-20241201-004',
      itemName: 'Glass Products',
      quantity: 75,
      fromLocation: 'Loading Bay A',
      priority: 'high',
      dueTime: new Date(Date.now() + 2700000),
      estimatedTime: 35,
      isFragile: true,
      requiresColdStorage: false,
      equipmentRequired: 'Manual'
    },
    {
      id: 'PT006',
      grnRef: 'GRN-20241201-006',
      itemName: 'Medical Supplies',
      quantity: 100,
      fromLocation: 'Loading Bay D',
      priority: 'critical',
      dueTime: new Date(Date.now() + 1800000),
      estimatedTime: 20,
      isFragile: true,
      requiresColdStorage: true,
      equipmentRequired: 'Manual'
    }
  ];

  workers = [
    {
      id: 1,
      name: 'Akshay Raut',
      designation: 'Forklift Operator',
      status: 'available',
      currentLoad: 2,
      maxCapacity: 5,
      efficiency: 95,
      equipmentCertified: ['Forklift', 'Pallet Jack'],
      currentTasks: [
        { itemName: 'Electronic Components', status: 'assigned' }
      ]
    },
    {
      id: 2,
      name: 'Sanjay Pawar',
      designation: 'Store Keeper',
      status: 'busy',
      currentLoad: 4,
      maxCapacity: 6,
      efficiency: 88,
      equipmentCertified: ['Pallet Jack', 'Manual'],
      currentTasks: [
        { itemName: 'Frozen Food Items', status: 'in_progress' },
        { itemName: 'Building Materials', status: 'assigned' }
      ]
    },
    {
      id: 3,
      name: 'Amit Verma',
      designation: 'Material Handler',
      status: 'available',
      currentLoad: 1,
      maxCapacity: 4,
      efficiency: 92,
      equipmentCertified: ['Manual', 'Pallet Jack'],
      currentTasks: [
        { itemName: 'Office Supplies', status: 'assigned' }
      ]
    },
    {
      id: 4,
      name: 'Prajakta Kamble',
      designation: 'Warehouse Supervisor',
      status: 'available',
      currentLoad: 0,
      maxCapacity: 3,
      efficiency: 98,
      equipmentCertified: ['Forklift', 'Pallet Jack', 'Manual'],
      currentTasks: []
    },
    {
      id: 5,
      name: 'Ravindra Singh',
      designation: 'Quality Inspector',
      status: 'break',
      currentLoad: 1,
      maxCapacity: 2,
      efficiency: 85,
      equipmentCertified: ['Manual'],
      currentTasks: [
        { itemName: 'Chemical Products', status: 'assigned' }
      ]
    }
  ];

  availableWorkers = this.workers.filter(w => w.status === 'available');

  constructor(private fb: FormBuilder) {
    this.assignmentForm = this.fb.group({
      workerId: ['', Validators.required],
      estimatedCompletion: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Watch for worker selection changes
    this.assignmentForm.get('workerId')?.valueChanges.subscribe(workerId => {
      if (workerId && this.selectedTask) {
        this.updateEstimatedCompletion(workerId);
      }
    });
  }

  selectTask(task: any): void {
    this.selectedTask = task;
    this.assignmentForm.reset();
  }

  clearSelection(): void {
    this.selectedTask = null;
    this.assignmentForm.reset();
  }

  getEligibleWorkers(task: any): any[] {
    return this.workers.filter(worker => {
      // Check equipment certification
      const hasEquipment = worker.equipmentCertified.includes(task.equipmentRequired);
      
      // Check availability
      const hasCapacity = worker.currentLoad < worker.maxCapacity;
      
      // Check special requirements
      const canHandleFragile = !task.isFragile || worker.designation !== 'Quality Inspector';
      
      return hasEquipment && hasCapacity && canHandleFragile && worker.status !== 'break';
    });
  }

  updateEstimatedCompletion(workerId: string): void {
    const worker = this.workers.find(w => w.id.toString() === workerId);
    if (worker && this.selectedTask) {
      // Calculate completion time based on worker's current workload
      const baseTime = new Date();
      const additionalMinutes = worker.currentLoad * 30 + this.selectedTask.estimatedTime;
      const completionTime = new Date(baseTime.getTime() + additionalMinutes * 60000);
      
      this.assignmentForm.patchValue({
        estimatedCompletion: completionTime.toISOString().substring(0, 16)
      });
    }
  }

  assignTask(): void {
    if (this.assignmentForm.valid && this.selectedTask) {
      const workerId = parseInt(this.assignmentForm.get('workerId')?.value);
      const worker = this.workers.find(w => w.id === workerId);
      
      if (worker) {
        // Update worker's load
        worker.currentLoad++;
        worker.currentTasks.push({
          itemName: this.selectedTask.itemName,
          status: 'assigned'
        });
        
        // Remove task from unassigned list
        const taskIndex = this.unassignedTasks.findIndex(t => t.id === this.selectedTask.id);
        if (taskIndex > -1) {
          this.unassignedTasks.splice(taskIndex, 1);
        }
        
        // Clear selection
        this.clearSelection();
        
        // Update available workers
        this.availableWorkers = this.workers.filter(w => w.status === 'available' && w.currentLoad < w.maxCapacity);
      }
    }
  }

  getAssignmentSuggestions(task: any): any[] {
    const eligibleWorkers = this.getEligibleWorkers(task);
    
    return eligibleWorkers.map(worker => {
      let score = 100;
      let reason = '';
      
      // Score based on workload
      const workloadRatio = worker.currentLoad / worker.maxCapacity;
      score -= workloadRatio * 30;
      
      // Score based on efficiency
      score = score * (worker.efficiency / 100);
      
      // Bonus for exact equipment match
      if (worker.equipmentCertified.includes(task.equipmentRequired)) {
        score += 10;
      }
      
      // Special handling bonus
      if (task.isFragile && worker.designation === 'Material Handler') {
        score += 5;
        reason = 'Experienced with fragile items';
      } else if (task.requiresColdStorage && worker.designation === 'Store Keeper') {
        score += 5;
        reason = 'Cold storage specialist';
      } else if (task.priority === 'critical' && worker.designation === 'Warehouse Supervisor') {
        score += 15;
        reason = 'Best for critical tasks';
      } else {
        reason = `${Math.round(100 - workloadRatio * 100)}% available capacity`;
      }
      
      return {
        workerId: worker.id,
        workerName: worker.name,
        score: Math.round(score),
        reason: reason
      };
    }).sort((a, b) => b.score - a.score).slice(0, 3);
  }

  applySuggestion(suggestion: any): void {
    this.assignmentForm.patchValue({
      workerId: suggestion.workerId.toString()
    });
  }

  getWorkloadBalance(): number {
    const totalTasks = this.workers.reduce((sum, w) => sum + w.currentLoad, 0);
    const totalCapacity = this.workers.reduce((sum, w) => sum + w.maxCapacity, 0);
    return Math.round((totalTasks / totalCapacity) * 100);
  }

  getEfficiencyScore(): number {
    const avgEfficiency = this.workers.reduce((sum, w) => sum + w.efficiency, 0) / this.workers.length;
    return Math.round(avgEfficiency);
  }

  autoAssignAll(): void {
    // Auto-assign all unassigned tasks based on AI suggestions
    this.unassignedTasks.forEach(task => {
      const suggestions = this.getAssignmentSuggestions(task);
      if (suggestions.length > 0) {
        const bestWorker = this.workers.find(w => w.id === suggestions[0].workerId);
        if (bestWorker) {
          bestWorker.currentLoad++;
          bestWorker.currentTasks.push({
            itemName: task.itemName,
            status: 'assigned'
          });
        }
      }
    });
    
    this.unassignedTasks = [];
    this.availableWorkers = this.workers.filter(w => w.status === 'available' && w.currentLoad < w.maxCapacity);
  }

  optimizeAssignments(): void {
    // Optimize current assignments for better efficiency
  }
} 
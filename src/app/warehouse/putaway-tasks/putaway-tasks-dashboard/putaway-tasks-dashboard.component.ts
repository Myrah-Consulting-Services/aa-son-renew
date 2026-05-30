import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Api } from '../../../core/services/api';

@Component({
  selector: 'app-putaway-tasks-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './putaway-tasks-dashboard.component.html',
  styleUrls: ['./putaway-tasks-dashboard.component.scss']
})
export class PutawayTasksDashboardComponent implements OnInit {
  stats = {
    totalTasks: 45,
    pendingTasks: 18,
    inProgressTasks: 12,
    completedTasks: 15
  };

  priorityTasks = [
    {
      id: 'PT001',
      grnRef: 'GRN-20241201-001',
      itemName: 'Electronic Components',
      quantity: 150,
      fromLocation: 'Loading Bay C',
      toLocation: 'Rack R003-B1',
      workerName: 'Akshay Raut',
      workerRole: 'Forklift Operator',
      dueTime: new Date(Date.now() + 1800000), // 30 minutes from now
      estimatedTime: 25,
      status: 'assigned'
    },
    {
      id: 'PT002',
      grnRef: 'GRN-20241201-002',
      itemName: 'Steel Pipes',
      quantity: 50,
      fromLocation: 'Loading Bay B',
      toLocation: 'Rack R001-A1',
      workerName: null,
      workerRole: null,
      dueTime: new Date(Date.now() + 3600000), // 1 hour from now
      estimatedTime: 45,
      status: 'pending'
    }
  ];

  workerPerformance = [
    { name: 'Akshay Raut', designation: 'Forklift Operator', completedToday: 8 },
    { name: 'Sanjay Pawar', designation: 'Store Keeper', completedToday: 6 },
    { name: 'Amit Verma', designation: 'Material Handler', completedToday: 4 }
  ];

  loadingBays = [
    { name: 'Loading Bay A', utilization: 45, itemsCount: 12 },
    { name: 'Loading Bay B', utilization: 78, itemsCount: 25 },
    { name: 'Loading Bay C', utilization: 92, itemsCount: 35 },
    { name: 'Loading Bay D', utilization: 23, itemsCount: 8 }
  ];

  constructor(private api: Api) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load dashboard data from API
  }

  autoAssignTasks(): void {
    // Auto-assign pending tasks to available workers
  }

  createTask(): void {
    // Navigate to task creation
  }

  prioritizeUrgent(): void {
    // Prioritize urgent tasks
  }

  generateReport(): void {
    // Generate putaway tasks report
  }
} 
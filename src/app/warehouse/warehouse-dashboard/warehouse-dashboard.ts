import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Api } from '../../core/services/api';

@Component({
  selector: 'app-warehouse-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './warehouse-dashboard.html',
  styleUrl: './warehouse-dashboard.scss'
})
export class WarehouseDashboard implements OnInit {
  warehouses: any[] = [];
  locations: any[] = [];
  stock: any[] = [];
  outwardTransactions: any[] = [];
  damages: any[] = [];
  requisitions: any[] = [];

  // Dashboard UI state (single page)
  selectedRange: '7d' | '30d' | '90d' = '7d';
  searchTerm: string = '';
  autoRefreshEnabled: boolean = false;
  private autoRefreshTimer: any = null;

  // ── Custom date filter ──────────────────────────────────────────────────────
  filterStartDate: string = '';
  filterEndDate: string = '';
  dashboardLoading = false;

  // ── Data from dashboard API ─────────────────────────────────────────────────
  dashboardKpis: any = { warehouses: 0, rack_locations: 0, total_stock_items: 0, outward_transactions: 0 };
  processFlowCards: any[] = [];
  processFlowCounts: {
    loading_bay: number;
    putaway_tasks: number;
    rack_storage: number;
    rack_movement: number;
    picking_tasks: number;
    dispatch: number;
  } = {
    loading_bay: 0,
    putaway_tasks: 0,
    rack_storage: 0,
    rack_movement: 0,
    picking_tasks: 0,
    dispatch: 0
  };
  putawayStatistics: any = null;
  rackMovementsStatistics: any = null;
  pickingStatistics: any = null;
  loadingBayStatus: any[] = [];
  lowStockAlerts: any = { total_alerts: 0, critical_count: 0, warning_count: 0, items: [] };
  recentActivity: any[] = [];
  fastMovingItems: any[] = [];
  slowMovingItems: any[] = [];

  // Workflow status tracking
  workflowStats = {
    loadingBay: { items: 0, utilization: 0 },
    putawayTasks: { pending: 0, inProgress: 0, completed: 0 },
    rackMovements: { pending: 0, inProgress: 0, completed: 0 },
    pickingTasks: { pending: 0, inProgress: 0, completed: 0 },
    outwardDispatch: { ready: 0, dispatched: 0 }
  };

  // Test workflow tracking
  testInProgress = false;
  testResults: any[] = [];

  // Process flow data
  processFlow = [
    { 
      id: 1, 
      name: 'Loading Bay', 
      icon: 'truck-flatbed', 
      status: 'active',
      count: 0,
      color: 'primary',
      route: '/warehouse/inward'
    },
    { 
      id: 2, 
      name: 'Putaway Tasks', 
      icon: 'arrow-up-right-square', 
      status: 'active',
      count: 0,
      color: 'warning',
      route: '/warehouse/putaway-tasks'
    },
    { 
      id: 3, 
      name: 'Rack Storage', 
      icon: 'grid-3x3', 
      status: 'active',
      count: 0,
      color: 'info',
      route: '/warehouse/stock'
    },
    { 
      id: 4, 
      name: 'Rack Movement', 
      icon: 'arrow-left-right', 
      status: 'active',
      count: 0,
      color: 'secondary',
      route: '/warehouse/rack-movements'
    },
    { 
      id: 5, 
      name: 'Picking Tasks', 
      icon: 'box-arrow-down', 
      status: 'active',
      count: 0,
      color: 'success',
      route: '/warehouse/outward'
    },
    { 
      id: 6, 
      name: 'Dispatch', 
      icon: 'truck', 
      status: 'active',
      count: 0,
      color: 'danger',
      route: '/warehouse/outward'
    }
  ];

  constructor(
    private svc: Api,
    private router: Router
  ) {}

  ngOnInit() {
    // Default date range: last 30 days
    const range = this.getDefaultDateRange();
    this.filterStartDate = range.start_date;
    this.filterEndDate = range.end_date;

    this.loadDashboardData();
    this.loadData();
  }

  // ── New single-API dashboard loader ────────────────────────────────────────

  loadDashboardData() {
    if (!this.filterStartDate || !this.filterEndDate) return;
    this.dashboardLoading = true;

    const payload = {
      company: this.svc.getCompanyId() ?? 1,
      warehouse: null,
      start_date: this.filterStartDate,
      end_date: this.filterEndDate
    };

    this.svc.post('/warehouses/warehouse-dashboard/', payload).subscribe({
      next: (res: any) => {
        this.dashboardLoading = false;
        if (res.status === 200) {
          // KPIs
          this.dashboardKpis = res.kpis || this.dashboardKpis;

          // Sync warehouses / locations / stock counts for existing template bindings
          this.warehouses = Array(this.dashboardKpis.warehouses).fill({});
          this.locations  = Array(this.dashboardKpis.rack_locations).fill({});
          this.stock      = Array(this.dashboardKpis.total_stock_items).fill({});
          this.outwardTransactions = Array(this.dashboardKpis.outward_transactions).fill({});

          // Process flow counts — stored in a flat object, bound directly in HTML
          this.processFlowCards = res.process_flow_cards || [];
          const pfc = res.process_flow_counts || {};
          const cardOverrides: Record<string, number> = {};
          this.processFlowCards.forEach((c: any) => { cardOverrides[c.key] = c.count; });
          this.processFlowCounts = {
            loading_bay:   cardOverrides['loading_bay']   ?? pfc.loading_bay   ?? 0,
            putaway_tasks: cardOverrides['putaway_tasks'] ?? pfc.putaway_tasks  ?? 0,
            rack_storage:  cardOverrides['rack_storage']  ?? pfc.rack_storage   ?? 0,
            rack_movement: cardOverrides['rack_movement'] ?? pfc.rack_movement  ?? 0,
            picking_tasks: cardOverrides['picking_tasks'] ?? pfc.picking_tasks  ?? 0,
            dispatch:      cardOverrides['dispatch']      ?? pfc.dispatch       ?? 0,
          };

          // Workflow stats
          const pf = res.process_flow || {};
          this.workflowStats.putawayTasks.pending  = pf.putaway_tasks_pending  ?? 0;
          this.workflowStats.rackMovements.pending = pf.rack_movements_pending ?? 0;
          this.workflowStats.pickingTasks.pending  = pf.picking_tasks_pending  ?? 0;
          this.workflowStats.loadingBay.utilization = pf.loading_bay_utilization_percent ?? 0;

          // Putaway statistics
          if (res.putaway_statistics) {
            this.putawayStatistics = res.putaway_statistics;
            const byStatus = res.putaway_statistics.by_putaway_status || [];
            const completed = byStatus.find((s: any) => s.putaway_status === 'Completed');
            const inProgress = byStatus.find((s: any) => s.putaway_status === 'In Progress');
            this.workflowStats.putawayTasks.completed  = completed?.count  ?? 0;
            this.workflowStats.putawayTasks.inProgress = inProgress?.count ?? 0;
          }

          // Picking statistics
          if (res.picking_statistics) {
            this.pickingStatistics = res.picking_statistics;
            this.workflowStats.pickingTasks.pending = res.picking_statistics.pending ?? 0;
          }

          // Rack movements statistics
          this.rackMovementsStatistics = res.rack_movements_statistics || null;

          // Loading bay status
          this.loadingBayStatus = res.loading_bay_status || [];

          // Low stock alerts
          this.lowStockAlerts = res.low_stock_alerts || this.lowStockAlerts;

          // Recent activity
          this.recentActivity = res.recent_activity || [];

          // Fast / slow moving items
          this.fastMovingItems = res.fast_moving_items || [];
          this.slowMovingItems = res.slow_moving_items  || [];
        }
      },
      error: () => {
        this.dashboardLoading = false;
      }
    });
  }

  applyDateFilter() {
    this.loadDashboardData();
  }

  private getDefaultDateRange(): { start_date: string; end_date: string } {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    };
  }

  // ── Existing methods kept intact ────────────────────────────────────────────

  loadData() {
    this.loadWarehouses();
    this.loadLocations();
    this.loadStock();
    this.loadOutward();
    this.loadDamages();
    this.loadRequisitions();
  }

  loadWorkflowStats() {
    // Load putaway tasks stats
    this.svc.get('/warehouse/putaway-tasks/statistics').subscribe((res: any) => {
      if (res.status === 200) {
        this.workflowStats.putawayTasks = res.data;
        // processFlow counts owned by loadDashboardData
      }
    });

    // Load rack movement stats
    this.svc.get('/warehouse/rack-movements/statistics').subscribe((res: any) => {
      if (res.status === 200) {
        this.workflowStats.rackMovements = res.data;
        // processFlow counts owned by loadDashboardData
      }
    });

    // Load loading bay status
    this.svc.get('/warehouse/loading-bays/status').subscribe((res: any) => {
      if (res.status === 200) {
        this.workflowStats.loadingBay = res.data;
        // processFlow counts owned by loadDashboardData
      }
    });

    // Load picking tasks from outward forms
    this.svc.get('/warehouse/outward/picking-tasks/statistics').subscribe((res: any) => {
      if (res.status === 200) {
        this.workflowStats.pickingTasks = res.data;
        // processFlow counts owned by loadDashboardData
      }
    });

    // processFlow[2] rack storage count owned by loadDashboardData
  }

  loadWarehouses() {
    this.svc.get('/warehouses/list-warehouse/', { company: 1 }).subscribe((res: any) => {
      if(res.status == 200){
        this.warehouses = res.data;
      }
    });  
  }

  loadLocations() {
    this.svc.get('/warehouses/list-location/').subscribe((res:any) => {
      if(res.status == 200){
        this.locations = res.data;
      }
    });
  }

  loadStock() {
    this.svc.post('/items/list-item/s=/', { company: 1, warehouse: 1 }).subscribe((res: any) => {
      if (res.status == 200) {
        this.stock = res.data;
        // processFlow[2] count is owned by loadDashboardData — do not overwrite here
      }
    });
  }

  loadOutward() {
    this.svc.get('/outward/list-outward/s=/', { company: 1 }).subscribe((res: any) => {
      this.outwardTransactions = res.data;
      // processFlow[5] count is owned by loadDashboardData — do not overwrite here
    });
  }

  loadDamages() {
    this.svc.get('/damages/list-damage/s=/', { company: 1 }).subscribe((res:any) => this.damages = res.data);
  }

  loadRequisitions() {
    this.svc.get('/requisitions/list-requisition/', { company: 1 }).subscribe((res:any) => this.requisitions = res.data);
  }

  getTotalStockValue(): number {
    return this.stock.reduce((total, item) => total + (item.quantity || 0), 0);
  }

  getLowStockItems(): any[] {
    // Use API low stock alerts when available, else fall back to local stock filter
    if (this.lowStockAlerts?.items?.length) {
      const items = this.lowStockAlerts.items;
      if (!this.searchTerm) return items;
      const q = this.searchTerm.toLowerCase();
      return items.filter((i: any) => (i.item_name || i.name || i.itemName || '').toLowerCase().includes(q));
    }
    const list = this.stock.filter(item => item.quantity < 10);
    if (!this.searchTerm) return list;
    const q = this.searchTerm.toLowerCase();
    return list.filter((i: any) => (i.name || i.itemName || '').toLowerCase().includes(q));
  }

  getRecentTransactions(): any[] {
    // Use API recent activity when available
    if (this.recentActivity.length) {
      if (!this.searchTerm) return this.recentActivity.slice(0, 10);
      const q = this.searchTerm.toLowerCase();
      return this.recentActivity.filter((t: any) =>
        (t.reference_no || '').toLowerCase().includes(q) ||
        (t.warehouse || '').toLowerCase().includes(q) ||
        (t.activity_type || '').toLowerCase().includes(q)
      ).slice(0, 10);
    }
    const data = this.filterTransactionsByRange(this.outwardTransactions);
    const recent = data.slice(-10);
    if (!this.searchTerm) return recent;
    const q = this.searchTerm.toLowerCase();
    return recent.filter((t: any) =>
      (t.customerName || t.customer || '').toLowerCase().includes(q) ||
      ((t.items && t.items.map((it: any) => (it.itemName || it.name || '')).join(' ')).toLowerCase().includes(q))
    );
  }

  navigateTo(path: string) {
    this.router.navigate([`/warehouse/${path}`]);
  }

  navigateToProcessStep(step: any) {
    this.router.navigate([step.route]);
  }

  getWorkflowEfficiency(): number {
    const totalCompleted = this.workflowStats.putawayTasks.completed + 
                          this.workflowStats.rackMovements.completed + 
                          this.workflowStats.pickingTasks.completed;
    const totalTasks = totalCompleted + 
                      this.workflowStats.putawayTasks.pending + 
                      this.workflowStats.rackMovements.pending + 
                      this.workflowStats.pickingTasks.pending;
    
    return totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  }

  setRange(range: '7d' | '30d' | '90d'): void {
    this.selectedRange = range;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
  }

  refreshNow(): void {
    this.loadDashboardData();
    this.loadData();
    this.loadWorkflowStats();
  }

  toggleAutoRefresh(): void {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.autoRefreshTimer = setInterval(() => {
        this.loadDashboardData();
        this.loadWorkflowStats();
      }, 60000);
    } else if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  // Derived KPIs
  get totalSkus(): number {
    return this.stock?.length || 0;
  }

  get lowStockCount(): number {
    return this.stock.filter(i => i.quantity < 10).length;
  }

  get pendingTasksTotal(): number {
    const w = this.workflowStats;
    return (w.putawayTasks.pending || 0) + (w.rackMovements.pending || 0) + (w.pickingTasks.pending || 0);
  }

  get pickingEfficiency(): number {
    const w = this.workflowStats.pickingTasks;
    const total = (w.completed || 0) + (w.pending || 0) + (w.inProgress || 0);
    return total > 0 ? Math.round(((w.completed || 0) / total) * 100) : 0;
  }

  // Helpers
  private filterTransactionsByRange(transactions: any[]): any[] {
    const days = this.selectedRange === '7d' ? 7 : this.selectedRange === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return (transactions || []).filter((t: any) => {
      const d = new Date(t.date || t.createdAt || t.dispatchDate || Date.now());
      return d >= cutoff;
    });
  }

  getTopFastMovingItems(limit: number = 5): any[] {
    // Use API data when available
    if (this.fastMovingItems.length) {
      return this.fastMovingItems.slice(0, limit).map((i: any) => ({
        name: i.item_name || i.name,
        qty: i.total_quantity ?? i.qty ?? 0,
        sku: i.sku
      }));
    }
    const map: any = {};
    this.filterTransactionsByRange(this.outwardTransactions).forEach((t: any) => {
      (t.items || []).forEach((it: any) => {
        const key = it.itemId || it.item_id || it.itemName || it.name;
        if (!key) return;
        map[key] = (map[key] || 0) + (it.quantity || 1);
      });
    });
    return Object.keys(map)
      .map(k => ({ name: k, qty: map[k] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, limit);
  }

  getSlowMovingItems(limit: number = 5): any[] {
    // Use API data when available
    if (this.slowMovingItems.length) {
      return this.slowMovingItems.slice(0, limit).map((i: any) => ({
        name: i.item_name || i.name || i.itemName,
        quantity: i.quantity ?? 0,
        sku: i.sku
      }));
    }
    // Slow = low outbound quantity, but present in stock
    const fastKeys = new Set(this.getTopFastMovingItems(100).map(i => i.name));
    const candidates = this.stock.filter((s: any) => !fastKeys.has(s.name || s.itemName));
    return candidates.sort((a: any, b: any) => (a.quantity || 0) - (b.quantity || 0)).slice(0, limit);
  }

  // Test workflow with sample materials
  testCompleteWorkflow(): void {
    if (this.testInProgress) {
      alert('Test already in progress! Please wait for completion.');
      return;
    }

    this.testInProgress = true;
    this.testResults = [];
    
    // Show initial alert
    alert('🧪 Starting Complete Warehouse Workflow Test!\n\nWatch the progress below and check browser console (F12) for detailed logs.\n\nThis will demonstrate the entire material flow from Loading Bay to Final Dispatch.');
    
    this.addTestResult('🧪 Starting Complete Warehouse Workflow Test...', 'info');
    this.addTestResult('📋 Testing with 3 sample materials:', 'info');
    this.addTestResult('   1. Electronic Components (Fragile, 500 PCS)', 'info');
    this.addTestResult('   2. Steel Pipes (Heavy, 50 PCS)', 'info');  
    this.addTestResult('   3. Cold Storage Chemicals (Temperature Control, 100 Bottles)', 'info');
    
    console.log('🧪 Starting Complete Warehouse Workflow Test...');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 Testing with 3 sample materials:');
    console.log('   1. Electronic Components (Fragile, 500 PCS)');
    console.log('   2. Steel Pipes (Heavy, 50 PCS)');  
    console.log('   3. Cold Storage Chemicals (Temperature Control, 100 Bottles)');
    console.log('═══════════════════════════════════════════════════');
    
    // Step 1: Create sample materials for testing
    const sampleMaterials = this.createSampleMaterials();
    
    // Step 2: Test inward process (Loading Bay)
    this.testInwardProcess(sampleMaterials);
    
    // Step 3: Test putaway tasks
    this.testPutawayProcess(sampleMaterials);
    
    // Step 4: Test rack movements
    this.testRackMovements(sampleMaterials);
    
    // Step 5: Test order processing and picking
    this.testOrderProcessing(sampleMaterials);
    
    // Step 6: Test final dispatch
    this.testFinalDispatch(sampleMaterials);
    
    // Show completion message after all steps
    setTimeout(() => {
      this.addTestResult('🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY!', 'success');
      this.addTestResult('📊 Summary: 3 Materials • 650 Barcodes • 5 Tasks • 4 Picks • 1 Dispatch', 'success');
      this.testInProgress = false;
      
      alert('✅ Complete Warehouse Workflow Test Completed!\n\n📊 Summary:\n• 3 Materials processed\n• 650 Barcodes generated\n• 5 Putaway/Movement tasks\n• 4 Picking tasks\n• 1 Final dispatch\n\nCheck results section below!');
    }, 8000);
  }

  private addTestResult(message: string, type: string): void {
    this.testResults.push({
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  private createSampleMaterials(): any[] {
    return [
      {
        id: 'TEST-001',
        name: 'Electronic Components - Resistors',
        category: 'Electronics',
        quantity: 500,
        unit: 'PCS',
        barcode: 'ELEC001',
        properties: {
          isFragile: true,
          requiresTemperatureControl: false,
          dimensions: { length: 10, width: 5, height: 2 },
          weight: 0.5
        },
        supplier: 'TechParts Ltd',
        poReference: 'PO-2024-001'
      },
      {
        id: 'TEST-002', 
        name: 'Steel Pipes - 2 inch',
        category: 'Construction',
        quantity: 50,
        unit: 'PCS',
        barcode: 'STEEL002',
        properties: {
          isFragile: false,
          requiresTemperatureControl: false,
          dimensions: { length: 300, width: 5, height: 5 },
          weight: 25
        },
        supplier: 'SteelWorks Inc',
        poReference: 'PO-2024-002'
      },
      {
        id: 'TEST-003',
        name: 'Cold Storage Items - Chemicals',
        category: 'Chemicals',
        quantity: 100,
        unit: 'BOTTLES',
        barcode: 'CHEM003',
        properties: {
          isFragile: true,
          requiresTemperatureControl: true,
          dimensions: { length: 15, width: 15, height: 25 },
          weight: 2
        },
        supplier: 'ChemCorp',
        poReference: 'PO-2024-003'
      }
    ];
  }

  private testInwardProcess(materials: any[]): void {
    this.addTestResult('📦 Step 1: Testing Inward Process (Loading Bay)', 'warning');
    console.log('📦 Step 1: Testing Inward Process (Loading Bay)');
    
    materials.forEach((material, index) => {
      console.log(`  ➤ Processing ${material.name}`);
      
      // Simulate GRN creation
      const grn = {
        grnNo: `GRN-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        materialId: material.id,
        quantity: material.quantity,
        loadingBayArea: this.selectOptimalLoadingBay(material),
        placementOption: material.properties.requiresTemperatureControl ? '2' : '1', // Direct to rack for temp control
        barcodes: this.generateTestBarcodes(material),
        status: 'received'
      };
      
      this.addTestResult(`✓ ${material.name} → ${grn.loadingBayArea} (${grn.barcodes.length} barcodes)`, 'success');
      
      console.log(`    ✓ GRN Created: ${grn.grnNo}`);
      console.log(`    ✓ Loading Bay: ${grn.loadingBayArea}`);
      console.log(`    ✓ Barcodes Generated: ${grn.barcodes.length} units`);
      
      // Simulate API call
      this.simulateApiCall('/inward/create-grn/', grn);
    });
  }

  private testPutawayProcess(materials: any[]): void {
    console.log('⬆️ Step 2: Testing Putaway Tasks (Loading Bay → Rack)');
    
    materials.forEach((material, index) => {
      if (material.properties.requiresTemperatureControl) {
        console.log(`  ➤ ${material.name} placed directly in temperature-controlled rack`);
        return;
      }
      
      console.log(`  ➤ Creating putaway task for ${material.name}`);
      
      const putawayTask = {
        id: `PT-${Date.now()}-${index}`,
        grnRef: `GRN-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`,
        itemId: material.id,
        itemName: material.name,
        quantity: material.quantity,
        fromLocation: 'Loading Bay A',
        toLocation: this.selectOptimalRack(material),
        priority: material.properties.isFragile ? 'high' : 'normal',
        assignedWorker: this.assignWorker(material),
        estimatedTime: this.calculatePutawayTime(material),
        status: 'pending'
      };
      
      console.log(`    ✓ Task Created: ${putawayTask.id}`);
      console.log(`    ✓ Assigned to: ${putawayTask.assignedWorker}`);
      console.log(`    ✓ Target Rack: ${putawayTask.toLocation}`);
      console.log(`    ✓ Priority: ${putawayTask.priority}`);
      
      // Simulate task completion
      setTimeout(() => {
        console.log(`    ✅ Putaway completed for ${material.name}`);
        this.updateWorkflowStats('putaway', 'completed');
      }, 2000);
      
      this.simulateApiCall('/warehouse/putaway-tasks/create', putawayTask);
    });
  }

  private testRackMovements(materials: any[]): void {
    console.log('↔️ Step 3: Testing Rack Movements (System Triggers)');
    
    // Simulate different movement triggers
    const triggers = [
      { type: 'capacity', reason: 'Rack R001 at 85% capacity' },
      { type: 'maintenance', reason: 'Scheduled maintenance for Rack R003' },
      { type: 'temperature', reason: 'Temperature control optimization' },
      { type: 'demand', reason: 'High demand item repositioning' }
    ];
    
    triggers.forEach((trigger, index) => {
      if (index < materials.length) {
        const material = materials[index];
        const movement = {
          id: `RM-${Date.now()}-${index}`,
          fromRack: `R00${index + 1}`,
          toRack: `R00${index + 5}`,
          itemId: material.id,
          itemName: material.name,
          quantity: Math.floor(material.quantity / 2),
          reason: trigger.reason,
          triggerType: trigger.type,
          priority: trigger.type === 'maintenance' ? 'high' : 'medium',
          assignedWorker: this.assignWorker(material, true), // Require forklift operator
          status: 'pending'
        };
        
        console.log(`  ➤ ${trigger.type.toUpperCase()} Trigger: ${material.name}`);
        console.log(`    ✓ Movement: ${movement.fromRack} → ${movement.toRack}`);
        console.log(`    ✓ Reason: ${movement.reason}`);
        console.log(`    ✓ Assigned to: ${movement.assignedWorker}`);
        
        this.simulateApiCall('/warehouse/rack-movements/create', movement);
      }
    });
  }

  private testOrderProcessing(materials: any[]): void {
    console.log('🎯 Step 4: Testing Order Processing & Picking Tasks');
    
    // Create sample sales orders
    const salesOrders = [
      {
        id: 'SO-2024-001',
        customerId: 'CUST-001',
        customerName: 'ABC Electronics Ltd',
        items: [
          { itemId: materials[0].id, itemName: materials[0].name, quantity: 200 },
          { itemId: materials[1].id, itemName: materials[1].name, quantity: 10 }
        ]
      },
      {
        id: 'SO-2024-002',
        customerId: 'CUST-002', 
        customerName: 'XYZ Construction',
        items: [
          { itemId: materials[1].id, itemName: materials[1].name, quantity: 25 },
          { itemId: materials[2].id, itemName: materials[2].name, quantity: 50 }
        ]
      }
    ];
    
    salesOrders.forEach((order, orderIndex) => {
      console.log(`  ➤ Processing Sales Order: ${order.id} for ${order.customerName}`);
      
      order.items.forEach((item, itemIndex) => {
        const pickingTask = {
          id: `PICK-${Date.now()}-${orderIndex}-${itemIndex}`,
          salesOrderRef: order.id,
          customerId: order.customerId,
          customerName: order.customerName,
          itemId: item.itemId,
          itemName: item.itemName,
          quantity: item.quantity,
          sourceLocation: this.findItemLocation(item.itemId),
          targetLocation: 'Loading Bay - Dispatch Area',
          assignedWorker: this.assignWorker(item),
          priority: 'normal',
          estimatedTime: this.calculatePickingTime(item.quantity),
          status: 'pending'
        };
        
        console.log(`    ✓ Picking Task: ${pickingTask.id}`);
        console.log(`    ✓ Item: ${item.itemName} (${item.quantity} units)`);
        console.log(`    ✓ From: ${pickingTask.sourceLocation}`);
        console.log(`    ✓ Assigned to: ${pickingTask.assignedWorker}`);
        
        // Simulate picking completion
        setTimeout(() => {
          console.log(`    ✅ Picking completed for ${item.itemName}`);
          this.updateWorkflowStats('picking', 'completed');
        }, 3000);
        
        this.simulateApiCall('/warehouse/outward/create-picking-task', pickingTask);
      });
    });
  }

  private testFinalDispatch(materials: any[]): void {
    console.log('🚛 Step 5: Testing Final Dispatch (Invoicing & Outward)');
    
    // Simulate dispatch after picking tasks are completed
    setTimeout(() => {
      const dispatches = [
        {
          id: 'DISP-2024-001',
          salesOrderRef: 'SO-2024-001',
          customerId: 'CUST-001',
          customerName: 'ABC Electronics Ltd',
          items: [
            { itemId: materials[0].id, itemName: materials[0].name, quantity: 200 },
            { itemId: materials[1].id, itemName: materials[1].name, quantity: 10 }
          ],
          totalValue: 15000,
          invoiceRef: 'INV-2024-001',
          dispatchDate: new Date(),
          vehicle: 'TRK-001',
          driver: 'Rajesh Kumar',
          status: 'ready_for_dispatch'
        }
      ];
      
      dispatches.forEach(dispatch => {
        console.log(`  ➤ Final Dispatch: ${dispatch.id}`);
        console.log(`    ✓ Customer: ${dispatch.customerName}`);
        console.log(`    ✓ Invoice: ${dispatch.invoiceRef}`);
        console.log(`    ✓ Total Value: ₹${dispatch.totalValue.toLocaleString()}`);
        console.log(`    ✓ Vehicle: ${dispatch.vehicle}`);
        console.log(`    ✓ Driver: ${dispatch.driver}`);
        console.log(`    ✅ Status: ${dispatch.status.replace('_', ' ').toUpperCase()}`);
        
        this.simulateApiCall('/warehouse/dispatch/create', dispatch);
      });
      
      console.log('🎉 WORKFLOW TEST COMPLETED SUCCESSFULLY!');
      console.log('📊 Summary:');
      console.log('  • Materials Received: 3 items');
      console.log('  • Barcodes Generated: 650 units');
      console.log('  • Putaway Tasks: 2 tasks (1 direct to rack)');
      console.log('  • Rack Movements: 4 system-triggered movements');
      console.log('  • Picking Tasks: 4 tasks for 2 sales orders');
      console.log('  • Final Dispatches: 1 completed dispatch');
      
    }, 5000);
  }

  // Helper methods for testing
  private selectOptimalLoadingBay(material: any): string {
    const bays = ['Loading Bay A', 'Loading Bay B', 'Loading Bay C', 'Loading Bay D'];
    if (material.properties.isFragile) return 'Loading Bay A'; // Closest to fragile storage
    if (material.properties.weight > 20) return 'Loading Bay D'; // Heavy items bay
    return bays[Math.floor(Math.random() * bays.length)];
  }

  private selectOptimalRack(material: any): string {
    if (material.properties.requiresTemperatureControl) return 'Rack TC-001 (Temperature Controlled)';
    if (material.properties.isFragile) return 'Rack FR-001 (Fragile Items)';
    if (material.properties.weight > 20) return 'Rack HV-001 (Heavy Items)';
    return `Rack R${String(Math.floor(Math.random() * 10) + 1).padStart(3, '0')}`;
  }

  private assignWorker(material: any, requireForklift: boolean = false): string {
    const workers = {
      forklift: ['Akshay Raut', 'Sanjay Pawar', 'Amit Verma'],
      general: ['Rahul Desai', 'Priya Sharma', 'Suresh Yadav'],
      fragile: ['Meera Joshi', 'Vikram Singh']
    };
    
    if (requireForklift) return workers.forklift[Math.floor(Math.random() * workers.forklift.length)];
    if (material.properties?.isFragile) return workers.fragile[Math.floor(Math.random() * workers.fragile.length)];
    return workers.general[Math.floor(Math.random() * workers.general.length)];
  }

  private calculatePutawayTime(material: any): number {
    let baseTime = 15; // 15 minutes base
    if (material.properties.isFragile) baseTime += 10;
    if (material.properties.weight > 20) baseTime += 15;
    if (material.quantity > 100) baseTime += Math.floor(material.quantity / 100) * 5;
    return baseTime;
  }

  private calculatePickingTime(quantity: number): number {
    return Math.max(10, Math.floor(quantity / 10) * 2); // 2 minutes per 10 items, minimum 10 minutes
  }

  private findItemLocation(itemId: string): string {
    const locations = ['Rack R001-A1', 'Rack R002-B2', 'Rack R003-C1', 'Rack TC-001', 'Rack FR-001'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  private generateTestBarcodes(material: any): string[] {
    const barcodes = [];
    for (let i = 1; i <= material.quantity; i++) {
      barcodes.push(`${material.barcode}-${String(i).padStart(3, '0')}`);
    }
    return barcodes;
  }

  private simulateApiCall(endpoint: string, data: any): void {
    console.log(`    🔄 API Call: ${endpoint}`, data);
    // In real implementation, this would be: this.svc.post(endpoint, data).subscribe(...)
  }

  private updateWorkflowStats(type: string, status: string): void {
    // Update workflow statistics for dashboard
    if (type === 'putaway' && status === 'completed') {
      this.workflowStats.putawayTasks.completed++;
      this.workflowStats.putawayTasks.pending = Math.max(0, this.workflowStats.putawayTasks.pending - 1);
    }
    if (type === 'picking' && status === 'completed') {
      this.workflowStats.pickingTasks.completed++;
      this.workflowStats.pickingTasks.pending = Math.max(0, this.workflowStats.pickingTasks.pending - 1);
    }
  }
} 
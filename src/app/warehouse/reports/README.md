# Reports Module

A comprehensive reporting system for the warehouse management application that provides detailed analytics, filtering, and export capabilities.

## 🚀 Features

### 📊 Report Types
- **Inventory Reports** - Stock levels, valuations, and low stock alerts
- **Movements Reports** - Inward, outward, and relocation transactions
- **Damage Reports** - Damage tracking and loss analysis
- **Requisitions Reports** - Request tracking and approval workflows
- **Performance Reports** - Warehouse efficiency and utilization metrics

### 🔧 Core Functionality
- **Advanced Filtering** - Filter by warehouse, item, date range, status, and more
- **Export Capabilities** - CSV and PDF export options
- **Real-time Data** - Live data updates from warehouse services
- **Responsive Design** - Works on all device sizes
- **Interactive Charts** - Visual data representation
- **Sorting & Pagination** - Efficient data navigation

## 📁 Module Structure

```
reports/
├── reports-module.ts                 # Main module file
├── reports-routing-module.ts         # Routing configuration
├── reports.service.ts                # Shared service utilities
├── reports-dashboard/                # Main dashboard
├── inventory-report/                 # Inventory analytics
├── movements-report/                 # Transaction tracking
├── damage-report/                    # Damage analysis
├── requisitions-report/              # Request management
├── warehouse-performance/            # Performance metrics
└── shared/                          # Reusable components
    ├── report-filters.component.ts   # Filter component
    ├── summary-cards.component.ts    # Summary cards
    └── data-table.component.ts       # Data table with sorting/pagination
```

## 🎯 Usage

### Accessing Reports
Navigate to `/reports` to access the main reports dashboard, or use direct links:
- `/reports/dashboard` - Main dashboard
- `/reports/inventory` - Inventory reports
- `/reports/movements` - Movement reports
- `/reports/damage` - Damage reports
- `/reports/requisitions` - Requisition reports
- `/reports/warehouse-performance` - Performance reports

### Using Filters
Each report includes comprehensive filtering options:
- **Date Range** - Filter by specific date periods
- **Quick Date Buttons** - Today, Week, Month, Quarter, Year
- **Warehouse** - Filter by specific warehouse
- **Item** - Filter by specific items
- **Status** - Filter by transaction status
- **Department** - Filter by department (requisitions)
- **Source** - Filter by damage source

### Exporting Data
- **CSV Export** - Download data in CSV format
- **PDF Export** - Generate PDF reports (coming soon)
- **Real-time Data** - All exports use current filtered data

## 🧩 Components

### Report Filters Component
Reusable filter component with configurable options:

```typescript
<app-report-filters
  [filters]="filters"
  [warehouses]="warehouses"
  [items]="items"
  [showWarehouseFilter]="true"
  [showDateFilters]="true"
  [showQuickDateButtons]="true"
  (filterChange)="onFilterChange($event)">
</app-report-filters>
```

### Summary Cards Component
Display key metrics in card format:

```typescript
<app-summary-cards
  [cards]="[
    {
      title: 'Total Items',
      value: '1,234',
      icon: 'bi-box-seam',
      color: 'primary'
    }
  ]">
</app-summary-cards>
```

### Data Table Component
Advanced table with sorting, pagination, and actions:

```typescript
<app-data-table
  [title]="'Inventory Data'"
  [columns]="columns"
  [data]="filteredData"
  [actions]="actions"
  [showExport]="true"
  [showPagination]="true"
  (actionClick)="onAction($event)">
</app-data-table>
```

## 📊 Report Details

### Inventory Report
- Current stock levels across all warehouses
- Low stock alerts and reorder suggestions
- Stock valuation and cost analysis
- Item-wise stock distribution
- Warehouse-wise stock summary

### Movements Report
- Inward transaction tracking
- Outward transaction analysis
- Item relocation history
- Transaction volume trends
- Source and destination analysis

### Damage Report
- Damage incident tracking
- Loss value calculations
- Damage by source analysis
- Item-wise damage patterns
- Location-wise damage trends

### Requisitions Report
- Pending requisition tracking
- Approval/rejection workflows
- Department-wise analysis
- Requestor performance
- Item demand patterns

### Performance Report
- Warehouse efficiency metrics
- Location utilization rates
- Activity summary
- Performance comparisons
- Trend analysis

## 🎨 Styling

The module uses Bootstrap 5 with custom SCSS for consistent styling:
- Modern card-based layouts
- Hover effects and transitions
- Responsive grid system
- Consistent color scheme
- Professional typography

## 🔧 Configuration

### Adding New Reports
1. Create new component in reports directory
2. Add route to `reports-routing-module.ts`
3. Update dashboard with new report category
4. Implement required service methods

### Customizing Filters
The filter component supports various configurations:
- Show/hide specific filters
- Custom filter options
- Date range presets
- Dynamic filter loading

### Data Integration
Reports integrate with existing warehouse services:
- `InwardReceiptService` - For transaction data
- Real-time data updates
- Consistent data formatting
- Error handling

## 🚀 Future Enhancements

- **Advanced Charts** - Interactive charts and graphs
- **Scheduled Reports** - Automated report generation
- **Email Reports** - Direct email delivery
- **Custom Dashboards** - User-configurable layouts
- **Real-time Alerts** - Automated notifications
- **Mobile App** - Native mobile reporting

## 📝 API Reference

### ReportsService
```typescript
// Generate CSV content
generateCSV(headers: string[], data: any[]): string

// Download CSV file
downloadCSV(csvContent: string, filename: string): void

// Format currency values
formatCurrency(value: number): string

// Calculate date ranges
getDateRange(range: 'today' | 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date }

// Group data by key
groupBy<T>(data: T[], key: keyof T): Map<any, T[]>

// Calculate summary statistics
calculateSummary(data: any[], valueKey: string): SummaryStats
```

### Interfaces
```typescript
interface ReportFilter {
  warehouse?: string;
  item?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  source?: string;
  department?: string;
}

interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}
```

## 🤝 Contributing

When adding new reports or features:
1. Follow the existing component structure
2. Use the shared components when possible
3. Implement proper error handling
4. Add comprehensive filtering options
5. Include export functionality
6. Update this documentation

## 📞 Support

For questions or issues with the reports module:
1. Check the component documentation
2. Review the service interfaces
3. Test with sample data
4. Contact the development team 
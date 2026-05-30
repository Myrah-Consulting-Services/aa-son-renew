import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'action';
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  formatter?: (value: any) => string;
}

export interface TableAction {
  label: string;
  icon: string;
  action: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  disabled?: boolean;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styles: [`
    .table th.sortable {
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
    
    .table th.sortable .bi {
      font-size: 0.75rem;
    }
    
    .btn-group .btn {
      margin-right: 2px;
      
      &:last-child {
        margin-right: 0;
      }
    }
    
    .pagination .page-link {
      border-radius: 0.25rem;
      margin: 0 1px;
    }
  `]
})
export class DataTableComponent {
  @Input() title = 'Data Table';
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() actions: TableAction[] = [];
  @Input() showExport = true;
  @Input() showPagination = true;
  @Input() pageSize = 10;

  @Output() actionClick = new EventEmitter<{ action: string; row: any }>();

  // Pagination
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;
  paginatedData: any[] = [];

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Math for template
  Math = Math;

  ngOnChanges() {
    this.updatePagination();
  }

  updatePagination() {
    this.totalItems = this.data.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.paginatedData = this.data.slice(
      (this.currentPage - 1) * this.pageSize,
      this.currentPage * this.pageSize
    );
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  sort(columnKey: string) {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }
    
    // Sort the data
    this.data.sort((a, b) => {
      const aVal = a[columnKey];
      const bVal = b[columnKey];
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    this.updatePagination();
  }

  getColumnClass(column: TableColumn): string {
    const classes = [];
    
    if (column.align) {
      classes.push(`text-${column.align}`);
    }
    
    return classes.join(' ');
  }

  getFormattedValue(row: any, column: TableColumn): string {
    const value = row[column.key];
    if (column.formatter) {
      return column.formatter(value);
    }
    return value;
  }

  getBadgeClass(value: any): string {
    // Default badge classes based on value
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue.includes('success') || lowerValue.includes('approved')) return 'bg-success';
      if (lowerValue.includes('warning') || lowerValue.includes('pending')) return 'bg-warning';
      if (lowerValue.includes('danger') || lowerValue.includes('rejected')) return 'bg-danger';
      if (lowerValue.includes('info')) return 'bg-info';
    }
    return 'bg-secondary';
  }

  onAction(action: string, row: any) {
    this.actionClick.emit({ action, row });
  }

  exportCSV() {
    // Implementation for CSV export
    console.log('Exporting CSV...');
  }

  exportPDF() {
    // Implementation for PDF export
    console.log('Exporting PDF...');
  }
} 
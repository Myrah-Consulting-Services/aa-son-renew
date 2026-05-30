import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Api } from '../../core/services/api';

export interface ReportFilter {
  warehouse?: string;
  item?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  source?: string;
  department?: string;
}

export interface ReportData {
  id: string;
  title: string;
  description: string;
  data: any[];
  summary: any;
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor() { }

  /**
   * Generate CSV content from data array
   */
  generateCSV(headers: string[], data: any[]): string {
    const csvContent = [
      headers.join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    return csvContent;
  }

  /**
   * Download CSV file
   */
  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Format currency values
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED'
    }).format(value);
  }

  /**
   * Format percentage values
   */
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  /**
   * Get color class based on value ranges
   */
  getStatusColor(value: number, thresholds: { low: number; medium: number }): string {
    if (value >= thresholds.medium) return 'success';
    if (value >= thresholds.low) return 'warning';
    return 'danger';
  }

  /**
   * Calculate date range for reports
   */
  getDateRange(range: 'today' | 'week' | 'month' | 'quarter' | 'year'): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    
    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start, end: now };
  }

  /**
   * Group data by specified key
   */
  groupBy<T>(data: T[], key: keyof T): Map<any, T[]> {
    return data.reduce((groups, item) => {
      const groupKey = item[key];
      const group = groups.get(groupKey) || [];
      group.push(item);
      groups.set(groupKey, group);
      return groups;
    }, new Map<any, T[]>());
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(data: any[], valueKey: string): {
    total: number;
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    const values = data.map(item => Number(item[valueKey])).filter(val => !isNaN(val));
    
    if (values.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0, count: 0 };
    }
    
    return {
      total: values.reduce((sum, val) => sum + val, 0),
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  /**
   * Apply filters to data
   */
  applyFilters<T>(data: T[], filters: ReportFilter): T[] {
    return data.filter(item => {
      // Implement filtering logic based on your data structure
      // This is a placeholder implementation
      return true;
    });
  }

  /**
   * Sort data by specified key
   */
  sortData<T>(data: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Paginate data
   */
  paginateData<T>(data: T[], page: number, pageSize: number): {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = data.slice(start, end);
    
    return {
      data: paginatedData,
      total: data.length,
      page,
      pageSize,
      totalPages: Math.ceil(data.length / pageSize)
    };
  }
} 
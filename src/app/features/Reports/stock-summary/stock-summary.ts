import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface StockItem {
  item_code: string;
  item_name: string;
  category: string;
  unit: string;
  opening_stock: number;
  in_stock: number;
  out_stock: number;
  current_stock: number;
  reorder_level: number;
  cost_price: number;
  selling_price: number;
  stock_value: number;
}

@Component({
  selector: 'app-stock-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-summary.html',
  styleUrls: ['./stock-summary.scss']
})
export class StockSummary implements OnInit {
  items: StockItem[] = [];
  dateFrom: string = '';
  dateTo: string = '';
  searchTerm: string = '';
  selectedCategory: string = 'All';

  ngOnInit() {
    this.dateFrom = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    this.dateTo = new Date().toISOString().split('T')[0];
    this.generateData();
  }

  generateData() {
    // Mock data - to be replaced by API call
    this.items = [
      {
        item_code: 'ITM001',
        item_name: 'Laptop Dell XPS 13',
        category: 'Electronics',
        unit: 'PCS',
        opening_stock: 50,
        in_stock: 20,
        out_stock: 15,
        current_stock: 55,
        reorder_level: 10,
        cost_price: 3500,
        selling_price: 4200,
        stock_value: 192500
      },
      {
        item_code: 'ITM002',
        item_name: 'Office Chair',
        category: 'Furniture',
        unit: 'PCS',
        opening_stock: 30,
        in_stock: 10,
        out_stock: 8,
        current_stock: 32,
        reorder_level: 5,
        cost_price: 800,
        selling_price: 1200,
        stock_value: 25600
      },
      {
        item_code: 'ITM003',
        item_name: 'Printer Paper A4',
        category: 'Stationery',
        unit: 'BOX',
        opening_stock: 100,
        in_stock: 50,
        out_stock: 30,
        current_stock: 120,
        reorder_level: 20,
        cost_price: 25,
        selling_price: 35,
        stock_value: 3000
      },
      {
        item_code: 'ITM004',
        item_name: 'Coffee Machine',
        category: 'Appliances',
        unit: 'PCS',
        opening_stock: 15,
        in_stock: 5,
        out_stock: 12,
        current_stock: 8,
        reorder_level: 3,
        cost_price: 1200,
        selling_price: 1800,
        stock_value: 9600
      }
    ];
  }

  filterItems() {
    let filtered = this.items;
    
    if (this.selectedCategory !== 'All') {
      filtered = filtered.filter(item => item.category === this.selectedCategory);
    }
    
    if (this.searchTerm) {
      filtered = filtered.filter(item =>
        item.item_code.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.item_name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }

  getStockStatusClass(item: StockItem): string {
    if (item.current_stock <= item.reorder_level) return 'bg-danger text-white';
    if (item.current_stock <= item.reorder_level * 2) return 'bg-warning text-dark';
    return 'bg-success text-white';
  }

  getStockStatusText(item: StockItem): string {
    if (item.current_stock <= item.reorder_level) return 'Low Stock';
    if (item.current_stock <= item.reorder_level * 2) return 'Reorder Soon';
    return 'In Stock';
  }

  getCategories(): string[] {
    return ['All', ...new Set(this.items.map(item => item.category))];
  }

  calculateTotals() {
    const filteredItems = this.filterItems();
    return {
      total_items: filteredItems.length,
      total_stock_value: filteredItems.reduce((sum, item) => sum + item.stock_value, 0),
      low_stock_items: filteredItems.filter(item => item.current_stock <= item.reorder_level).length
    };
  }
} 
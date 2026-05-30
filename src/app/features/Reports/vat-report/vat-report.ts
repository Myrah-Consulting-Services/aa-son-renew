import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Represents the breakdown of VAT on sales for each emirate
interface VatOnSalesByEmirate {
  emirate: string;
  taxable_amount: number;
  vat_amount: number;
}

// Represents the complete VAT summary, structured like a UAE VAT return
interface VatReportSummary {
  sales_by_emirate: VatOnSalesByEmirate[];
  zero_rated_supplies: number;
  exempt_supplies: number;
  purchases_standard_rated: number;
  purchases_reverse_charge: number;
  total_output_vat: number;
  total_input_vat: number;
  net_vat_due: number;
}

@Component({
  selector: 'app-vat-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vat-report.html',
  styleUrls: ['./vat-report.scss']
})
export class VatReport implements OnInit {
  reportSummary: VatReportSummary | null = null;
  dateFrom: string = '';
  dateTo: string = '';

  ngOnInit() {
    this.dateFrom = this.getFirstDayOfMonth();
    this.dateTo = this.getLastDayOfMonth();
    this.fetchVatReport();
  }

  fetchVatReport() {
    // This will be replaced with an API call that returns a structured summary
    const outputVatOnSales = (50000 * 0.05) + (30000 * 0.05); // Sales in Dubai + Abu Dhabi
    const inputVatOnPurchases = (35000 * 0.05);
    
    this.reportSummary = {
      sales_by_emirate: [
        { emirate: 'Dubai', taxable_amount: 50000, vat_amount: 50000 * 0.05 },
        { emirate: 'Abu Dhabi', taxable_amount: 30000, vat_amount: 30000 * 0.05 },
        { emirate: 'Sharjah', taxable_amount: 0, vat_amount: 0 },
        { emirate: 'Ajman', taxable_amount: 0, vat_amount: 0 },
        { emirate: 'Umm Al Quwain', taxable_amount: 0, vat_amount: 0 },
        { emirate: 'Ras Al Khaimah', taxable_amount: 0, vat_amount: 0 },
        { emirate: 'Fujairah', taxable_amount: 0, vat_amount: 0 },
      ],
      zero_rated_supplies: 15000,
      exempt_supplies: 5000,
      purchases_standard_rated: 35000,
      purchases_reverse_charge: 0,
      total_output_vat: outputVatOnSales,
      total_input_vat: inputVatOnPurchases,
      net_vat_due: outputVatOnSales - inputVatOnPurchases,
    };
  }
  
  private getFirstDayOfMonth(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  private getLastDayOfMonth(): string {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  }
}

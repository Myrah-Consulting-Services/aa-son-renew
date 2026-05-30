import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Api } from '../../core/services/api';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Chart } from 'chart.js/auto';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule,CommonModule,FormsModule,ReactiveFormsModule, NgxEchartsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  providers:[
    DatePipe,
    {
      provide: NGX_ECHARTS_CONFIG,
      useFactory: () => ({ echarts: () => import('echarts') })
    }
  ]
})
export class Dashboard {
  reports: any;
  recent_transactions: any;
  totalItems: number = 0;
  itemsPerPage: number = 5;
  currentPage: number = 1;
  chart_data: any;
  weeklySales: { label: string; value: number; count: number }[] = [];
  maxSales: number = 0;
  // Chart layout
  chartWidth = 600;
  chartHeight = 220;
  marginLeft = 36;
  marginRight = 10;
  marginTop = 10;
  marginBottom = 30;
  start_date:any;
  end_date:any;
  filterType: string = 'weekly';
  expense_income: any;
  selectedDate: string = '';
  selectedMonth: string = '';
  selectedQuarter: string = '';
  selectedHalf: string = '';
  selectedYear: string = '';
  customStartDate: string = '';
  customEndDate: string = '';
  years: any
  private expenseIncomeChartRef: Chart | null = null;
  option: any = {};
  inv_code: any;
  currencies = [
    { id: 1, code: 'AED', name: 'AED - UAE Dirham' },
    { id: 2, code: 'USD', name: 'USD - US Dollar' },
    { id: 3, code: 'INR', name: 'INR - Indian Rupee' },
    { id: 4, code: 'EUR', name: 'EUR - Euro' },
    { id: 5, code: 'GBP', name: 'GBP - British Pound' },
    { id: 6, code: 'SAR', name: 'SAR - Saudi Riyal' },
    { id: 7, code: 'QAR', name: 'QAR - Qatari Riyal' },
    { id: 8, code: 'OMR', name: 'OMR - Omani Rial' },
    { id: 9, code: 'KWD', name: 'KWD - Kuwaiti Dinar' },
    { id: 10, code: 'BHD', name: 'BHD - Bahraini Dinar' },
    { id: 11, code: 'PKR', name: 'PKR - Pakistani Rupee' },
    { id: 12, code: 'BDT', name: 'BDT - Bangladeshi Taka' },
    { id: 13, code: 'LKR', name: 'LKR - Sri Lankan Rupee' },
    { id: 14, code: 'CNY', name: 'CNY - Chinese Yuan' },
    { id: 15, code: 'JPY', name: 'JPY - Japanese Yen' },
    { id: 16, code: 'CAD', name: 'CAD - Canadian Dollar' },
    { id: 17, code: 'AUD', name: 'AUD - Australian Dollar' },
    { id: 18, code: 'SGD', name: 'SGD - Singapore Dollar' },
    { id: 19, code: 'ZAR', name: 'ZAR - South African Rand' },
    { id: 20, code: 'TRY', name: 'TRY - Turkish Lira' },
    { id: 21, code: 'RUB', name: 'RUB - Russian Ruble' },
    { id: 22, code: 'CHF', name: 'CHF - Swiss Franc' },
    { id: 23, code: 'MYR', name: 'MYR - Malaysian Ringgit' },
    { id: 24, code: 'THB', name: 'THB - Thai Baht' },
    { id: 25, code: 'IDR', name: 'IDR - Indonesian Rupiah' },
    { id: 26, code: 'PHP', name: 'PHP - Philippine Peso' },
    { id: 27, code: 'HKD', name: 'HKD - Hong Kong Dollar' },
    { id: 28, code: 'KRW', name: 'KRW - South Korean Won' },
    { id: 29, code: 'SEK', name: 'SEK - Swedish Krona' },
    { id: 30, code: 'DKK', name: 'DKK - Danish Krone' },
    { id: 31, code: 'NOK', name: 'NOK - Norwegian Krone' },
    { id: 32, code: 'PLN', name: 'PLN - Polish Zloty' },
    { id: 33, code: 'CZK', name: 'CZK - Czech Koruna' },
    { id: 34, code: 'HUF', name: 'HUF - Hungarian Forint' },
    { id: 35, code: 'ILS', name: 'ILS - Israeli Shekel' },
    { id: 36, code: 'EGP', name: 'EGP - Egyptian Pound' },
    { id: 37, code: 'NGN', name: 'NGN - Nigerian Naira' },
    { id: 38, code: 'BRL', name: 'BRL - Brazilian Real' },
    { id: 39, code: 'MXN', name: 'MXN - Mexican Peso' },
    { id: 40, code: 'ARS', name: 'ARS - Argentine Peso' },
    { id: 41, code: 'COP', name: 'COP - Colombian Peso' },
    { id: 42, code: 'CLP', name: 'CLP - Chilean Peso' },
    { id: 43, code: 'NZD', name: 'NZD - New Zealand Dollar' },
    { id: 44, code: 'VND', name: 'VND - Vietnamese Dong' },
    { id: 45, code: 'TWD', name: 'TWD - Taiwan Dollar' },
    { id: 46, code: 'MAD', name: 'MAD - Moroccan Dirham' },
    { id: 47, code: 'JOD', name: 'JOD - Jordanian Dinar' },
    { id: 48, code: 'DZD', name: 'DZD - Algerian Dinar' },
    { id: 49, code: 'TND', name: 'TND - Tunisian Dinar' },
    { id: 50, code: 'KES', name: 'KES - Kenyan Shilling' },
    { id: 51, code: 'TZS', name: 'TZS - Tanzanian Shilling' },
    { id: 52, code: 'GHS', name: 'GHS - Ghanaian Cedi' },
    { id: 53, code: 'ETB', name: 'ETB - Ethiopian Birr' },
    { id: 54, code: 'UAH', name: 'UAH - Ukrainian Hryvnia' },
    { id: 55, code: 'BGN', name: 'BGN - Bulgarian Lev' },
    { id: 56, code: 'HRK', name: 'HRK - Croatian Kuna' },
    { id: 57, code: 'RON', name: 'RON - Romanian Leu' },
    { id: 58, code: 'ISK', name: 'ISK - Icelandic Krona' },
    { id: 59, code: 'KZT', name: 'KZT - Kazakhstani Tenge' },
    { id: 60, code: 'QAR', name: 'QAR - Qatari Riyal' },
    { id: 61, code: 'SAR', name: 'SAR - Saudi Riyal' },
    { id: 62, code: 'BHD', name: 'BHD - Bahraini Dinar' },
    { id: 63, code: 'OMR', name: 'OMR - Omani Rial' },
    { id: 64, code: 'KWD', name: 'KWD - Kuwaiti Dinar' },
    { id: 65, code: 'ZWL', name: 'ZWL - Zimbabwean Dollar' },
    { id: 66, code: 'BWP', name: 'BWP - Botswana Pula' }
  ];
  constructor(private router: Router,private api:Api,private datepipe:DatePipe) {
    this.getReports();
    this.getRecentTransactions();
    this.getChartData();
    this.getDates();
    const currentYear = new Date().getFullYear();
    this.years = Array.from({length: currentYear - 2019 + 5}, (_, i) => 2020 + i);
    console.log(this.start_date,this.end_date);
  }
  ngOnInit(){
    console.log('ngOnInit');
    this.getinvsettings();
    // this.api.getUsers().subscribe((res:any)=>{
    //   console.log('Users from dashboard:', res);
    // });
  }
  getinvsettings() {
    this.api.get('/invoice/get-invoice-setting/'+this.api.getUserCompany()+'/').subscribe((res: any) => {
      if(res.status == 200){
        if(res.data.default_currency){
          const c = this.currencies.filter((item:any) => item.id == res.data.default_currency);
          this.inv_code = c[0].code;
          localStorage.setItem('inv_code',JSON.stringify(this.inv_code));

          console.log(c);
          
          const b = this.currencies.filter((item:any) => item.id == res.data.curency_conversion);
           const a=b[0].code;
          localStorage.setItem('selected_currency',JSON.stringify(a));
        }
       console.log(this.api.getcurrencies());
      }
    });
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
  getDates(){
    const today = new Date();
    
    switch (this.filterType) {
      case 'weekly':
        // Fix weekly calculation - get last 7 days from today
        const weekStartDate = new Date(today);
        weekStartDate.setDate(today.getDate() - 7);
        const weekEndDate = new Date(today);
        weekEndDate.setDate(today.getDate() + 7);
        
        this.start_date = this.formatDate(weekStartDate);
        this.end_date = this.formatDate(weekEndDate);
        this.selectedDate = '';
        break;
        
      case 'monthly':
        if (!this.selectedMonth) {
          const currentMonth = today.getMonth() + 1;
          const currentYear = today.getFullYear();
          this.selectedMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        }
        
        const [year, month] = this.selectedMonth.split('-').map(Number);
        const start_date = new Date(year, month - 1, 1);
        const end_date = new Date(year, month, 0);
        
        this.start_date = this.formatDate(start_date);
        this.end_date = this.formatDate(end_date);
        this.selectedDate = this.selectedMonth;
        break;
        
      case 'quarterly':
        if (!this.selectedQuarter || !this.selectedYear) {
          const quarter = Math.floor(today.getMonth() / 3) + 1;
          const quarterStartMonth = (quarter - 1) * 3 + 1;
          const quarterEndMonth = quarter * 3;
          this.selectedQuarter = `${quarterStartMonth.toString().padStart(2, '0')}-${quarterEndMonth.toString().padStart(2, '0')}`;
          this.selectedYear = today.getFullYear().toString();
        }
        
        const [startMonth, endMonth] = this.selectedQuarter.split('-').map(Number);
        const quarterStartDate = new Date(parseInt(this.selectedYear), startMonth - 1, 1);
        const quarterEndDate = new Date(parseInt(this.selectedYear), endMonth, 0);
        
        this.start_date = this.formatDate(quarterStartDate);
        this.end_date = this.formatDate(quarterEndDate);
        this.selectedDate = `${this.selectedYear}-Q${this.selectedQuarter}`;
        break;
        
      case 'half_yearly':
        if (!this.selectedHalf || !this.selectedYear) {
          const half = today.getMonth() < 6 ? 'H1' : 'H2';
          this.selectedHalf = half;
          this.selectedYear = today.getFullYear().toString();
        }
        
        // Calculate end date as today
        const halfYearEndDate = new Date();
        
        // Calculate start date as 6 months before today
        const halfYearStartDate = new Date();
        halfYearStartDate.setMonth(halfYearEndDate.getMonth() - 6);
        
        this.start_date = this.formatDate(halfYearStartDate);
        this.end_date = this.formatDate(halfYearEndDate);
        this.selectedDate = `${this.selectedYear}-${this.selectedHalf}`;
        break;
        
        case 'yearly':
          console.log('Yearly case - selectedYear:', this.selectedYear);
          if (!this.selectedYear) {
            this.selectedYear = today.getFullYear().toString();
          }
          
          // Handle both single year (2020) and range format (2020-2021)
          let startYear: number;
          if (this.selectedYear.includes('-')) {
            startYear = parseInt(this.selectedYear.split('-')[0]);
          } else {
            startYear = parseInt(this.selectedYear);
          }
          
          console.log('Parsed startYear:', startYear);
          
          // UAE Financial Year: January 1st to December 31st
          const yearStartDate = new Date(startYear, 0, 1);  // January 1st
          const yearEndDate = new Date(startYear, 11, 31);  // December 31st
          
          console.log('Year start date:', yearStartDate);
          console.log('Year end date:', yearEndDate);
          
          this.start_date = this.formatDate(yearStartDate);
          this.end_date = this.formatDate(yearEndDate);
          this.selectedDate = this.selectedYear;
          break;
        
      case 'date':
        if (!this.selectedDate) {
          this.selectedDate = this.formatDate(today);
        }
        this.start_date = this.selectedDate;
        this.end_date = this.selectedDate;
        break;
        
      case 'custom':
        if (!this.customStartDate || !this.customEndDate) {
          this.customStartDate = this.formatDate(today);
          this.customEndDate = this.formatDate(today);
        }
        
        if (this.customStartDate && this.customEndDate) {
          this.selectedDate = `${this.customStartDate}_${this.customEndDate}`;
          this.start_date = this.customStartDate;
          this.end_date = this.customEndDate;
        } else {
          return;
        }
        break;
    }
    console.log(this.start_date,this.end_date,'op');
    this.getExpenseIncome();
  }
  formatDate(date: Date): string {
    const offset = date.getTimezoneOffset();
    const adjusted = new Date(date.getTime() - offset * 60 * 1000);
    return adjusted.toISOString().split('T')[0];
  }
  getReports() {
    this.api.post('/reports/dashboard/',{company:this.api.getCompanyId()}).subscribe((res:any)=>{
      if(res.status == 200){
        this.reports = res.data.dashboard_data;
      }
    });
  }
  getRecentTransactions() {
    // /reports/recent-transactions/
    this.api.post('/reports/recent-transactions/',{company:this.api.getCompanyId(),
      limit:this.itemsPerPage,
      page:this.currentPage
    }).subscribe((res:any)=>{
      if(res.status == 200){
        this.recent_transactions = res.data.transactions;
      }
    });
  }
  getChartData() {
    this.api.post('/reports/get_weekly_sales/1/',{company:this.api.getCompanyId()}).subscribe((res:any)=>{
      if(res.status == 200){
        this.chart_data = res.data;
        const rows: any[] = Array.isArray(this.chart_data) ? this.chart_data : (this.chart_data ? [this.chart_data] : []);
        this.weeklySales = rows.map((r: any) => {
          let label = r?.weekday || r?.invoice_date || '';
          // Format weekday to show abbreviation (e.g., "Friday" -> "Fri")
          if (label && label.length > 3) {
            const weekdayMap: { [key: string]: string } = {
              'Monday': 'Mon',
              'Tuesday': 'Tue',
              'Wednesday': 'Wed',
              'Thursday': 'Thu',
              'Friday': 'Fri',
              'Saturday': 'Sat',
              'Sunday': 'Sun'
            };
            label = weekdayMap[label] || label.substring(0, 3);
          }
          return {
            label: label,
            value: Number(r?.total_day_sales || 0),
            count: Number(r?.invoice_count || 0)
          };
        });
        this.maxSales = this.weeklySales.reduce((m, it) => Math.max(m, it.value), 0) || 1;
      }
    });
  }
  getExpenseIncome() {
    
    let data={
      type:this.filterType,
      start_date:this.start_date,
      end_date:this.end_date
    }
    this.api.post('/reports/get_expense_income/1/',data).subscribe((res:any)=>{
      if(res.status == 200){
        const chartData = [
          ['Date', 'Total Income', 'Total Expense'],
          ...res.data.map((item: { day: any; date: any; total_income: any; total_expense: any; }) => [
            item.date || item.day, 
            item.total_income || 0, 
            item.total_expense || 0
          ])
        ];
        
        // Get max value for Y axis
        const maxValue = Math.max(
          ...res.data.map((item: any) => Math.max(item.total_income || 0, item.total_expense || 0)),
          1
        );
        
        this.option = {
          legend: { 
            show: false
          },
          tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
              let result = params[0].name + '<br/>';
              params.forEach((param: any) => {
                result += param.marker + param.seriesName + ': ' + this.getcurrency() + ' ' + this.formatNumber(param.value) + '<br/>';
              });
              return result;
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: { 
            type: 'category',
            boundaryGap: true,
            data: res.data.map((item: any) => item.date || item.day)
          },
          yAxis: {
            type: 'value',
            min: 0,
            max: maxValue > 0 ? maxValue : 1,
            splitNumber: 5,
            axisLabel: {
              formatter: (value: number) => this.formatChartValue(value)
            }
          },
          series: [{
            type: 'bar',
            name: 'Total Income',
            data: res.data.map((item: any) => item.total_income || 0),
            itemStyle: {
              color: '#4caf50'
            }
          },
          {
            type: 'bar',
            name: 'Total Expense',
            data: res.data.map((item: any) => item.total_expense || 0),
            itemStyle: {
              color: '#f44336'
            }
          }],
          color: ['#4caf50', '#f44336']
        };
      }
    });
  }
  createExpenseIncomeChart() {
    const ctx = document.getElementById('expenseIncomeChart') as HTMLCanvasElement;
    if (!ctx) return;
    if (this.expenseIncomeChartRef) {
      this.expenseIncomeChartRef.destroy();
    }
    this.expenseIncomeChartRef = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: (this.expense_income || []).map((item:any) => item.day),
        datasets: [
          {
            label: 'Total Income',
            data: (this.expense_income || []).map((item:any) => item.total_income || 0),
            backgroundColor: '#4CAF50',
            borderColor: '#4CAF50',
            borderWidth: 1
          },
          {
            label: 'Total Expense',
            data: (this.expense_income || []).map((item:any) => item.total_expense || 0),
            backgroundColor: '#F44336',
            borderColor: '#F44336',
            borderWidth: 1
          },
          // {
          //   label: 'Total Profit',
          //   data: (this.expense_income || []).map((item:any) => item.total_profit || 0),
          //   backgroundColor: '#000000',
          //   borderColor: '#000000',
          //   borderWidth: 1
          // }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
  // Computed line path and helpers
  get innerWidth(): number { return this.chartWidth - this.marginLeft - this.marginRight; }
  get innerHeight(): number { return this.chartHeight - this.marginTop - this.marginBottom; }
  get points(): { x: number; y: number; label: string; value: number }[] {
    if (!this.weeklySales?.length) return [];
    const stepX = this.innerWidth / Math.max(1, this.weeklySales.length - 1);
    return this.weeklySales.map((d, i) => {
      const x = this.marginLeft + (i * stepX);
      const v = d.value;
      const y = this.marginTop + (this.innerHeight * (1 - (this.maxSales ? (v / this.maxSales) : 0)));
      return { x, y, label: d.label, value: v };
    });
  }
  get salesPathD(): string {
    const pts = this.points;
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }
  get yTicks(): number[] {
    const ticks = 4;
    const arr: number[] = [];
    for (let i = 0; i <= ticks; i++) arr.push(Math.round((this.maxSales * i) / ticks));
    return arr;
  }
  onPageChanged(event: any) {
    this.currentPage = event.page;
    this.itemsPerPage = event.itemsPerPage;
    this.getRecentTransactions();
  }
  
  formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '0.000';
    }
    const num = parseFloat(value);
    if (isNaN(num)) {
      return '0.000';
    }
    return num.toFixed(3);
  }
  
  formatChartValue(value: number): string {
    if (value === 0) return '0';
    if (this.maxSales <= 1) {
      return value.toFixed(1);
    }
    // For larger values, show as decimal if needed
    if (value < 1) {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  }
}

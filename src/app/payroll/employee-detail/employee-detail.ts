import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Api } from '../../core/services/api';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-detail',
  imports: [CommonModule,FormsModule],
  templateUrl: './employee-detail.html',
  styleUrl: './employee-detail.scss'
})
export class EmployeeDetail {
  @Input() for_emit: any;
  @Input() modalRef: any;
  calendarDays: any[] = [];
  currentMonth: any;
  Math=Math
  
  // Attendance data
  attendanceData: any[] = [];
  attendanceSummary: any = {};
  pageSize: number=10;
  currentPage: number=1;
  totalPages: number=0;
  constructor(private api:Api){}
  ngOnInit(): void {
    console.log(this.for_emit,'for emit');
    this.currentMonth=this.for_emit.selectedMonth
    // this.generateCalendar();
    this.loadAttendanceData();
  }
  generateCalendar() {
    this.calendarDays = [];
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    // Set start day to the first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Fill in empty days at the start of the month for correct alignment
    for (let i = 0; i < firstDay.getDay(); i++) {
      this.calendarDays.push(null);
    }

    // Fill in each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      this.calendarDays.push(new Date(year, month, day));
    }
  }

  // Generate PDF method
  generatePDF(): void {
    console.log('Generating PDF...');
    // Implement PDF generation logic here
    alert('PDF generation feature will be implemented soon!');
  }

  // Load attendance data
  loadAttendanceData(): void {
    if (this.for_emit && this.for_emit.data) {
      this.attendanceData = this.for_emit.data;
      this.attendanceSummary = this.for_emit.summary;

      // Implement pagination
      this.pageSize = 10; // Number of rows per page
      this.currentPage = 1;
      this.totalPages = Math.ceil(this.attendanceData.length / this.pageSize);
    }
  }
  onMonthChange(selectedMonth?: string) {
    // If called from template, for_emit.month is already updated
    console.log(selectedMonth);
    
    const monthStr = selectedMonth || this.for_emit?.month;
    if (!monthStr) return;

    // Parse month string (e.g., "2024-06" or "Jun 2024")
    let year: string, month: string;
    if (/^\d{4}-\d{2}$/.test(monthStr)) {
      // Format: YYYY-MM
      [year, month] = monthStr.split('-');
    } else {
      // Try to parse "Jun 2024" or similar
      const parts = monthStr.split(' ');
      if (parts.length === 2) {
        const date = new Date(`${parts[0]} 1, ${parts[1]}`);
        year = date.getFullYear().toString();
        month = (date.getMonth() + 1).toString().padStart(2, '0');
      } else {
        // Fallback: use current month
        const now = new Date();
        year = now.getFullYear().toString();
        month = (now.getMonth() + 1).toString().padStart(2, '0');
      }
    }

    // Calculate start and end date for the selected month
    const startDate = `${year}-${month}-01`;
    const endDateObj = new Date(Number(year), Number(month), 0); // 0th day of next month = last day of this month
    const endDate = `${year}-${month}-${endDateObj.getDate().toString().padStart(2, '0')}`;

    // Prepare payload for API
    const for_emit = {
      start_date: startDate,
      end_date: endDate,
      employee_id: this.for_emit?.employee_id?.employee_id || this.for_emit?.employee_id || this.for_emit?.employee_info.employee_id,
      company_id: this.api.getCompanyId(),
    };

    this.api.post('/attendance/get-employee-attendance/', for_emit).subscribe((res: any) => {
      if (res.data) {
        this.for_emit = res;
        this.for_emit.employee_id = for_emit.employee_id;
        this.attendanceData = res.data;
        this.attendanceSummary = res.summary;
        this.pageSize = 10;
        this.currentPage = 1;
        this.totalPages = Math.ceil(this.attendanceData.length / this.pageSize);
      }
    });
  }
  // employedetail(a: any, b: any) {
  //   // get_employee
  //   let for_emit = {
  //     "start_date": this.start_date,
  //     "end_date": this.end_date,
  //     "employee_id": b.employee_id,
  //     "company_id": this.api.getCompanyId(),
  //     // "date":this.date

  //   }
  //   this.api.post('/attendance/get-employee-attendance/', for_emit).subscribe((res: any) => {
  //     console.log(res, 'success');
  //     if (res.status == 200) {
  //       this.for_emit = res
  //       this.for_emit.employee_id = b
      
  //       // this.attendanceSummary=res.summary
  //       this.for_emit = res
  //     }

  //   })
  // }
  // Get status badge class for styling
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'P':
        return 'bg-success';
      case 'A':
        return 'bg-danger';
      case 'L':
        return 'bg-warning';
      case 'S':
        return 'bg-info';
      case 'C':
        return 'bg-primary';
      case 'W':
        return 'bg-secondary';
      case 'CO':
        return 'bg-dark';
      case 'H':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }
}

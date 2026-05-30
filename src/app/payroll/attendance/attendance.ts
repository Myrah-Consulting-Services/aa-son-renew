import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { EmployeeDetail } from '../employee-detail/employee-detail';
import { ImportAttendance } from '../import-attendance/import-attendance';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    EmployeeDetail,
    ImportAttendance
  ],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.scss']
})
export class Attendance implements OnInit {
  isAttendanceEnabled: boolean = false; // Initialize as disabled
  date = new FormControl(new Date());
  modifiedEmployees: any[] = [];
  displayedColumns: string[] = [];

  // Table data
  filteredDataSource: any[] = [];
  daysInMonth: any[] = [];
  attendanceData: any[]=[];

  // Pagination
  totalData: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;

  attendanceStatuses = [
    { value:'-', display: '-' },
    { value:'P', display: 'P' },
    { value:'A', display: 'A' },
    { value:'L', display: 'L' },
    { value:'H', display: 'H' },
    { value:'C', display: 'C' },
    { value:'S', display: 'S' },
    { value:'W', display: 'W' },
    { value:'CO',display: 'CO' },

  ];
  months: { value: string; display: string; }[] | undefined;
  selectedMonth: string | undefined;
  // Modal data
  modalRef: any = null;
  for_emit: any = null;

  // Search and filtering
  searchTerm: string = '';
  selectedEmployee: any = null;
  employeeLeaveBalance: any[] = [];
  start_date: any;
  end_date: any;
  pagination: any;
  limit: any;
  totalPages: any;
  pageNumber: any;
  nextPage: any;
  previousPage: any;
  openDropdowns: any = {};
  Math = Math
  // Invoice/attendance mode
  invoiceMode: any;
  hourOptions: any[] = [
    // Daily attendance options
    { id: '', value: '-', display: '-'},
    { id: 2, value: 'A', display: 'A' },
    { id: 4, value: 'L', display: 'L' },
    { id: 8, value: 'H', display: 'H' },
    { id: 5, value: 'C', display: 'C'},
    { id: 6, value: 'S', display: 'S' },
    { id: 3, value: 'W', display: 'W' },
    { id: 7, value: 'CO', display: 'CO'},
    // Hourly attendance options
    { id: 11, value: '1h', display: '1h'},
    { id: 12, value: '2h', display: '2h'},
    { id: 13, value: '3h', display: '3h' },
    { id: 14, value: '4h', display: '4h'},
    { id: 15, value: '5h', display: '5h'},
    { id: 16, value: '6h', display: '6h'},
    { id: 17, value: '7h', display: '7h' },
    { id: 18, value: '8h', display: '8h' },
    { id: 19, value: '9h', display: '9h'},
    { id: 20, value: '10h', display: '10h'},
    { id: 21, value: '11h', display: '11h' },
    { id: 22, value: '12h', display: '12h'},
  ];

  /**
   * Returns hour options filtered by current invoiceMode.
   * Use this in HTML as: *ngFor="let hr of getHourOptions()"
   */

  settings: any;
  constructor(
    private modalService: NgbModal,
    private api: Api,
    private http: HttpClient,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.getsetting()
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = ('0' + (currentDate.getMonth() + 1)).slice(-2); // Get current month in "MM" format
    this.selectedMonth = `${currentYear}-${currentMonth}`;
    // const currentYear = new Date().getFullYear();
    this.months = this.generateMonthsForRange(1900, 2100);
    this.onMonthSelect(this.selectedMonth);

    // this.displayedColumns = ['name', ...this.daysInMonth.map(day => day.displayDate), 'totalPresent', 'totalAbsent', 'totalHoliday', 'totalRestDay'];
    this.displayedColumns = ['name', ...this.daysInMonth.map(day => day.displayDate), 'totalPresent', 'totalAbsent', 'totalWeekOff', 'totalLate', 'totalCausalLeave'
      , 'totalSickLeave', 'totalCompensatoryOff', 'totalHalfDay'
    ];

  }
  getsetting(){
    this.api.post('/attendance/list-payroll-settings/',{company:this.api.getCompanyId()}).subscribe((res:any)=>{
      if(res.status==200){
        this.settings=res.data[0]
        this.invoiceMode=this.settings.attendance_mode
      }
    })
  }

  toggleAttendance() {
    this.isAttendanceEnabled = !this.isAttendanceEnabled;
  }
  modalClosed() {
    this.modalRef.close();
  }
  importattendannce(add: any) {
    this.modalRef = this.modalService.open(add, {
      windowClass: 'my-class',
      centered: true,
      backdrop: 'static',
      keyboard: false,
    } as any);

  }
  setMonthAndYear(normalizedMonthAndYear: any, datepicker: any) {
    // Removed moment.js dependency - simplified date handling
    const selectedMonthYear = normalizedMonthAndYear;
    this.selectedMonth = selectedMonthYear;
    this.onMonthSelect(selectedMonthYear);
  }
  attendancereport() {
    let a = {
      // "start_date": this.start_date,
      // "end_date": this.end_date,
      "pagination": true,
      "company_id": 1,
      "month": Number(this.selectedMonth?.split('-')[1]),
      "year": Number(this.selectedMonth?.split('-')[0]),
      "page_number":this.pageNumber,
      "limit":this.pageSize,
      "keyw":this.searchTerm
    }
    // all_employee_attendance/<str:keyw>/
    this.api.post('/attendance/all-employee-attendance/', a).subscribe((response: any) => {
      // this.displayedColumns = ['id', 'name',...Object.keys(res.data[0].attendance)];
      this.pagination = response.pagination_data
      this.totalData = response.pagination_data.total_data;
      this.limit = response.pagination_data.limit;
      this.totalPages = response.pagination_data.total_pages;
      this.pageNumber = response.pagination_data.page_number;
      if(this.invoiceMode==='hourly'){
        // Fix: Properly map and assign attendanceData for hourly mode
        this.attendanceData = response.data.map((element: any) => {
          // Clone the element to avoid mutating the original
          const newElement = { ...element };
          // Map attendance values to hour option IDs
          newElement.attendance = Object.fromEntries(
            Object.entries(element.attendance).map(([date, value]) => {
              const valueStr = typeof value === 'string' ? value : '';
              // const hours = parseInt(valueStr.replace("h", ""), 10);
              const option = this.hourOptions.find(item => item.value == valueStr);              
              return [date, option ? option.id : ''];
            })
          );
          return newElement;

        });
        
      }else{
        this.attendanceData = response.data;
      }
      console.log(this.totalData, 'this.totalData', this.limit, 'this.limit', this.totalPages, 'this.totalPages',
        this.pageNumber, 'this.pageNumber ', this.nextPage, 'this.nextPage,', this.previousPage, this.pagination, 'this.pagination'
      );

    })
  }




  getFormattedDaysInMonth(year: number, month: number): { displayDate: string, originalDate: string }[] {
    // Correctly get the total days for the specified month
    const daysInMonth = new Date(year, month, 0).getDate(); // This line is correct
    // console.log('daysInMonth',daysInMonth);

    const days: { displayDate: string, originalDate: string }[] = [];
    // console.log('daysInMonth1',days);
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      // console.log(date,'date123');
      // Adjust for zero-based index (month - 1)
      const dayOfWeek = date.toLocaleString('en-us', { weekday: 'short' });
      // console.log(dayOfWeek,date.toISOString(),'dayOfWeek123');

      const formattedDay = `${i} ${dayOfWeek}`;
      // console.log(formattedDay,'formattedDay123');
      // const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      // const originalDate = adjustedDate.toISOString().slice(0, 10); // "YYYY-MM-DD" format
      const originalDate = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      // console.log(originalDate,'originalDate123');
      days.push({ displayDate: `${i} ${dayOfWeek}`, originalDate });
      // console.log(days,'1234');

    }

    return days;
  }
  onPageChange(event: any) {
    this.limit = event.pageSize;
    this.pageNumber = event.pageIndex ;
    this.currentPage=this.pageNumber
    // this.pageNumber++
    let a = {
      "start_date": this.start_date,
      "end_date": this.end_date,
      limit: this.limit, page_number: this.pageNumber+1, pagination: true,
      "company_id": this.api.getCompanyId(),
    }
    this.api.post('/attendance/all-employee-attendance/', a).subscribe((response: any) => {
      if(this.invoiceMode==='hourly'){
        // Fix: Properly map and assign attendanceData for hourly mode
        this.attendanceData = response.data.map((element: any) => {
          // Clone the element to avoid mutating the original
          const newElement = { ...element };
          // Map attendance values to hour option IDs
          newElement.attendance = Object.fromEntries(
            Object.entries(element.attendance).map(([date, value]) => {
              const valueStr = typeof value === 'string' ? value : '';
              // const hours = parseInt(valueStr.replace("h", ""), 10);
              const option = this.hourOptions.find(item => item.value == valueStr);              
              return [date, option ? option.id : ''];
            })
          );
          return newElement;

        });
        
      }else{
        this.attendanceData = response.data;
      }
      // this.totalData = response.pagination_data.total_data;
      this.pagination = response.pagination_data

    })
  }

  generateMonthsForRange(startYear: number, endYear: number): { value: string, display: string }[] {
    const monthsArray = [];

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        const date = new Date(year, month);
        const value = `${year}-${('0' + (month + 1)).slice(-2)}`; // Format: YYYY-MM
        const display = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g., "Aug 2024"
        monthsArray.push({ value, display });
      }
    }

    return monthsArray;
  }
  onMonthSelect(selectedMonth: any) {
    console.log(selectedMonth, 'selected');

    const [year, month] = selectedMonth.split('-');

    // Start date for the month
    const startDate = `${year}-${month}-01`;
    const date = new Date(year, month - 1, 1);

    // Set the date to the next month's 0th day
    date.setMonth(date.getMonth() + 1, 0);

    // Get the day of the month
    const a = date.getDate();

    // Return the end date in YYYY-MM-DD format
    const endDate = `${year}-${(month).toString().padStart(2, '0')}-${a.toString().padStart(2, '0')}`
    this.start_date = startDate;
    this.end_date = endDate;

    // Generating days in the month for display
    this.daysInMonth = this.getFormattedDaysInMonth(year, month);
    this.displayedColumns = ['name', ...this.daysInMonth.map(day => day.displayDate), 'totalPresent', 'totalAbsent', 'totalWeekOff', 'totalLate', 'totalCausalLeave'
      , 'totalSickLeave', 'totalCompensatoryOff', 'totalHalfDay'
    ];
    // console.log(this.displayedColumns,"check1");

    setTimeout(() => {
      this.attendancereport()
    }, 500);

  }
  ensureDefaultAttendance(employee: any, originalDate: string) {
    // If the value is null or undefined, set it to the default ('-')
    if (employee.attendance[originalDate] == null || employee.attendance[originalDate] === '') {
      employee.attendance[originalDate] = '-';  // Default value
    }
  }
  employedetail(a: any, b: any) {
    // get_employee
    let for_emit = {
      "start_date": this.start_date,
      "end_date": this.end_date,
      "employee_id": b.employee_id,
      "company_id": this.api.getCompanyId(),
      // "date":this.date

    }
    this.api.post('/attendance/get-employee-attendance/', for_emit).subscribe((res: any) => {
      console.log(res, 'success');
      if (res.status == 200) {
        this.for_emit = res
        this.for_emit.selectedMonth=this.selectedMonth
        this.for_emit.employee_id = b
        this.modalRef = this.modalService.open(a, {
          windowClass: 'my-class',
          centered: true,
          backdrop: 'static',
          keyboard: false,
        } as any);
        // this.attendanceSummary=res.summary
        this.for_emit = res
      }

    })
  }
  filterEmployees(): void {
    if (this.searchTerm == '' || this.searchTerm == null) {
      this.attendanceData = this.attendanceData
    }else{
    this.attendanceData = this.attendanceData.filter((employee: any) =>   
      employee.employee_name.toLowerCase().includes(this.searchTerm.toLowerCase())
      || employee.employee_id.toString().includes(this.searchTerm)
    );
  }
  }
  getCellClasses(employee: any, date: string): { [key: string]: boolean } {
    if(this.invoiceMode=='Daily'){
    const attendanceClass = this.getAttendanceClass(employee.attendance[date]);
    return {
      [attendanceClass]: !!attendanceClass,  // Apply if attendanceClass is not empty
      'disabled-cell': !this.isAttendanceEnabled
    };
  }else{
    return {
      
    }
  }
  }
  getAttendanceClass(attendanceValue: string): string {
    switch (attendanceValue) {
      case 'P':
        return 'present-color';
      case 'A':
        return 'absent-color';
      case 'W':
        return 'weekend-color';
      case 'L':
        return 'late-color';
      case 'C':
        return 'casual-color';
      case 'S':
        return 'sick-color';
      case 'CO':
        return 'comp-color';
      case 'H':
        return 'half-color';
      default:
        return ''; // No specific class for other values
    }
  }

  toggleDropdown(column: string, employeeId: number): void {
    const key = `${employeeId}-${column}`;
    // Toggle the dropdown for the specific employee and day
    this.openDropdowns[key] = !this.openDropdowns[key];
  }

  // Check if the dropdown is open for a specific employee and day
  isDropdownOpen(column: string, employeeId: number): boolean {
    const key = `${employeeId}-${column}`;
    console.log(key);

    return this.openDropdowns[key] || false; // Return false if not open
  }



  // Hourly attendance change
  onHoursChange(employee: any, date: string, event: any) {
    if (!this.isAttendanceEnabled) {
      alert('Please enable attendance updates first.');
      return;
    }
    const hours = Number(event.target.value || 0);
    if (!employee.hours) employee.hours = {};
    employee.hours[date] = hours;
    // Mark attendance as Present for hourly selection
    // if (!employee.attendance) employee.attendance = {};
    // employee.attendance[date] = hours > 0 ? 'P' : '-';
    console.log(hours);
    
    // Track modification
    const idx = this.modifiedEmployees.findIndex(e => e.employee_id === employee.employee_id);
    if (idx === -1) {
      this.modifiedEmployees.push({
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        attendance: { [date]: hours },
        // hours: { [date]: hours }
      });
    } else {
      const mod = this.modifiedEmployees[idx];
      if (!mod.attendance) mod.attendance = {};
      if (!mod.hours) mod.hours = {};
      mod.attendance[date] = hours; // present code
      mod.hours[date] = hours;
    }
  }

  update() {
    // console.log(this.modifiedEmployees, 'for emit');
    // convert attendance value to display value
    // let a=[  { display: 9, value: '-' },
    //   { display: 1, value: 'P' },
    //   { display: 2, value: 'A' },
    //   { display: 5, value: 'C' },
    //   { display: 8, value: 'H' },
    //   { display: 4, value: 'L' },
    //   { display: 6, value: 'S' },
    //   { display: 3, value: 'W' },
    //   { display: 7, value: 'CO' },]
    // this.modifiedEmployees.forEach((employee: any) => {
    //   employee.attendance = Object.fromEntries(
    //     Object.entries(employee.attendance).map(([date, value]) => [date, a.find(item => item.value === value)?.display])
    //   );
    // });
    console.log(this.modifiedEmployees, 'for emit');
    let confirmmsg = "Confirm to change the attendance status?"
    if (confirm(confirmmsg)) {
      this.api.post('/attendance/attendance-update-create/',
        this.modifiedEmployees
      ).subscribe((res: any) => {
        console.log(res, 'jkk');
        if (res.status == 200) {
          this.attendancereport()
          this.toggleAttendance()
          this.toast.show("Attendance updated successfully", 'success')
        }
      })
    } else {
      this.toggleAttendance()
      this.attendancereport()
    }
  }
  onAttendanceChange(employee: { employee_id: any; employee_name: any; }, date: any, newStatus: any) {
    const index = this.modifiedEmployees.findIndex(e => e.employee_id === employee.employee_id);
    let a=[  { display: 9, value: '-' },
      { display: 1, value: 'P' },
      { display: 2, value: 'A' },
      { display: 4, value: 'L' },
      { display: 8, value: 'H' },
      { display: 5, value: 'C' },
      { display: 6, value: 'S' },
      { display: 3, value: 'W' },
      { display: 7, value: 'CO' },
      { display: 9, value: 'U' },
      { display: 10, value: 'A' },
    ]
      let selected = a.find(item => item.value == newStatus.target.value);
    if (index === -1) {
      this.modifiedEmployees.push({
        employee_id: employee.employee_id,
        employee_name: employee.employee_name,
        attendance: {
          [date]: selected?.display // Track only the modified date and new status
        }
      });
    } else {
      // If the employee is already in the modified list, update the date
      const modifiedEmployee = this.modifiedEmployees[index];
      
      if (!modifiedEmployee.attendance) {
        modifiedEmployee.attendance = {};
      }
      
      modifiedEmployee.attendance[date] = selected?.display; // Update only the changed date
    }
  }

  // Missing methods for HTML template
  saveAttendance(): void {
    this.update();
  }
  getTotalPresent(): number {
    return this.attendanceData?.reduce((total: number, emp: any) => total + (emp.totalPresent || 0), 0) || 0;
  }

  getTotalAbsent(): number {
    return this.attendanceData?.reduce((total: number, emp: any) => total + (emp.totalAbsent || 0), 0) || 0;
  }

  getTotalLate(): number {
    return this.attendanceData?.reduce((total: number, emp: any) => total + (emp.totalLate || 0), 0) || 0;
  }

  getTotalLeaves(): number {
    return this.attendanceData?.reduce((total: number, emp: any) =>
      total + (emp.totalCausalLeave || 0) + (emp.totalSickLeave || 0), 0) || 0;
  }

  getTotalWeekends(): number {
    return this.attendanceData?.reduce((total: number, emp: any) => total + (emp.totalWeekOff || 0), 0) || 0;
  }

  getAttendanceCellClass(status: string): string {
    switch (status) {
      case 'P': return 'present-cell';
      case 'A': return 'absent-cell';
      case 'L': return 'late-cell';
      case 'W': return 'weekend-cell';
      case 'C': return 'casual-cell';
      case 'S': return 'sick-cell';
      case 'CO': return 'comp-cell';
      case 'H': return 'half-cell';
      default: return '';
    }
  }

  getDayName(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  }

  isWeekend(date: string): boolean {
    // Default to 5 working days per week if not set
    const workingDays = this.settings?.working_days_per_week || 5;
    const day = new Date(date).getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

    // Map working days per week to weekend days
    // 5 working days: weekend = Saturday (6), Sunday (0)
    // 6 working days: weekend = Sunday (0)
    // 4 working days: weekend = Friday (5), Saturday (6), Sunday (0)
    // 3 working days: weekend = Thursday (4), Friday (5), Saturday (6), Sunday (0)
    // 7 working days: no weekend
    // You can expand this logic as needed

    if (workingDays === 7) {
      return false; // No weekends
    } else if (workingDays === 6) {
      return day === 0; // Only Sunday
    } else if (workingDays === 5) {
      return day === 0 || day === 6; // Saturday & Sunday
    } else if (workingDays === 4) {
      return day === 0 || day === 5 || day === 6; // Friday, Saturday, Sunday
    } else if (workingDays === 3) {
      return day === 0 || day === 4 || day === 5 || day === 6; // Thursday, Friday, Saturday, Sunday
    } else {
      // Fallback: treat Saturday & Sunday as weekend
      return day === 0 || day === 6;
    }
  }

  getAttendanceBadgeClass(status: string): string {
    let statusValue = status.toString();
      // For both id==1 and value=='P', return the same class
      // We'll check if the status is 'P' or '1' (string or number), or if it matches the hourOptions with id==1 or value=='P'
      // But from your hourOptions, there is no id:1, so let's check for value 'P' and id 1 (if ever present)
      // We'll also check if the status is a number and matches id 1
      {
        // Try to find the hourOption by id or value
        let matchedOption = this.hourOptions.find(opt => 
          opt.id == status || opt.value == status
        );
        // If found, use the value to determine the class
        if (matchedOption) {
          switch (matchedOption.value) {
            case 'P': return 'badge bg-success';
            case 'A': return 'badge bg-danger';
            case 'L': return 'badge bg-warning';
            case 'W': return 'badge bg-secondary';
            case 'C': return 'badge bg-info';
            case 'S': return 'badge bg-primary';
            case 'CO': return 'badge bg-dark';
            case 'H': return 'badge bg-warning text-dark';
            case '1h': return 'badge bg-warning';
            case '2h': return 'badge bg-success';
            case '3h': return 'badge bg-success';
            case '4h': return 'badge bg-success';
            case '5h': return 'badge bg-success';
            case '6h': return 'badge bg-warning';
            case '7h': return 'badge bg-warning';
            case '8h': return 'badge bg-success';
            case '9h': return 'badge bg-danger';
            case '10h': return 'badge bg-danger';
            case '11h': return 'badge bg-danger';
            case '12h': return 'badge bg-danger';
            case '-': return '';
            default: return '';
          }
        }
        // Fallback to direct value check if not found in hourOptions
        switch (status) {
          case 'P': return 'badge bg-success';
          case 'A': return 'badge bg-danger';
          case 'L': return 'badge bg-warning';
          case 'W': return 'badge bg-secondary';
          case 'C': return 'badge bg-info';
          case 'S': return 'badge bg-primary';
          case 'CO': return 'badge bg-dark';
          case 'H': return 'badge bg-warning text-dark';
          case '1h': return 'badge bg-warning';
          case '2h': return 'badge bg-success';
          case '3h': return 'badge bg-success';
          case '4h': return 'badge bg-success';
          case '5h': return 'badge bg-success';
          case '6h': return 'badge bg-warning';
          case '7h': return 'badge bg-warning';
          case '8h': return 'badge bg-success';
          case '9h': return 'badge bg-danger';
          case '10h': return 'badge bg-danger';
          case '11h': return 'badge bg-danger';
          case '12h': return 'badge bg-danger';
          default: return '';
        }
      }
  }

  // Properties for template
  syncNotifications: any[] = [];

  // File upload properties
  selectedFile: File | null = null;
  isDragOver: boolean = false;
  isUploading: boolean = false;

  removeNotification(id: string): void {
    this.syncNotifications = this.syncNotifications.filter(n => n.id !== id);
  }


  // File upload methods
  // onDragOver(event: DragEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.isDragOver = true;
  // }

  // onDragLeave(event: DragEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.isDragOver = false;
  // }

  // onDrop(event: DragEvent): void {
  //   event.preventDefault();
  //   event.stopPropagation();
  //   this.isDragOver = false;

  //   const files = event.dataTransfer?.files;
  //   if (files && files.length > 0) {
  //     this.handleFile(files[0]);
  //   }
  // }

  // onFileSelected(event: any): void {
  //   const file = event.target.files[0];
  //   if (file) {
  //     this.handleFile(file);
  //   }
  // }

  // handleFile(file: File): void {
  //   const allowedTypes = [
  //     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  //     'application/vnd.ms-excel',
  //     'text/csv'
  //   ];

  //   if (allowedTypes.includes(file.type) || file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
  //     this.selectedFile = file;
  //   } else {
  //     alert('Please select a valid Excel or CSV file.');
  //   }
  // }

  clearFile(): void {
    this.selectedFile = null;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('month', this.selectedMonth || '');

    this.api.post('/attendance/import/', formData).subscribe({
      next: (response: any) => {
        this.isUploading = false;
        if (response.success) {
          alert('File uploaded successfully!');
          this.clearFile();
          this.onMonthSelect(this.selectedMonth); // Refresh data
        } else {
          alert('Upload failed: ' + (response.message || 'Unknown error'));
        }
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Upload error:', error);
        alert('Upload failed. Please try again.');
      }
    });
  }

  // Bulk action methods
  markAllPresent(): void {
    if (!this.isAttendanceEnabled) {
      alert('Please enable attendance updates first.');
      return;
    }

    if (!confirm('Are you sure you want to mark ALL employees as present for the entire month?')) {
      return;
    }


    // Mark all employees as present for all days in the month
    this.attendanceData.forEach((employee: { attendance: { [x: string]: string; }; }) => {
      if (!employee.attendance) {
        employee.attendance = {};
      }

      this.daysInMonth.forEach(day => {
        // Skip weekends (W) - keep them as weekends
        if (this.isWeekend(day.originalDate)) {
          employee.attendance[day.originalDate] = 'W';
        } else {
          // Mark as present for all working days
          employee.attendance[day.originalDate] = 'P';
        }
      });

      // Update totals
      // this.updateEmployeeTotals(employee);
    });

    // Add to modified employees for saving
    this.attendanceData.forEach((employee: { employee_id: any; attendance: any; }) => {
      const existingIndex = this.modifiedEmployees.findIndex(e => e.employee_id === employee.employee_id);
      if (existingIndex === -1) {
        this.modifiedEmployees.push({
          employee_id: employee.employee_id,
          attendance: employee.attendance
        });
      } else {
        this.modifiedEmployees[existingIndex].attendance = employee.attendance;
      }
    });

    alert('All employees marked as present! Click "Save Changes" to save.');
  }

  markAllAbsent(): void {
    if (!this.isAttendanceEnabled) {
      alert('Please enable attendance updates first.');
      return;
    }

    if (!confirm('Are you sure you want to mark ALL employees as absent for the entire month?')) {
      return;
    }


    // Mark all employees as absent for all days in the month
    this.attendanceData.forEach((employee: { attendance: { [x: string]: string; }; }) => {
      if (!employee.attendance) {
        employee.attendance = {};
      }

      this.daysInMonth.forEach(day => {
        // Skip weekends (W) - keep them as weekends
        if (this.isWeekend(day.originalDate)) {
          employee.attendance[day.originalDate] = 'W';
        } else {
          // Mark as absent for all working days
          employee.attendance[day.originalDate] = 'A';
        }
      });

      // Update totals
      this.updateEmployeeTotals(employee);
    });

    // Add to modified employees for saving
    this.attendanceData.forEach((employee: { employee_id: any; attendance: any; }) => {
      const existingIndex = this.modifiedEmployees.findIndex(e => e.employee_id === employee.employee_id);
      if (existingIndex === -1) {
        this.modifiedEmployees.push({
          employee_id: employee.employee_id,
          attendance: employee.attendance
        });
      } else {
        this.modifiedEmployees[existingIndex].attendance = employee.attendance;
      }
    });

    alert('All employees marked as absent! Click "Save Changes" to save.');
  }

  markPresentForToday(): void {
    if (!this.isAttendanceEnabled) {
      alert('Please enable attendance updates first.');
      return;
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if today is within the selected month
    const todayInMonth = this.daysInMonth.find(day => day.originalDate == todayString);

    if (!todayInMonth) {
      alert('Today\'s date is not in the selected month. Please select the current month first.');
      return;
    }

    if (!confirm(`Are you sure you want to mark ALL employees as present for today (${todayString})?`)) {
      return;
    }

    if(this.invoiceMode=='Daily'){

    // Mark all employees as present for today only
    this.attendanceData.forEach((employee: { attendance: { [x: string]: string; }; }) => {
      if (!employee.attendance) {
        employee.attendance = {};
      }

      // Only mark today as present, leave other days unchanged
      if (!this.isWeekend(todayString)) {
        employee.attendance[todayString] = 'P';
      } else {
        // alert('Today is a weekend. Attendance will remain as weekend.');
        // return;
      }

      // Update totals
      this.updateEmployeeTotals(employee);
    });
  }else{
    this.attendanceData.forEach((employee: { attendance: { [x: string]: string; }; }) => {
    if (!this.isWeekend(todayString)) {
      employee.attendance[todayString] = '18';
    }
  })
  }
    // Add to modified employees for saving
    this.attendanceData.forEach((employee:any) => {
      const existingIndex = this.modifiedEmployees.findIndex(e => e.employee_id === employee.employee_id);
      if(employee.attendance[existingIndex] == 'P'){
        employee.attendance[existingIndex] = '1';
      }
      if (existingIndex === -1) {
        this.modifiedEmployees.push({
          employee_id: employee.employee_id,
          attendance: employee.attendance
        });
      } else {
        this.modifiedEmployees[existingIndex].attendance = employee.attendance;
      }
    });

    alert(`All employees marked as present for today (${todayString})! Click "Save Changes" to save.`);
  }

  // Helper method to update employee totals
  private updateEmployeeTotals(employee: any): void {
    if (!employee.attendance) return;

    employee.totalPresent = 0;
    employee.totalAbsent = 0;
    employee.totalLate = 0;
    employee.totalWeekOff = 0;
    employee.totalCausalLeave = 0;
    employee.totalSickLeave = 0;
    employee.totalCompensatoryOff = 0;
    employee.totalHalfDay = 0;

    Object.values(employee.attendance).forEach((status: any) => {
      switch (status) {
        case 'P':
          employee.totalPresent++;
          break;
        case 'A':
          employee.totalAbsent++;
          break;
        case 'L':
          employee.totalLate++;
          break;
        case 'W':
          employee.totalWeekOff++;
          break;
        case 'C':
          employee.totalCausalLeave++;
          break;
        case 'S':
          employee.totalSickLeave++;
          break;
        case 'CO':
          employee.totalCompensatoryOff++;
          break;
        case 'H':
          employee.totalHalfDay++;
          break;
      }
    });
  }
}



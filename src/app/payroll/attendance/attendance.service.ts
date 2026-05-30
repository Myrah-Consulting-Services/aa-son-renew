import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private readonly STORAGE_KEY = 'attendance_data';
  private attendance = [
    {
      employeeId: 'EMP001',
      name: 'John Smith',
      department: 'IT',
      designation: 'Senior Developer',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP002',
      name: 'Sarah Johnson',
      department: 'HR',
      designation: 'HR Manager',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP003',
      name: 'Michael Brown',
      department: 'Finance',
      designation: 'Accountant',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP004',
      name: 'Emily Davis',
      department: 'Marketing',
      designation: 'Marketing Specialist',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP005',
      name: 'David Wilson',
      department: 'Operations',
      designation: 'Operations Manager',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP006',
      name: 'Lisa Anderson',
      department: 'IT',
      designation: 'QA Engineer',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP007',
      name: 'Robert Taylor',
      department: 'Sales',
      designation: 'Sales Executive',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP008',
      name: 'Jennifer Martinez',
      department: 'Finance',
      designation: 'Financial Analyst',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP009',
      name: 'Christopher Lee',
      department: 'Marketing',
      designation: 'Marketing Manager',
      attendance: {} as { [key: string]: string }
    },
    {
      employeeId: 'EMP010',
      name: 'Amanda Garcia',
      department: 'HR',
      designation: 'HR Assistant',
      attendance: {} as { [key: string]: string }
    }
  ];

  constructor() { 
    this.loadFromStorage();
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge stored data with default structure
        this.attendance = this.attendance.map(emp => {
          const storedEmp = parsed.find((s: any) => s.employeeId === emp.employeeId);
          return storedEmp ? { ...emp, attendance: storedEmp.attendance || {} } : emp;
        });
      }
    } catch (error) {
      console.error('Error loading attendance data from storage:', error);
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.attendance));
    } catch (error) {
      console.error('Error saving attendance data to storage:', error);
    }
  }

  // Update attendance for a specific employee and date
  updateAttendance(employeeId: string, date: string, status: string): boolean {
    const employee = this.attendance.find(emp => emp.employeeId === employeeId);
    if (employee) {
      // Validate date
      if (!this.isValidDate(date)) {
        console.error('Invalid date format:', date);
        return false;
      }

      // Check if date is not in the future
      if (this.isFutureDate(date)) {
        console.error('Cannot set attendance for future date:', date);
        return false;
      }

      // Update attendance
      employee.attendance[date] = status;
      
      // Save to storage
      this.saveToStorage();
      
      // Sync with leave management if needed
      this.syncAttendanceWithLeave(employeeId, employee.name, date, status);
      
      return true;
    }
    return false;
  }

  // Validate date format (YYYY-MM-DD)
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // Check if date is in the future
  private isFutureDate(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  }

  // Check if date is weekend
  isWeekend(dateString: string): boolean {
    const date = new Date(dateString);
    return date.getDay() === 0 || date.getDay() === 6;
  }

  // Check if date is holiday (mock implementation)
  isHoliday(dateString: string): boolean {
    // Mock holidays - in real app, this would come from a holiday calendar
    const holidays = [
      '2024-01-01', // New Year
      '2024-12-25', // Christmas
      // Add more holidays as needed
    ];
    return holidays.includes(dateString);
  }

  getAttendanceData(year?: number, month?: number): any[] {
    // Use provided year/month or default to current date
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month !== undefined ? month - 1 : currentDate.getMonth(); // month is 1-indexed, Date constructor expects 0-indexed
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    return this.attendance.map(employee => {
      const attendance: { [key: string]: string } = {};
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, targetMonth, day);
        const dateString = `${targetYear}-${(targetMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        
        // Check if we have stored data for this date
        if (employee.attendance[dateString]) {
          attendance[dateString] = employee.attendance[dateString];
        } else {
          // Set weekends as 'W' (Weekoff)
          if (this.isWeekend(dateString)) {
            attendance[dateString] = 'W';
          } else if (this.isHoliday(dateString)) {
            attendance[dateString] = 'H'; // Holiday
          } else {
            // Random attendance status for weekdays (only for past dates)
            if (!this.isFutureDate(dateString)) {
              const statuses = ['P', 'A', 'L', 'C', 'S', 'CO', 'H'];
              const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
              attendance[dateString] = randomStatus;
            } else {
              attendance[dateString] = ''; // Future dates are empty
            }
          }
        }
      }
      
      return {
        ...employee,
        attendance
      };
    });
  }

  // Method to sync attendance with leave management (without circular dependency)
  syncAttendanceWithLeave(employeeId: string, employeeName: string, date: string, status: string) {
    if (status === 'C' || status === 'S') {
      // Create a custom event to notify leave management
      const event = new CustomEvent('attendance-leave-sync', {
        detail: {
          employeeId,
          employeeName,
          date,
          status,
          leaveType: status === 'C' ? 'casual' : 'sick'
        }
      });
      window.dispatchEvent(event);
    }
  }

  // Method to get leave balance for an employee (mock data)
  getEmployeeLeaveBalance(employeeId: string) {
    return {
      annual: 15,
      casual: 7,
      sick: 10,
      maternity: 90,
      paternity: 10,
      unpaid: 0,
      compensatory: 5,
      halfday: 2
    };
  }

  // Method to check if employee has approved leave for a date (mock data)
  hasApprovedLeave(employeeId: string, date: string): boolean {
    // Mock implementation - in real app this would check actual leave data
    return Math.random() > 0.8; // 20% chance of having approved leave
  }

  // Save all attendance data
  saveAllAttendance(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.saveToStorage();
        console.log('Attendance data saved successfully');
        resolve(true);
      } catch (error) {
        console.error('Error saving attendance data:', error);
        resolve(false);
      }
    });
  }

  // Get attendance for specific date range
  getAttendanceForDateRange(employeeId: string, startDate: string, endDate: string): any {
    const employee = this.attendance.find(emp => emp.employeeId === employeeId);
    if (!employee) return null;

    const attendance: { [key: string]: string } = {};
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateString = date.toISOString().split('T')[0];
      if (employee.attendance[dateString]) {
        attendance[dateString] = employee.attendance[dateString];
      }
    }

    return {
      employeeId,
      attendance
    };
  }
} 
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LeaveManagementService {
  private readonly STORAGE_KEY = 'leave_management_data';
  private leaveData: any[] = [];

  constructor() {
    this.loadFromStorage();
    
    // Listen for attendance-leave-sync events
    window.addEventListener('attendance-leave-sync', (event: any) => {
      this.handleAttendanceSync(event.detail);
    });
  }

  // Load data from localStorage
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.leaveData = JSON.parse(stored);
      } else {
        // Initialize with default data if no stored data exists
        this.leaveData = this.getDefaultLeaveData();
        this.saveToStorage();
      }
    } catch (error) {
      console.error('Error loading leave data from storage:', error);
      this.leaveData = this.getDefaultLeaveData();
    }
  }

  // Save data to localStorage
  private saveToStorage() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.leaveData));
    } catch (error) {
      console.error('Error saving leave data to storage:', error);
    }
  }

  // Get default leave data
  private getDefaultLeaveData(): any[] {
    return [
      {
        id: '1',
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        leaveType: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-19',
        reason: 'Family vacation',
        daysRequested: 5,
        status: 'Approved',
        submittedDate: '2024-01-10T10:30:00Z',
        approvedBy: 'Manager',
        approvedDate: '2024-01-11T14:20:00Z',
        comments: 'Approved for family vacation'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        leaveType: 'sick',
        startDate: '2024-01-20',
        endDate: '2024-01-22',
        reason: 'Medical appointment',
        daysRequested: 3,
        status: 'Pending',
        submittedDate: '2024-01-18T09:15:00Z',
        approvedBy: '',
        approvedDate: '',
        comments: ''
      },
      {
        id: '3',
        employeeId: 'EMP003',
        employeeName: 'Michael Brown',
        leaveType: 'casual',
        startDate: '2024-01-25',
        endDate: '2024-01-25',
        reason: 'Personal work',
        daysRequested: 1,
        status: 'Approved',
        submittedDate: '2024-01-22T16:45:00Z',
        approvedBy: 'Manager',
        approvedDate: '2024-01-23T11:30:00Z',
        comments: 'Approved for personal work'
      },
      {
        id: '4',
        employeeId: 'EMP004',
        employeeName: 'Emily Davis',
        leaveType: 'maternity',
        startDate: '2024-02-01',
        endDate: '2024-05-01',
        reason: 'Maternity leave',
        daysRequested: 90,
        status: 'Approved',
        submittedDate: '2024-01-15T13:20:00Z',
        approvedBy: 'HR Manager',
        approvedDate: '2024-01-16T10:00:00Z',
        comments: 'Approved maternity leave'
      },
      {
        id: '5',
        employeeId: 'EMP005',
        employeeName: 'David Wilson',
        leaveType: 'unpaid',
        startDate: '2024-01-30',
        endDate: '2024-02-02',
        reason: 'Emergency travel',
        daysRequested: 4,
        status: 'Rejected',
        submittedDate: '2024-01-28T08:30:00Z',
        approvedBy: 'Manager',
        approvedDate: '2024-01-29T15:45:00Z',
        comments: 'Rejected due to workload'
      },
      {
        id: '6',
        employeeId: 'EMP006',
        employeeName: 'Lisa Anderson',
        leaveType: 'compensatory',
        startDate: '2024-02-05',
        endDate: '2024-02-05',
        reason: 'Compensatory off for overtime',
        daysRequested: 1,
        status: 'Approved',
        submittedDate: '2024-02-01T12:00:00Z',
        approvedBy: 'Manager',
        approvedDate: '2024-02-02T09:15:00Z',
        comments: 'Approved compensatory off'
      }
    ];
  }

  // Validate date format (YYYY-MM-DD)
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // Check if date is in the past
  private isPastDate(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  // Check if date range is valid
  private isValidDateRange(startDate: string, endDate: string): boolean {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      return false;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return start <= end;
  }

  // Check for overlapping leave requests
  private hasOverlappingLeave(employeeId: string, startDate: string, endDate: string, excludeId?: string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.leaveData.some(leave => {
      if (leave.employeeId !== employeeId) return false;
      if (excludeId && leave.id === excludeId) return false;
      
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      
      // Check for overlap
      return (start <= leaveEnd && end >= leaveStart);
    });
  }

  getLeaveData(): any[] {
    return [...this.leaveData];
  }

  getEmployees(): any[] {
    return [
      // North Indian Names
      { id: 'EMP001', name: 'Rajesh Kumar', department: 'IT Development' },
      { id: 'EMP002', name: 'Priya Sharma', department: 'Human Resources' },
      { id: 'EMP003', name: 'Amit Patel', department: 'Finance' },
      { id: 'EMP004', name: 'Neha Singh', department: 'Marketing' },
      { id: 'EMP005', name: 'Vikram Malhotra', department: 'Operations' },
      { id: 'EMP006', name: 'Anjali Desai', department: 'Sales' },
      { id: 'EMP007', name: 'Suresh Reddy', department: 'IT Support' },
      { id: 'EMP008', name: 'Meera Iyer', department: 'Legal' },
      { id: 'EMP009', name: 'Arjun Verma', department: 'Engineering' },
      { id: 'EMP010', name: 'Kavya Nair', department: 'Customer Service' },
      { id: 'EMP011', name: 'Rahul Gupta', department: 'Quality Assurance' },
      { id: 'EMP012', name: 'Divya Kapoor', department: 'Product Management' },
      { id: 'EMP013', name: 'Sanjay Mehta', department: 'Business Development' },
      { id: 'EMP014', name: 'Pooja Joshi', department: 'Research & Development' },
      { id: 'EMP015', name: 'Karan Thakur', department: 'Supply Chain' },
      
      // South Indian Names
      { id: 'EMP016', name: 'Lakshmi Priya', department: 'Data Analytics' },
      { id: 'EMP017', name: 'Venkatesh S', department: 'Cloud Computing' },
      { id: 'EMP018', name: 'Ananya Krishnan', department: 'UI/UX Design' },
      { id: 'EMP019', name: 'Ramesh Kumar', department: 'Network Security' },
      { id: 'EMP020', name: 'Sita Lakshmi', department: 'Content Writing' },
      { id: 'EMP021', name: 'Ganesh Prasad', department: 'DevOps' },
      { id: 'EMP022', name: 'Radha Devi', department: 'Digital Marketing' },
      { id: 'EMP023', name: 'Krishna Murthy', department: 'Mobile Development' },
      { id: 'EMP024', name: 'Saraswati Bai', department: 'SEO Specialist' },
      { id: 'EMP025', name: 'Narayan Rao', department: 'Blockchain Developer' },
      
      // Bengali Names
      { id: 'EMP026', name: 'Ritwik Chatterjee', department: 'AI/ML Engineer' },
      { id: 'EMP027', name: 'Sohini Das', department: 'Business Analyst' },
      { id: 'EMP028', name: 'Debashish Banerjee', department: 'Project Manager' },
      { id: 'EMP029', name: 'Anindita Sen', department: 'UX Researcher' },
      { id: 'EMP030', name: 'Sourav Ganguly', department: 'Team Lead' },
      
      // Gujarati Names
      { id: 'EMP031', name: 'Harshad Mehta', department: 'Senior Developer' },
      { id: 'EMP032', name: 'Kajal Patel', department: 'Frontend Developer' },
      { id: 'EMP033', name: 'Dharmesh Shah', department: 'Backend Developer' },
      { id: 'EMP034', name: 'Pooja Bhatt', department: 'QA Engineer' },
      { id: 'EMP035', name: 'Vijay Mallya', department: 'System Architect' },
      
      // Marathi Names
      { id: 'EMP036', name: 'Sachin Tendulkar', department: 'Technical Lead' },
      { id: 'EMP037', name: 'Priyanka Chopra', department: 'Product Owner' },
      { id: 'EMP038', name: 'Ajinkya Rahane', department: 'Scrum Master' },
      { id: 'EMP039', name: 'Shraddha Kapoor', department: 'Business Intelligence' },
      { id: 'EMP040', name: 'Rahul Dravid', department: 'Database Administrator' },
      
      // Punjabi Names
      { id: 'EMP041', name: 'Gurpreet Singh', department: 'Security Analyst' },
      { id: 'EMP042', name: 'Harpreet Kaur', department: 'Data Scientist' },
      { id: 'EMP043', name: 'Jaspreet Singh', department: 'Full Stack Developer' },
      { id: 'EMP044', name: 'Manpreet Kaur', department: 'DevOps Engineer' },
      { id: 'EMP045', name: 'Balwinder Singh', department: 'Infrastructure Engineer' },
      
      // Kashmiri Names
      { id: 'EMP046', name: 'Aisha Khan', department: 'UX Designer' },
      { id: 'EMP047', name: 'Zahid Mir', department: 'Mobile App Developer' },
      { id: 'EMP048', name: 'Fatima Sheikh', department: 'Content Strategist' },
      { id: 'EMP049', name: 'Imran Khan', department: 'API Developer' },
      { id: 'EMP050', name: 'Nazia Ahmed', department: 'Technical Writer' }
    ];
  }

  getLeaveBalance(employeeId: string): any {
    // Mock leave balance - in real app this would come from HR system
    return {
      annual: { total: 21, used: 5, remaining: 16 },
      casual: { total: 7, used: 2, remaining: 5 },
      sick: { total: 10, used: 1, remaining: 9 },
      maternity: { total: 90, used: 0, remaining: 90 },
      paternity: { total: 10, used: 0, remaining: 10 },
      unpaid: { total: 0, used: 0, remaining: 0 },
      compensatory: { total: 5, used: 1, remaining: 4 },
      halfday: { total: 2, used: 0, remaining: 2 }
    };
  }

  // Handle attendance sync events
  private handleAttendanceSync(detail: any) {
    const { employeeId, employeeName, date, leaveType } = detail;
    
    // Check if leave request already exists for this date
    const existingLeave = this.leaveData.find(leave => 
      leave.employeeId === employeeId && 
      leave.startDate === date && 
      leave.leaveType === leaveType
    );

    if (!existingLeave) {
      // Create new leave request
      const newLeaveRequest = {
        id: Date.now().toString(),
        employeeId: employeeId,
        employeeName: employeeName,
        leaveType: leaveType,
        startDate: date,
        endDate: date,
        reason: `Auto-generated from attendance: ${leaveType === 'casual' ? 'Casual Leave' : 'Sick Leave'}`,
        daysRequested: 1,
        status: 'Pending',
        submittedDate: new Date().toISOString(),
        approvedBy: '',
        approvedDate: '',
        comments: ''
      };

      this.leaveData.unshift(newLeaveRequest);
      this.saveToStorage();
      console.log('Created leave request from attendance:', newLeaveRequest);
    }
  }

  submitLeaveRequest(leaveRequest: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Validate required fields
      if (!leaveRequest.employeeId || !leaveRequest.leaveType || !leaveRequest.startDate || !leaveRequest.endDate) {
        reject({ success: false, message: 'Missing required fields' });
        return;
      }

      // Validate date format
      if (!this.isValidDate(leaveRequest.startDate) || !this.isValidDate(leaveRequest.endDate)) {
        reject({ success: false, message: 'Invalid date format' });
        return;
      }

      // Validate date range
      if (!this.isValidDateRange(leaveRequest.startDate, leaveRequest.endDate)) {
        reject({ success: false, message: 'End date must be after start date' });
        return;
      }

      // Check for overlapping leaves
      if (this.hasOverlappingLeave(leaveRequest.employeeId, leaveRequest.startDate, leaveRequest.endDate)) {
        reject({ success: false, message: 'Leave request overlaps with existing leave' });
        return;
      }

      // Add new leave request
      const newLeave = {
        id: Date.now().toString(),
        ...leaveRequest,
        status: 'Pending',
        submittedDate: new Date().toISOString(),
        approvedBy: '',
        approvedDate: '',
        comments: ''
      };

      this.leaveData.unshift(newLeave);
      this.saveToStorage();

      setTimeout(() => {
        resolve({ success: true, message: 'Leave request submitted successfully', data: newLeave });
      }, 1000);
    });
  }

  updateLeaveRequest(leaveRequest: any): Promise<any> {
    return new Promise((resolve, reject) => {
      // Validate required fields
      if (!leaveRequest.id || !leaveRequest.employeeId || !leaveRequest.leaveType || !leaveRequest.startDate || !leaveRequest.endDate) {
        reject({ success: false, message: 'Missing required fields' });
        return;
      }

      // Validate date format
      if (!this.isValidDate(leaveRequest.startDate) || !this.isValidDate(leaveRequest.endDate)) {
        reject({ success: false, message: 'Invalid date format' });
        return;
      }

      // Validate date range
      if (!this.isValidDateRange(leaveRequest.startDate, leaveRequest.endDate)) {
        reject({ success: false, message: 'End date must be after start date' });
        return;
      }

      // Check for overlapping leaves (excluding current leave)
      if (this.hasOverlappingLeave(leaveRequest.employeeId, leaveRequest.startDate, leaveRequest.endDate, leaveRequest.id)) {
        reject({ success: false, message: 'Leave request overlaps with existing leave' });
        return;
      }

      // Update existing leave request
      const index = this.leaveData.findIndex(leave => leave.id === leaveRequest.id);
      if (index !== -1) {
        this.leaveData[index] = { ...this.leaveData[index], ...leaveRequest };
        this.saveToStorage();

        setTimeout(() => {
          resolve({ success: true, message: 'Leave request updated successfully' });
        }, 1000);
      } else {
        reject({ success: false, message: 'Leave request not found' });
      }
    });
  }

  approveLeaveRequest(leaveId: string, approvedBy: string, comments: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const leaveIndex = this.leaveData.findIndex(leave => leave.id === leaveId);
      if (leaveIndex !== -1) {
        const leave = this.leaveData[leaveIndex];
        
        // Check if leave is already approved
        if (leave.status == 'Approved') {
          reject({ success: false, message: 'Leave request is already approved' });
          return;
        }

        // Update leave status
        this.leaveData[leaveIndex] = {
          ...leave,
          status: 'Approved',
          approvedBy: approvedBy,
          approvedDate: new Date().toISOString(),
          comments: comments
        };
        
        this.saveToStorage();
        
        // Sync with attendance system via event
        this.syncApprovedLeaveWithAttendance(this.leaveData[leaveIndex]);
        
        setTimeout(() => {
          resolve({ success: true, message: 'Leave request approved successfully' });
        }, 1000);
      } else {
        reject({ success: false, message: 'Leave request not found' });
      }
    });
  }

  rejectLeaveRequest(leaveId: string, rejectedBy: string, comments: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const leaveIndex = this.leaveData.findIndex(leave => leave.id === leaveId);
      if (leaveIndex !== -1) {
        const leave = this.leaveData[leaveIndex];
        
        // Check if leave is already processed
        if (leave.status == 'Approved' || leave.status == 'Rejected') {
          reject({ success: false, message: 'Leave request is already processed' });
          return;
        }

        // Update leave status
        this.leaveData[leaveIndex] = {
          ...leave,
          status: 'Rejected',
          approvedBy: rejectedBy,
          approvedDate: new Date().toISOString(),
          comments: comments
        };
        
        this.saveToStorage();
        
        setTimeout(() => {
          resolve({ success: true, message: 'Leave request rejected successfully' });
        }, 1000);
      } else {
        reject({ success: false, message: 'Leave request not found' });
      }
    });
  }

  cancelLeaveRequest(leaveId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const leaveIndex = this.leaveData.findIndex(leave => leave.id === leaveId);
      if (leaveIndex !== -1) {
        const leave = this.leaveData[leaveIndex];
        
        // Check if leave is already processed
        if (leave.status == 'Approved' || leave.status == 'Rejected') {
          reject({ success: false, message: 'Cannot cancel processed leave request' });
          return;
        }

        // Update leave status
        this.leaveData[leaveIndex] = {
          ...leave,
          status: 'Cancelled'
        };
        
        this.saveToStorage();
        
        setTimeout(() => {
          resolve({ success: true, message: 'Leave request cancelled successfully' });
        }, 1000);
      } else {
        reject({ success: false, message: 'Leave request not found' });
      }
    });
  }

  // Method to sync approved leaves with attendance (using events)
  private syncApprovedLeaveWithAttendance(leaveRequest: any) {
    if (leaveRequest.status == 'Approved') {
      // Dispatch event to notify attendance system
      const event = new CustomEvent('leave-attendance-sync', {
        detail: {
          employeeId: leaveRequest.employeeId,
          startDate: leaveRequest.startDate,
          endDate: leaveRequest.endDate,
          leaveType: leaveRequest.leaveType
        }
      });
      window.dispatchEvent(event);
    }
  }

  // Save all leave data
  saveAllLeaveData(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.saveToStorage();
        console.log('Leave data saved successfully');
        resolve(true);
      } catch (error) {
        console.error('Error saving leave data:', error);
        resolve(false);
      }
    });
  }

  // Get leave requests for specific date range
  getLeaveRequestsForDateRange(startDate: string, endDate: string): any[] {
    return this.leaveData.filter(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      return leaveStart <= rangeEnd && leaveEnd >= rangeStart;
    });
  }

  // Get LOP (Loss of Pay) leaves for an employee in a date range
  getLOPLeavesForEmployee(employeeId: string, startDate: string, endDate: string): any[] {
    return this.leaveData.filter(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      return leave.employeeId === employeeId && 
             leave.status == 'Approved' && 
             leave.leaveType === 'lop' &&
             leaveStart <= rangeEnd && 
             leaveEnd >= rangeStart;
    });
  }

  // Calculate LOP days for an employee in a date range
  calculateLOPDays(employeeId: string, startDate: string, endDate: string): number {
    const lopLeaves = this.getLOPLeavesForEmployee(employeeId, startDate, endDate);
    
    return lopLeaves.reduce((totalDays, leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      // Calculate overlapping days
      const overlapStart = new Date(Math.max(start.getTime(), rangeStart.getTime()));
      const overlapEnd = new Date(Math.min(end.getTime(), rangeEnd.getTime()));
      
      const daysDiff = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return totalDays + Math.max(0, daysDiff);
    }, 0);
  }

  // Submit LOP leave request
  submitLOPRequest(employeeId: string, employeeName: string, startDate: string, endDate: string, reason: string): Promise<any> {
    const lopRequest = {
      id: this.generateLeaveId(),
      employeeId,
      employeeName,
      leaveType: 'lop',
      startDate,
      endDate,
      reason,
      daysRequested: this.calculateDaysBetween(startDate, endDate),
      status: 'Pending',
      submittedDate: new Date().toISOString(),
      approvedBy: '',
      approvedDate: '',
      comments: ''
    };

    return this.submitLeaveRequest(lopRequest);
  }

  // Calculate days between two dates
  private calculateDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Generate unique leave ID
  private generateLeaveId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `LEAVE${timestamp}${random}`;
  }


} 
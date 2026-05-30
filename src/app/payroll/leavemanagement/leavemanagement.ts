import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LeaveManagementService } from './leavemanagement.service';
import { NgbActiveModal, NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';
import { number } from 'echarts';

@Component({
  selector: 'app-leavemanagement',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
  ],
  providers: [NgbActiveModal, NgbModal],
  templateUrl: './leavemanagement.html',
  styleUrls: ['./leavemanagement.scss']
})
export class LeaveManagement implements OnInit {
  // Form controls
  date = new FormControl(new Date().toISOString().substring(0, 7)); // YYYY-MM format
  searchTerm: string = '';
  filteredLeaveRequests: any[] = [];
  
  // Pagination
  totalData: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  
  // Leave form
  leaveForm: FormGroup;
  isFormVisible = false;
  isEditMode = false;
  selectedLeave: any ='';

  // Leave types
  leaveTypes = [
    // { id:5,value: 'casual', display: 'Casual Leave', color: '#ffc107' },
    // {id:6, value: 'sick', display: 'Sick Leave', color: '#dc3545' },
    // { id:10, value: 'annual', display: 'Annual Leave', color: '#28a745' },
    // { id:7, value: 'compensatory', display: 'Compensatory Off', color: '#fd7e14' },
    // { id:8, value: 'halfday', display: 'Half Day', color: '#6f42c1' },
    // { id:9, value:'Unpaid Leave', display:'Unpaid Leave', color:''}
  ];

  // Status options
  statusOptions = [
    { value: 'pending', display: 'Pending', color: '#ffc107' },
    { value: 'approved', display: 'Approved', color: '#28a745' },
    { value: 'rejected', display: 'Rejected', color: '#dc3545' },
    { value: 'cancelled', display: 'Cancelled', color: '#6c757d' }
  ];
  approvers: any[] = [
    { id: 1, name: 'Manager' },
    { id: 2, name: 'HR' },
    { id: 3, name: 'Director' } 
  ];

  // Statistics
  totalPending = 0;
  totalApproved = 0;
  totalRejected = 0;
  totalCancelled = 0;
  totalRequests = 0;
  totalPages = 0;
  // Employee data with comprehensive Indian names
  employees: any[] = [
  ];

  // Date filtered leave requests data
  dateFilteredLeaveRequests: any[] = [];
  currentYear: number = new Date().getFullYear();
  currentMonth: number = new Date().getMonth() + 1;

  // Notifications
  notifications: any[] = [];
  modalRef: any;
  pagination_data: any;
  employeeSearchTerm:any=''
  constructor(
    private fb: FormBuilder,
    private modal: NgbModal,
    private apiService: Api,
    private toast: ToastService,
    private activeModal: NgbActiveModal
  ) {
    this.leaveForm = this.fb.group({
      employee: [number, Validators.required],
      company: [1, Validators.required],
      attendance_type: ['', Validators.required],
      start_date: ['', Validators.required],
      end_date: ['', Validators.required],
      total_days: [0, Validators.required],
      reason: ['', Validators.required],
      is_lop: [false],
      status: ['1'], // 1 = Pending
      action_by: [''],
      approval_remarks: [''],
      id:['']
    });

   
  }

  ngOnInit(): void {
    this.initializeData();
    this.loadEmployees()
    const today = new Date().toISOString().split('T')[0];
    this.leaveForm.patchValue({ start_date: today, end_date: today });
    this.onLeaveDateChange(); // Calculate total days initially
  }
  loadEmployees(): void {
    this.apiService.post('/employee/list_employees/',{company:this.apiService.getCompanyId(),
      pagination:false
       }).subscribe((response: any) => {
      if (response.status == 200) {
        this.employees = response.data;
      }
    });
    this.apiService.get('/attendance/list-attendance-types/').subscribe((res:any)=>{
      if(res.status==200){
        this.leaveTypes = res.data.filter((element: any) => element.is_leave === true);
        console.log(this.leaveTypes);

      }
    })
  }
  initializeData() {
    this.apiService.get('/attendance/list-leave-requests/?'+"page="+this.currentPage+1+'&'+"limit="+this.pageSize).subscribe((res: any) => {      
      if(res.status == 200){
        this.filteredLeaveRequests = res.data;
        this.pagination_data=res.pagination_data    
        this.totalData = this.pagination_data.total_data;


        this.calculateStatistics();

      }
      else{
        this.toast.show(res.message, 'error');
      }
    });
    this.totalPages = Math.ceil(this.totalData / this.pageSize);
  }

  // Statistics methods
  calculateStatistics() {
    this.totalPending = this.filteredLeaveRequests.filter(leave => leave.status_name == 'Pending').length;
    this.totalApproved = this.filteredLeaveRequests.filter(leave => leave.status_name == 'Approved').length;    
    this.totalRejected = this.filteredLeaveRequests.filter(leave => leave.status_name == 'Rejected').length;
    this.totalRequests = this.filteredLeaveRequests.length;
  }

  // Search and filtering
  // filterLeaveRequests() {
  //   if (!this.searchTerm.trim()) {
  //     this.filteredLeaveRequests = [...this.leaveRequests];
  //   } else {
  //     this.filteredLeaveRequests = this.leaveRequests.filter(leave =>
  //       leave.employee_full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
  //       leave.attendance_type_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
  //       leave.status_name.toLowerCase().includes(this.searchTerm.toLowerCase())
  //     );
  //   }
  // }

  // Form methods
  showAddForm(leaveForm: any) {
    this.selectedLeave=''
    this.leaveForm.reset()
    this.modalRef=this.modal.open(leaveForm, { size: 'lg', backdrop: 'static', keyboard: false });
  }
  showeditForm(leaveform:any,leave:any){
    this.selectedLeave=leave
    this.modalRef=this.modal.open(leaveform, { size: 'lg', backdrop: 'static', keyboard: false });
    // get-leave-requests/id/
    this.apiService.get('/attendance/get-leave-requests/'+leave.id+"/").subscribe((res: any) => {      
    if(res.status==200){
      this.leaveForm.patchValue({
        employee:Number(res.data.employee),
        company: res.data.company,
        attendance_type: Number(res.data.attendance_type),
        start_date: res.data.start_date,
        end_date: res.data.end_date,
        total_days:res.data.total_days,
      reason:res.data.reason,
      is_lop:res.data.is_lop,
      status:res.data.status,
      action_by:res.data.action_by,
      approval_remarks:res.data.approval_remarks,
      id:res.data.id
    });
  }
})
  }
  // Add notification system
  addNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    this.notifications.unshift(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }

  removeNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  addLeaveRequest(){
    console.log(this.leaveForm.value);
    if(this.leaveForm.value.id){
      this.apiService.put('/attendance/put-leave-requests/'+this.leaveForm.value.id+"/",this.leaveForm.value).subscribe((response: any) => {
        console.log(response);
        if(response.status == 200){
          this.modalRef.dismiss()
          this.addNotification('✅ Leave request updated successfully', 'success');
          this.initializeData();
          this.calculateStatistics();
        }else{
          this.addNotification(response.error, 'error');
        }
      })
    }
    else{
    this.apiService.post('/attendance/create-leave-requests/',this.leaveForm.value).subscribe((response: any) => {
      console.log(response);
      if(response.status == 200){
        this.initializeData();
        this.calculateStatistics();
        this.activeModal.dismiss()
        this.addNotification('✅ Leave request added successfully', 'success');
      }
      else{
        this.addNotification(response.error, 'error');
      }
    })
    }
  }
  // /attendance/delete-leave-requests/<int:pk>/
  deleteLeaveRequest(leave: any) {
    if (!leave || !leave.id) {
      this.addNotification('❌ Invalid leave request selected for deletion', 'error');
      return;
    }
    if (confirm('Are you sure you want to delete this leave request?')) {
      this.apiService.delete(`/attendance/delete-leave-requests/${leave.id}/`).subscribe(
        (response: any) => {
          if (response && (response.status == 200 || response.success)) {
            this.initializeData();
            this.calculateStatistics();
            this.addNotification('✅ Leave request deleted successfully', 'success');
          } else {
            this.addNotification('❌ Failed to delete leave request', 'error');
          }
        },
        (error) => {
          this.addNotification('❌ Error occurred while deleting leave request', 'error');
        }
      );
    }
  }

  // Approval methods
  approveLeave(leave: any) {
    if(confirm("Are you sure you want to approve this leave?")){
    this.apiService.post('/attendance/change-leave-status/'+leave+"/",{
      status:this.leaveForm.value.status,
      action_by:this.leaveForm.value.action_by,
      approval_remarks:this.leaveForm.value.approval_remarks}
    ).subscribe((response: any) => {
        if (response.status == 200) {
          this.initializeData(); // Reload data
          this.calculateStatistics();
          this.addNotification('✅ Leave request approved successfully', 'success');
        }
      })
    }      
  }


  cancelLeave(leave: any) {
    if(confirm("Are you sure you want to cancel this leave?")){
    this.apiService.post('/attendance/cancel-leave/',{id:leave.id}).subscribe((response: any) => {
        if (response.success) {
          this.initializeData(); 
          this.calculateStatistics();
          this.addNotification('✅ Leave request cancelled successfully', 'success');
        }
      })
    }      
  }

  // Utility methods
  // getLeaveTypeDisplay(type: string): string {
  //   const leaveType = this.leaveTypes.find(lt => lt.value === type);
  //   return leaveType ? leaveType.display : type;
  // }

  getStatusDisplay(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.display : status;
  }

  getStatusColor(status: string): string {
    const statusOption = this.statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : '#6c757d';
  }

  // getLeaveTypeColor(type: string): string {
  //   const leaveType = this.leaveTypes.find(lt => lt.value === type);
  //   return leaveType ? leaveType.color : '#6c757d';
  // }

  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  }

  onLeaveDateChange() {
    const startDate = this.leaveForm.get('start_date')?.value;
    const endDate = this.leaveForm.get('end_date')?.value;
    
    if (startDate && endDate) {
      const days = this.calculateDays(startDate, endDate);
      this.leaveForm.patchValue({ total_days: days });
    }
  }

  // Pagination
  onPageChange(event: any) {
      this.currentPage = event.pageIndex;
      this.pageSize = event.pageSize;
      this.initializeData();
      this.calculateStatistics();
  }



  // Add Math property for template access
  get Math() {
    return Math;
  }


  refreshData() {
    this.initializeData();
    this.calculateStatistics();
    this.addNotification('Data refreshed successfully', 'success');
  }

 
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages);
    const startPage = Math.max(0, Math.min(this.currentPage - 2, this.totalPages - maxPages));
    
    for (let i = startPage; i < startPage + maxPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

} 
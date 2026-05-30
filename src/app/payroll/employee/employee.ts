import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddEmployeeComponent } from '../add-employee/add-employee';
import { EmployeeService } from './employee.service';
import { Api } from '../../core/services/api';
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../core/services/toast.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee',
  standalone: true,
  imports: [CommonModule, RouterModule, AddEmployeeComponent,NgbPaginationModule,ReactiveFormsModule,FormsModule],
  templateUrl: './employee.html',
  styleUrls: ['./employee.scss']
})
export class EmployeeComponent implements OnInit {
  employees: any[] = [];
  selectedEmployee: any = null;
  departments: any[] = [];
  search:any;
  // Document modal state
  docForm: any = { scope: 'employee', employeeId: null, departmentId: null, folder: '', title: '', showInPortal: true };
  docFile: File | null = null;
  pagination: any;
  totalData: any;
  pageSize: number = 10;
  currentPage: number = 0;
  Math=Math;
  designation: any="";
  department: any="";
  pageNumber: any;
  designationList: any;
  constructor(private modalService: NgbModal, private api: Api,private toast: ToastService) {}

  ngOnInit(): void {
  
    this.getDesignationList()
    this.getEmployeeList();
  }
  getDesignationList(): void {
    this.api.get('/employee/list_departments/').subscribe((res:any)=>{
      if(res.status==200){ this.departments = res.data; }
    });
    this.api.get('/employee/list_designations/').subscribe((res: any) => {
      if (res.status == 200) {
        this.designationList = res.data;
      }
    });
  }
  getEmployeeList(){
    let a = {
      page:this.pageNumber,
      page_size:this.pageSize,
      company:this.api.getCompanyId(),
      employee:this.search,
      department_id:this.department,
      designation_id:this.designation,
    
    }
    this.api.post('/employee/list_employees/',a).subscribe((res:any)=>{
      console.log(res,'employee list');
      if(res.status==200){
        this.employees = res.data;
        this.pagination=res.pagination
        this.totalData=this.pagination.count
      }else{
        this.employees = [];
      }
    });
  }
  onPageChange(event: any){
    this.pageSize = event.pageSize;
    this.pageNumber = event.pageIndex ;
    this.currentPage=this.pageNumber

    // this.pageNumber++
    let a = {
     
      page_size: this.pageSize, page: this.pageNumber+1, pagination: true,
      "company": this.api.getCompanyId(),
    }
    this.api.post('/employee/list_employees/',a).subscribe((response:any)=>{
      if(response.status){
      this.employees = response.data;
      this.pagination = response.pagination
      }
    })  
  }
  prepareForAction(employeeId: any,modal:any) {
    this.selectedEmployee = employeeId;
    if(modal){
    let modalRef = this.modalService.open(modal, {
        size: 'xl',
        // windowClass:'custom',
        centered: true,
        backdrop: 'static',
        keyboard: false,
        scrollable: true,
      });
      modalRef.result.then((result: any) => {
        this.getEmployeeList();
      }).catch((error: any) => {
        this.getEmployeeList();
      });
      // The button will open the modal, we just need the data ready
    }
  }
  deleteEmployee(employeeId: any, modal: any) {
    this.selectedEmployee = employeeId;
    if(modal){
      this.modalService.open(modal, { size: 'lg', centered: true, scrollable: true, backdrop: 'static' });
    }
  }

  confirmDelete(): void {
    if (this.selectedEmployee) {
    this.api.delete('/employee/delete_employee/'+this.selectedEmployee.id+'/').subscribe((res:any)=>{
      if(res.status==200){
        this.getEmployeeList();
        this.modalService.dismissAll();
        this.toast.show('Employee deleted successfully','success');
      }
    });
    }
  }

  // Document modal methods
  openDocumentModal(tpl:any){
    this.docForm = { scope: 'employee', employeeId: null, departmentId: null, folder: '', title: '', showInPortal: true };
    this.docFile = null;
    this.modalService.open(tpl, { size: 'lg', centered: true, scrollable: true, backdrop: 'static' });
  }

  onDocFileSelected(event:any){
    const f = event.target?.files?.[0];
    if(!f){ this.docFile = null; return; }
    if(f.size > 7 * 1024 * 1024){ alert('File must be <= 7MB'); return; }
    this.docFile = f;
  }

  saveDocument(modalRef:any){
    if(!this.docFile){ return; }
    const fd = new FormData();
    fd.append('title', this.docForm.title || this.docFile.name);
    fd.append('folder', this.docForm.folder || 'General');
    fd.append('scope', this.docForm.scope);
    if(this.docForm.scope === 'employee' && this.docForm.employeeId){ fd.append('employee_id', this.docForm.employeeId); }
    if(this.docForm.scope === 'department' && this.docForm.departmentId){ fd.append('department_id', this.docForm.departmentId); }
    fd.append('show_in_portal', String(!!this.docForm.showInPortal));
    fd.append('file', this.docFile);
     console.log(fd,'fd');
     
    // Placeholder endpoint; adjust to your backend route
    this.api.post('/employee/upload_document/', fd).subscribe((res:any)=>{
      if(res.status==200){
        modalRef.close();
        alert('Document uploaded');
      } else {
        alert('Upload failed');
      }
    });
  }

}

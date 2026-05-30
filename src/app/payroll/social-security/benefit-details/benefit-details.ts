import { Component } from '@angular/core';
import { Api } from '../../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PensionModal } from '../pension-modal/pension-modal';

@Component({
  selector: 'app-benefit-details',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './benefit-details.html',
  styleUrl: './benefit-details.scss'
})
export class BenefitDetails {
  modalRef: any;
  oldScheme: any;
  newSchemes: any;
  employeeCount: any;
  constructor(private api: Api, private modalservice: NgbModal) {

  }
  social_securities: any
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getList()
  }
  openEdit(id: any) {
    this.modalRef = this.modalservice.open(PensionModal, { size: 'xl', keyboard: false, backdrop: 'static' })
    this.modalRef.componentInstance.id = id;
    this.modalRef.result.then((result: any) => {
      if (result) {
        this.getList();
      }
    })
  }
  getList() {
    // /employee/list_penison/
    this.api.get('/employee/list_penison/').subscribe((res: any) => {
      if (res.status == 200) {
        console.log(res);
        this.social_securities = res.data
        // this.oldScheme = this.social_securities.schemes[0];  
        // this.newSchemes = this.social_securities.schemes[1]?.Changes;  
        // this.employeeCount = this.social_securities.employee_count;
      }
    })
  }
}

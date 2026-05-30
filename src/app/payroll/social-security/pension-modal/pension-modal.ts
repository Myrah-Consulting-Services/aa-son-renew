import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../../../core/services/api';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-pension-modal',
  imports: [CommonModule,ReactiveFormsModule,FormsModule],
  templateUrl: './pension-modal.html',
  styleUrl: './pension-modal.scss'
})
export class PensionModal {
  benefit: any;
computeGp() {
throw new Error('Method not implemented.');
}
  @Input() id:any;
  @Input() modalRef:any
  gpResult: any;
  constructor(private api:Api,public activeModal:NgbModal){}
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.getDetailedBenefit(this.id)
  }
  getDetailedBenefit(id:any){
    this.api.get('/employee/detailed_pensions/'+id+"/").subscribe((res:any)=>{
      if(res.status==200){
        console.log(res);
        this.benefit=res.data
        
      }
    })
  }
  saveGp(data:any): void {
    // Placeholder save. Integrate with backend when endpoint is available.
    console.log('Saving GPSSA settings', {
    });
    let payload={
      "max_contribution":data.max_contribution,
      "is_pro_rate":data.is_pro_rate ,
      "postpone_to_next_year": data.postpone_to_next_year
    }
    // /employee/update_pensions/1/
    this.api.put("/employee/update_pensions/"+this.id+"/",payload).subscribe((res:any)=>{
      if(res.status==200){
        console.log(res);    
        this.activeModal.dismissAll()

        
      }
    })
    alert('GPSSA settings saved');
  }
}

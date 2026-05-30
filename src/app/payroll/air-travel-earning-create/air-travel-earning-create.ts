import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Api } from '../../core/services/api';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-air-travel-earning-create',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './air-travel-earning-create.html',
  styleUrl: './air-travel-earning-create.scss',
})
export class AirTravelEarningCreate {
  // Air Travel Allowance form
  earningNames: any;
  @Input() id: any;
  @Input() data: any;
  @Input() airTravelModalRef: any;
  airTravelForm!: FormGroup;
  constructor(
    private api: Api,
    private fb: FormBuilder,
    private toast: ToastService
  ) {}
  ngOnInit(): void {
    this.initializeAirTravelForm();
    this.getotherDeductionList();
  }
  getotherDeductionList() {
    // /employee/payroll_heads_special_groups/
    this.api
      .get('/employee/payroll_heads_special_groups/' + this.id + '/')
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.earningNames = res.Air_tickiting_allowance;
          console.log(this.earningNames, 'earning names');
        }
      });
  }
  initializeAirTravelForm() {
    this.airTravelForm = this.fb.group({
      earning_name: ['', Validators.required],
      annual_amount: [
        null,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      payout_month: [null, Validators.required],
      employee: [this.id],
      company: [this.api.getCompanyId()],
    });
  }
  saveAirTravel(): void {
    console.log('Air Travel Allowance', this.airTravelForm.value);
    this.airTravelForm.value.employee = this.id;
    this.airTravelForm.value.company = this.api.getCompanyId();
    if (this.airTravelForm.valid) {
      const airTravelData = { ...this.airTravelForm.value };
      if (airTravelData.payout_month) {
        const [year, month] = airTravelData.payout_month.split('-');
        airTravelData.payout_month = `${year}-${month}-01`;
      }
      // update_air_travel_allowance/1/
      if (this.data != null) {
        this.api
          .put(
            '/employee/update_air_travel_allowance/' + this.data.id + '/',
            airTravelData
          )
          .subscribe((res: any) => {
            console.log(res);
            if (res.status == 201 || res.status == 200) {
              this.toast.show(
                'success',
                'Air Travel Allowance updated successfully'
              );
              this.airTravelModalRef.dismiss();
            }
          });
      }
      this.api
        .post('/employee/create_air_travel_allowance/', airTravelData)
        .subscribe((res: any) => {
          console.log(res);
          if (res.status == 201 || res.status == 200) {
            this.toast.show(
              'success',
              'Air Travel Allowance added successfully'
            );
            this.airTravelModalRef.dismiss();
          }
        });
    } else {
      this.airTravelForm.markAllAsTouched();
    }
  }
}

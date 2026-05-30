import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { Api } from '../../../core/services/api';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-party',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    NgbTooltipModule
  ],
  templateUrl: './party.html',
  styleUrl: './party.scss'
})
export class Party implements OnInit {
  @Input() partyData: any;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() onSubmit = new EventEmitter<any>();
  @Input() ModalRef: any;
  
  partyForm!: FormGroup;
  countries = [
    {id: 1, name: 'United Arab Emirates'},
    {id: 2, name: 'Afghanistan'},
    {id: 3, name: 'Albania'},
    {id: 4, name: 'Algeria'},
    {id: 5, name: 'Andorra'},
    {id: 6, name: 'Angola'},
    {id: 7, name: 'Antigua and Barbuda'},
    {id: 8, name: 'Argentina'},
    {id: 9, name: 'Armenia'},
    {id: 10, name: 'Australia'},
    {id: 11, name: 'Austria'},
    {id: 12, name: 'Azerbaijan'},
    {id: 13, name: 'Bahamas'},
    {id: 14, name: 'Bahrain'},
    {id: 15, name: 'Bangladesh'},
    {id: 16, name: 'Barbados'},
    {id: 17, name: 'Belarus'},
    {id: 18, name: 'Belgium'},
    {id: 19, name: 'Belize'},
    {id: 20, name: 'Benin'},
    {id: 21, name: 'Bhutan'},
    {id: 22, name: 'Bolivia'},
    {id: 23, name: 'Bosnia and Herzegovina'},
    {id: 24, name: 'Botswana'},
    {id: 25, name: 'Brazil'},
    {id: 26, name: 'Brunei'},
    {id: 27, name: 'Bulgaria'},
    {id: 28, name: 'Burkina Faso'},
    {id: 29, name: 'Burundi'},
    {id: 30, name: 'Cabo Verde'},
    {id: 31, name: 'Cambodia'},
    {id: 32, name: 'Cameroon'},
    {id: 33, name: 'Canada'},
    {id: 34, name: 'Central African Republic'},
    {id: 35, name: 'Chad'},
    {id: 36, name: 'Chile'},
    {id: 37, name: 'China'},
    {id: 38, name: 'Colombia'},
    {id: 39, name: 'Comoros'},
    {id: 40, name: 'Congo'},
    {id: 41, name: 'Costa Rica'},
    {id: 42, name: 'Croatia'},
    {id: 43, name: 'Cuba'},
    {id: 44, name: 'Cyprus'},
    {id: 45, name: 'Czech Republic'},
    {id: 46, name: 'Denmark'},
    {id: 47, name: 'Djibouti'},
    {id: 48, name: 'Dominica'},
    {id: 49, name: 'Dominican Republic'},
    {id: 50, name: 'Ecuador'},
    {id: 51, name: 'Egypt'},
    {id: 52, name: 'El Salvador'},
    {id: 53, name: 'Equatorial Guinea'},
    {id: 54, name: 'Eritrea'},
    {id: 55, name: 'Estonia'},
    {id: 56, name: 'Eswatini'},
    {id: 57, name: 'Ethiopia'},
    {id: 58, name: 'Fiji'},
    {id: 59, name: 'Finland'},
    {id: 60, name: 'France'},
    {id: 61, name: 'Gabon'},
    {id: 62, name: 'Gambia'},
    {id: 63, name: 'Georgia'},
    {id: 64, name: 'Germany'},
    {id: 65, name: 'Ghana'},
    {id: 66, name: 'Greece'},
    {id: 67, name: 'Grenada'},
    {id: 68, name: 'Guatemala'},
    {id: 69, name: 'Guinea'},
    {id: 70, name: 'Guinea-Bissau'},
    {id: 71, name: 'Guyana'},
    {id: 72, name: 'Haiti'},
    {id: 73, name: 'Honduras'},
    {id: 74, name: 'Hungary'},
    {id: 75, name: 'Iceland'},
    {id: 76, name: 'India'},
    {id: 77, name: 'Indonesia'},
    {id: 78, name: 'Iran'},
    {id: 79, name: 'Iraq'},
    {id: 80, name: 'Ireland'},
    {id: 81, name: 'Israel'},
    {id: 82, name: 'Italy'},
    {id: 83, name: 'Jamaica'},
    {id: 84, name: 'Japan'},
    {id: 85, name: 'Jordan'},
    {id: 86, name: 'Kazakhstan'},
    {id: 87, name: 'Kenya'},
    {id: 88, name: 'Kiribati'},
    {id: 89, name: 'Kuwait'},
    {id: 90, name: 'Kyrgyzstan'},
    {id: 91, name: 'Laos'},
    {id: 92, name: 'Latvia'},
    {id: 93, name: 'Lebanon'},
    {id: 94, name: 'Lesotho'},
    {id: 95, name: 'Liberia'},
    {id: 96, name: 'Libya'},
    {id: 97, name: 'Liechtenstein'},
    {id: 98, name: 'Lithuania'},
    {id: 99, name: 'Luxembourg'},
    {id: 100, name: 'Madagascar'},
    {id: 101, name: 'Malawi'},
    {id: 102, name: 'Malaysia'},
    {id: 103, name: 'Maldives'},
    {id: 104, name: 'Mali'},
    {id: 105, name: 'Malta'},
    {id: 106, name: 'Marshall Islands'},
    {id: 107, name: 'Mauritania'},
    {id: 108, name: 'Mauritius'},
    {id: 109, name: 'Mexico'},
    {id: 110, name: 'Micronesia'},
    {id: 111, name: 'Moldova'},
    {id: 112, name: 'Monaco'},
    {id: 113, name: 'Mongolia'},
    {id: 114, name: 'Montenegro'},
    {id: 115, name: 'Morocco'},
    {id: 116, name: 'Mozambique'},
    {id: 117, name: 'Myanmar'},
    {id: 118, name: 'Namibia'},
    {id: 119, name: 'Nauru'},
    {id: 120, name: 'Nepal'},
    {id: 121, name: 'Netherlands'},
    {id: 122, name: 'New Zealand'},
    {id: 123, name: 'Nicaragua'},
    {id: 124, name: 'Niger'},
    {id: 125, name: 'Nigeria'},
    {id: 126, name: 'North Korea'},
    {id: 127, name: 'North Macedonia'},
    {id: 128, name: 'Norway'},
    {id: 129, name: 'Oman'},
    {id: 130, name: 'Pakistan'},
    {id: 131, name: 'Palau'},
    {id: 132, name: 'Palestine'},
    {id: 133, name: 'Panama'},
    {id: 134, name: 'Papua New Guinea'},
    {id: 135, name: 'Paraguay'},
    {id: 136, name: 'Peru'},
    {id: 137, name: 'Philippines'},
    {id: 138, name: 'Poland'},
    {id: 139, name: 'Portugal'},
    {id: 140, name: 'Qatar'},
    {id: 141, name: 'Romania'},
    {id: 142, name: 'Russia'},
    {id: 143, name: 'Rwanda'},
    {id: 144, name: 'Saint Kitts and Nevis'},
    {id: 145, name: 'Saint Lucia'},
    {id: 146, name: 'Saint Vincent and the Grenadines'},
    {id: 147, name: 'Samoa'},
    {id: 148, name: 'San Marino'},
    {id: 149, name: 'Sao Tome and Principe'},
    {id: 150, name: 'Saudi Arabia'},
    {id: 151, name: 'Senegal'},
    {id: 152, name: 'Serbia'},
    {id: 153, name: 'Seychelles'},
    {id: 154, name: 'Sierra Leone'},
    {id: 155, name: 'Singapore'},
    {id: 156, name: 'Slovakia'},
    {id: 157, name: 'Slovenia'},
    {id: 158, name: 'Solomon Islands'},
    {id: 159, name: 'Somalia'},
    {id: 160, name: 'South Africa'},
    {id: 161, name: 'South Korea'},
    {id: 162, name: 'South Sudan'},
    {id: 163, name: 'Spain'},
    {id: 164, name: 'Sri Lanka'},
    {id: 165, name: 'Sudan'},
    {id: 166, name: 'Suriname'},
    {id: 167, name: 'Sweden'},
    {id: 168, name: 'Switzerland'},
    {id: 169, name: 'Syria'},
    {id: 170, name: 'Taiwan'},
    {id: 171, name: 'Tajikistan'},
    {id: 172, name: 'Tanzania'},
    {id: 173, name: 'Thailand'},
    {id: 174, name: 'Timor-Leste'},
    {id: 175, name: 'Togo'},
    {id: 176, name: 'Tonga'},
    {id: 177, name: 'Trinidad and Tobago'},
    {id: 178, name: 'Tunisia'},
    {id: 179, name: 'Turkey'},
    {id: 180, name: 'Turkmenistan'},
    {id: 181, name: 'Tuvalu'},
    {id: 182, name: 'Uganda'},
    {id: 183, name: 'Ukraine'},
    {id: 184, name: 'United Kingdom'},
    {id: 185, name: 'United States'},
    {id: 186, name: 'Uruguay'},
    {id: 187, name: 'Uzbekistan'},
    {id: 188, name: 'Vanuatu'},
    {id: 189, name: 'Vatican City'},
    {id: 190, name: 'Venezuela'},
    {id: 191, name: 'Vietnam'},
    {id: 192, name: 'Yemen'},
    {id: 193, name: 'Zambia'},
    {id: 194, name: 'Zimbabwe'}
  ];
  uaeEmirates = [
    { value: '1', label: 'Dubai' },
    { value: '2', label: 'Abu Dhabi' },
    { value: '3', label: 'Sharjah' },
    { value: '4', label: 'Ajman' },
    { value: '5', label: 'Umm Al Quwain' },
    { value: '6', label: 'Ras Al Khaimah' },
    { value: '7', label: 'Fujairah' }
  ];
  openingBalanceTypes = [{id:'1',name:'To Collect'}, {id:'2',name:'To Pay'}];
  countryCodes = [
    {code: '+971', name: 'UAE'},
    {code: '+93', name: 'Afghanistan'},
    {code: '+355', name: 'Albania'},
    {code: '+213', name: 'Algeria'},
    {code: '+376', name: 'Andorra'},
    {code: '+244', name: 'Angola'},
    {code: '+1', name: 'Antigua and Barbuda'},
    {code: '+54', name: 'Argentina'},
    {code: '+374', name: 'Armenia'},
    {code: '+61', name: 'Australia'},
    {code: '+43', name: 'Austria'},
    {code: '+994', name: 'Azerbaijan'},
    {code: '+1', name: 'Bahamas'},
    {code: '+973', name: 'Bahrain'},
    {code: '+880', name: 'Bangladesh'},
    {code: '+1', name: 'Barbados'},
    {code: '+375', name: 'Belarus'},
    {code: '+32', name: 'Belgium'},
    {code: '+501', name: 'Belize'},
    {code: '+229', name: 'Benin'},
    {code: '+975', name: 'Bhutan'},
    {code: '+591', name: 'Bolivia'},
    {code: '+387', name: 'Bosnia and Herzegovina'},
    {code: '+267', name: 'Botswana'},
    {code: '+55', name: 'Brazil'},
    {code: '+673', name: 'Brunei'},
    {code: '+359', name: 'Bulgaria'},
    {code: '+226', name: 'Burkina Faso'},
    {code: '+257', name: 'Burundi'},
    {code: '+855', name: 'Cambodia'},
    {code: '+237', name: 'Cameroon'},
    {code: '+1', name: 'Canada'},
    {code: '+238', name: 'Cape Verde'},
    {code: '+236', name: 'Central African Republic'},
    {code: '+235', name: 'Chad'},
    {code: '+56', name: 'Chile'},
    {code: '+86', name: 'China'},
    {code: '+57', name: 'Colombia'},
    {code: '+269', name: 'Comoros'},
    {code: '+242', name: 'Congo'},
    {code: '+506', name: 'Costa Rica'},
    {code: '+385', name: 'Croatia'},
    {code: '+53', name: 'Cuba'},
    {code: '+357', name: 'Cyprus'},
    {code: '+420', name: 'Czech Republic'},
    {code: '+45', name: 'Denmark'},
    {code: '+253', name: 'Djibouti'},
    {code: '+1', name: 'Dominica'},
    {code: '+1', name: 'Dominican Republic'},
    {code: '+670', name: 'East Timor'},
    {code: '+593', name: 'Ecuador'},
    {code: '+20', name: 'Egypt'},
    {code: '+503', name: 'El Salvador'},
    {code: '+240', name: 'Equatorial Guinea'},
    {code: '+291', name: 'Eritrea'},
    {code: '+372', name: 'Estonia'},
    {code: '+251', name: 'Ethiopia'},
    {code: '+679', name: 'Fiji'},
    {code: '+358', name: 'Finland'},
    {code: '+33', name: 'France'},
    {code: '+241', name: 'Gabon'},
    {code: '+220', name: 'Gambia'},
    {code: '+995', name: 'Georgia'},
    {code: '+49', name: 'Germany'},
    {code: '+233', name: 'Ghana'},
    {code: '+30', name: 'Greece'},
    {code: '+1', name: 'Grenada'},
    {code: '+502', name: 'Guatemala'},
    {code: '+224', name: 'Guinea'},
    {code: '+245', name: 'Guinea-Bissau'},
    {code: '+592', name: 'Guyana'},
    {code: '+509', name: 'Haiti'},
    {code: '+504', name: 'Honduras'},
    {code: '+36', name: 'Hungary'},
    {code: '+354', name: 'Iceland'},
    {code: '+91', name: 'India'},
    {code: '+62', name: 'Indonesia'},
    {code: '+98', name: 'Iran'},
    {code: '+964', name: 'Iraq'},
    {code: '+353', name: 'Ireland'},
    {code: '+972', name: 'Israel'},
    {code: '+39', name: 'Italy'},
    {code: '+1', name: 'Jamaica'},
    {code: '+81', name: 'Japan'},
    {code: '+962', name: 'Jordan'},
    {code: '+7', name: 'Kazakhstan'},
    {code: '+254', name: 'Kenya'},
    {code: '+686', name: 'Kiribati'},
    {code: '+965', name: 'Kuwait'},
    {code: '+996', name: 'Kyrgyzstan'},
    {code: '+856', name: 'Laos'},
    {code: '+371', name: 'Latvia'},
    {code: '+961', name: 'Lebanon'},
    {code: '+266', name: 'Lesotho'},
    {code: '+231', name: 'Liberia'},
    {code: '+218', name: 'Libya'},
    {code: '+423', name: 'Liechtenstein'},
    {code: '+370', name: 'Lithuania'},
    {code: '+352', name: 'Luxembourg'},
    {code: '+261', name: 'Madagascar'},
    {code: '+265', name: 'Malawi'},
    {code: '+60', name: 'Malaysia'},
    {code: '+960', name: 'Maldives'},
    {code: '+223', name: 'Mali'},
    {code: '+356', name: 'Malta'},
    {code: '+692', name: 'Marshall Islands'},
    {code: '+222', name: 'Mauritania'},
    {code: '+230', name: 'Mauritius'},
    {code: '+52', name: 'Mexico'},
    {code: '+691', name: 'Micronesia'},
    {code: '+373', name: 'Moldova'},
    {code: '+377', name: 'Monaco'},
    {code: '+976', name: 'Mongolia'},
    {code: '+382', name: 'Montenegro'},
    {code: '+212', name: 'Morocco'},
    {code: '+258', name: 'Mozambique'},
    {code: '+95', name: 'Myanmar'},
    {code: '+264', name: 'Namibia'},
    {code: '+674', name: 'Nauru'},
    {code: '+977', name: 'Nepal'},
    {code: '+31', name: 'Netherlands'},
    {code: '+64', name: 'New Zealand'},
    {code: '+505', name: 'Nicaragua'},
    {code: '+227', name: 'Niger'},
    {code: '+234', name: 'Nigeria'},
    {code: '+850', name: 'North Korea'},
    {code: '+389', name: 'North Macedonia'},
    {code: '+47', name: 'Norway'},
    {code: '+968', name: 'Oman'},
    {code: '+92', name: 'Pakistan'},
    {code: '+680', name: 'Palau'},
    {code: '+970', name: 'Palestine'},
    {code: '+507', name: 'Panama'},
    {code: '+675', name: 'Papua New Guinea'},
    {code: '+595', name: 'Paraguay'},
    {code: '+51', name: 'Peru'},
    {code: '+63', name: 'Philippines'},
    {code: '+48', name: 'Poland'},
    {code: '+351', name: 'Portugal'},
    {code: '+974', name: 'Qatar'},
    {code: '+40', name: 'Romania'},
    {code: '+7', name: 'Russia'},
    {code: '+250', name: 'Rwanda'},
    {code: '+1', name: 'Saint Kitts and Nevis'},
    {code: '+1', name: 'Saint Lucia'},
    {code: '+1', name: 'Saint Vincent and the Grenadines'},
    {code: '+685', name: 'Samoa'},
    {code: '+378', name: 'San Marino'},
    {code: '+239', name: 'Sao Tome and Principe'},
    {code: '+966', name: 'Saudi Arabia'},
    {code: '+221', name: 'Senegal'},
    {code: '+381', name: 'Serbia'},
    {code: '+248', name: 'Seychelles'},
    {code: '+232', name: 'Sierra Leone'},
    {code: '+65', name: 'Singapore'},
    {code: '+421', name: 'Slovakia'},
    {code: '+386', name: 'Slovenia'},
    {code: '+677', name: 'Solomon Islands'},
    {code: '+252', name: 'Somalia'},
    {code: '+27', name: 'South Africa'},
    {code: '+82', name: 'South Korea'},
    {code: '+211', name: 'South Sudan'},
    {code: '+34', name: 'Spain'},
    {code: '+94', name: 'Sri Lanka'},
    {code: '+249', name: 'Sudan'},
    {code: '+597', name: 'Suriname'},
    {code: '+46', name: 'Sweden'},
    {code: '+41', name: 'Switzerland'},
    {code: '+963', name: 'Syria'},
    {code: '+886', name: 'Taiwan'},
    {code: '+992', name: 'Tajikistan'},
    {code: '+255', name: 'Tanzania'},
    {code: '+66', name: 'Thailand'},
    {code: '+228', name: 'Togo'},
    {code: '+676', name: 'Tonga'},
    {code: '+1', name: 'Trinidad and Tobago'},
    {code: '+216', name: 'Tunisia'},
    {code: '+90', name: 'Turkey'},
    {code: '+993', name: 'Turkmenistan'},
    {code: '+688', name: 'Tuvalu'},
    {code: '+256', name: 'Uganda'},
    {code: '+380', name: 'Ukraine'},
    {code: '+971', name: 'United Arab Emirates'},
    {code: '+44', name: 'United Kingdom'},
    {code: '+1', name: 'United States'},
    {code: '+598', name: 'Uruguay'},
    {code: '+998', name: 'Uzbekistan'},
    {code: '+678', name: 'Vanuatu'},
    {code: '+379', name: 'Vatican City'},
    {code: '+58', name: 'Venezuela'},
    {code: '+84', name: 'Vietnam'},
    {code: '+967', name: 'Yemen'},
    {code: '+260', name: 'Zambia'},
    {code: '+263', name: 'Zimbabwe'}
  ];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    public modalService: NgbModal,
    private api: Api,
    private toast: ToastService
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.partyData?.id) {
      this.loadPartyData(this.partyData.id);
    }
  }

  private loadPartyData(partyId: number) {
    this.isLoading = true;
    this.api.get(`/party/get-party/${partyId}/`).subscribe({
      next: (response: any) => {
        console.log('Party data response:', response.data);
        const formData = {
          ...response.data,
          partyType: response.data.partyType?.toString() || '1',
          contact_code:response.data.contact_code  // Convert party_type to string for radio buttons
        };
        this.partyForm.patchValue(formData);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading party data:', error);
        this.isLoading = false;
      }
    });
  }

  private initForm() {
    this.partyForm = this.fb.group({
      partyName: [, Validators.required],
      partyType: ['1', Validators.required],
      contact_code: ['+971'],
      contact: ['', [ Validators.pattern(/^\d{7,12}$/)]],
      email: [, [Validators.email]],
      trn: [, [Validators.pattern(/^\d{15}$/)]],
      creditLimit: [null],
      creditPeriod: [0],
      openingBalance: [0],
      openingBalanceType: ['1'],
      billingAddress: [, [Validators.maxLength(100)]],
      shippingAddress: [, [Validators.maxLength(150)]],
      sameAsBilling: [false],
      country: [1, Validators.required],
      emirates: ['1'],
      city: [],
      postalCode: [],
      company: [this.api.getUserCompany()],
      id: []
    });

    // Watch both same_as_billing and billing_address changes
    this.partyForm.get('sameAsBilling')?.valueChanges.subscribe(same => {
      if (same) {
        this.partyForm.patchValue({
          shippingAddress: this.partyForm.get('billingAddress')?.value
        });
      }
    });

    this.partyForm.get('billingAddress')?.valueChanges.subscribe(value => {
      if (this.partyForm.get('sameAsBilling')?.value) {
        this.partyForm.patchValue({
          shippingAddress: value
        }, { emitEvent: false });
      }
    });
  }

  onSameAsBillingChange() {
    if (this.partyForm.get('sameAsBilling')?.value) {
      this.partyForm.patchValue({
          shippingAddress: this.partyForm.get('billingAddress')?.value
      });
    }
  }

  onFormSubmit() {
    if (this.partyForm.valid) {
      const formData = this.partyForm.value;
      if (this.mode === 'edit' && this.partyData?.id) {
        this.api.put('/party/update-party/', formData).subscribe({
          next: (response: any) => {
            if (response.status === 200) {
            this.onSubmit.emit(response);
            this.ModalRef.dismiss();
            this.toast.show('Party Updated', 'Party has been updated successfully.', 'success');
            } else {
            }
          },
          error: (error) => {
            console.error('Error updating party:', error);
          }
        });
      } else if (this.mode === 'create') {
        this.api.post('/party/create-party/', formData).subscribe({
          next: (response: any) => {
            if (response.status === 200) {
            this.onSubmit.emit(response);
            this.ModalRef.dismiss();
            this.toast.show('Party Created', 'Party has been created successfully.', 'success');
            } else {
              console.error('Error creating party:', response.message);
              this.toast.show('Party', 'Party has not created something went wrong','warning')
            }
          },
          error: (error) => {
            console.error('Error creating party:', error);
          }
        });
      }
    } else {
      this.markFormGroupTouched(this.partyForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  createParty() {
    const data = this.partyForm.value;
    this.api.post('/party/create-party/', data).subscribe((res) => {
      console.log(res);
    });
  }
}

import { Component, Input, OnInit, Optional } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { Api } from '../../../core/services/api';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-jv',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [DatePipe],
  templateUrl: './create-jv.html',
  styleUrl: './create-jv.scss'
})
export class CreateJv implements OnInit {
  @Input() editinvoiceId: any;
  jvForm!: FormGroup;
  ledgerData1: any[] = [];
  forDebit: number = 0;
  forCredit: number = 0;
  deleteMode: boolean = false;
  myDate: any = new Date();
  
  // Modal and edit mode properties
  @Input() isModal: any = false;
  isEditMode: boolean = false;
  editJvId: any = null;

  constructor(
    private fb: FormBuilder, 
    private datePipe: DatePipe,
    private toast: ToastService,
    private api: Api,
    @Optional() public activeModal?: NgbActiveModal
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadLedgerData();
  }

  // Load ledger data and then check if we need to edit
  loadLedgerData() {
    this.api.post('/journal-voucher/list-all-ledgers/',{company: this.api.getUserCompany()}).subscribe((res:any)=>{
      console.log(res);
      if(res.status === 200){
        this.ledgerData1 = res.data;
        
        // After ledger data is loaded, check if we need to edit
        if(this.editinvoiceId){
          this.getparticular();
        }
      }else{
        this.toast.show('Error', 'Failed to load ledger data', 'danger');
      }
    })
  }
  getcurrency(){
   
    return this.api.getcurrencies();
  }
  getparticular(){
    console.log('Starting edit mode with ID:', this.editinvoiceId);
    console.log('Ledger data available:', this.ledgerData1?.length || 0);
    
    this.api.get('/journal-voucher/get-voucher/'+this.editinvoiceId+'/').subscribe((res:any)=>{
      console.log('API Response:', res);
      if(res.status === 200){
        const voucherData = res.data;
        console.log('Voucher data received:', voucherData);
        
        // Set basic voucher information
        this.jvForm.patchValue({
          voucher_no: voucherData.voucher_no,
          voucher_date: voucherData.voucher_date,
          narration: voucherData.narration
        });
        
        // Set edit mode and ID
        this.isEditMode = true;
        this.editJvId = voucherData.voucher_no;
        
        // Handle the data array (debit/credit entries)
        if (voucherData.data && Array.isArray(voucherData.data)) {
          console.log('Processing voucher entries:', voucherData.data);
          
          // Clear existing form array
          const dataArray = this.jvForm.get('data') as FormArray;
          dataArray.clear();
          
          // Add each entry to the form array
          voucherData.data.forEach((entry: any, index: number) => {
            console.log(`Processing entry ${index}:`, entry);
            
            // Map the API data to the form structure
            const mappedLedger = this.mapLedgerData(entry);
            console.log(`Mapped ledger for entry ${index}:`, mappedLedger);
            
            const ledgerGroup = this.fb.group({
              voucher_type: [entry.voucher_type, Validators.required],
              ledgerdata: [mappedLedger, Validators.required],
              amount: [entry.amount, [Validators.required, Validators.min(0)]]
            });
            
            dataArray.push(ledgerGroup);
          });
        }
        
        // Calculate totals after populating the form
        this.calculateTotals();
        
        console.log('Form populated for editing:', this.jvForm.value);
        this.toast.show('Success', 'Journal voucher loaded for editing', 'success');
      }else{
        console.error('API Error:', res);
        this.toast.show('Error', 'Failed to load journal voucher', 'danger');
      }
    }, (error) => {
      console.error('HTTP Error:', error);
      this.toast.show('Error', 'Failed to load journal voucher', 'danger');
    })
  }

  // Helper method to map API data to ledger data format
  mapLedgerData(entry: any) {
    console.log('Mapping ledger data for entry:', entry);
    console.log('Available ledger data:', this.ledgerData1);
    
    // Create a ledger object that matches the expected format
    let ledgerData = null;
    
    // Try to find ledger by various possible fields
    if (entry.party) {
      console.log('Looking for party:', entry.party);
      ledgerData = this.ledgerData1.find(ledger => 
        ledger.id === entry.party || 
        ledger.party_id === entry.party ||
        ledger.ledger_id === entry.party
      );
    } else if (entry.ledger) {
      console.log('Looking for ledger:', entry.ledger);
      ledgerData = this.ledgerData1.find(ledger => 
        ledger.id === entry.ledger || 
        ledger.ledger_id === entry.ledger
      );
    } else if (entry.cash) {
      console.log('Looking for cash:', entry.cash);
      ledgerData = this.ledgerData1.find(ledger => 
        ledger.id === entry.cash || 
        ledger.type === 'cash'
      );
    } else if (entry.bank) {
      console.log('Looking for bank:', entry.bank);
      ledgerData = this.ledgerData1.find(ledger => 
        ledger.id === entry.bank || 
        ledger.type === 'bank'
      );
    } else if (entry.ledger_name) {
      console.log('Looking for ledger_name:', entry.ledger_name);
      ledgerData = this.ledgerData1.find(ledger => 
        ledger.id === entry.ledger_name || 
        ledger.name === entry.ledger_name
      );
    }
    
    console.log('Found ledger data:', ledgerData);
    
    // If no ledger found, create a fallback object
    if (!ledgerData) {
      console.warn('No ledger data found for entry:', entry);
      // Create a fallback object to prevent form errors
      ledgerData = {
        id: entry.ledger_name || entry.party || entry.ledger || 'unknown',
        name: entry.ledger_name || 'Unknown Ledger',
        type: 'unknown'
      };
    }
    
    return ledgerData;
  }

  initForm() {
    this.jvForm = this.fb.group({
      voucher_no: ['', Validators.required],
      voucher_date: [this.datePipe.transform(this.myDate, 'yyyy-MM-dd'), Validators.required],
      narration: [''],
      data: this.fb.array([])
    });

    // Add initial rows (debit and credit)
    this.addLedger();
    this.addLedger();
  }

  get dataArray() {
    return this.jvForm.get('data') as FormArray;
  }

  addLedger() {
    const ledgerGroup = this.fb.group({
      voucher_type: [this.dataArray.length === 0 ? '1' : '2', Validators.required],
      ledgerdata: [null, Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]]
    });

    this.dataArray.push(ledgerGroup);
    this.calculateTotals();
    
    // Enable delete mode once 3 rows have been added
    if (this.dataArray.length >= 3) {
      this.deleteMode = true;
    }
  }

  deleteLedger(index: number) {
    this.dataArray.removeAt(index);
    this.calculateTotals();
    
    // Disable delete mode if there are less than 3 rows
    if (this.dataArray.length < 3) {
      this.deleteMode = false;
    }
  }

  onPaymentTypeChange(event: any) {
    this.calculateTotals();
  }

  calculateTotals() {
    this.forDebit = 0;
    this.forCredit = 0;

    this.dataArray.controls.forEach(control => {
      const voucherType = control.get('voucher_type')?.value;
      const amount = control.get('amount')?.value || 0;

      if (voucherType === '1') {
        this.forDebit += amount;
      } else if (voucherType === '2') {
        this.forCredit += amount;
      }
    });
  }



  ledgerFunction(event: any) {
    // Handle ledger creation event
    console.log('Ledger created:', event);
    this.loadLedgerData(); // Reload ledger data
  }

  selectInput(event: any) {
    if (event.target) {
      event.target.select();
    }
  }

  submitVoucher() {
    if (this.jvForm.valid) {
      if (this.forDebit === this.forCredit) {
        // Form is valid and totals match
        console.log('Form submitted:', this.jvForm.value);
        
        if (this.isEditMode && this.editJvId) {
          // Update existing voucher
          this.updateVoucher();
        } else {
          // Create new voucher
          this.createVoucher();
        }
      } else {
        this.toast.show('Error', 'Debit and Credit totals must be equal', 'danger');
      }
    } else {
      this.toast.show('Error', 'Please fill all required fields', 'danger');
    }
  }
  
  closeModal() {
    // This will be handled by the parent component that opened the modal
    if (this.activeModal) {
      this.activeModal.close();
      // Close modal logic can be added here if needed
      console.log('Modal close requested');
    }
  }
  
  createVoucher() {
    const formValue = this.jvForm.value;

    // Transform the data array to match the required payload structure
    const transformedData = formValue.data.map((entry: any) => {
      const ledger = entry.ledgerdata;
      return {
        voucher_type: entry.voucher_type,
        name: null,
        amount: entry.amount,
        type: "",
        ledgerdata: ledger,
        ledger_name: ledger?.id ?? null,
        ledger_type: ledger?.type ?? null
      };
    });

    // Build the final payload
    const payload = {
      voucher_no: formValue.voucher_no,
      voucher_date: formValue.voucher_date,
      data: transformedData,
      narration: formValue.narration,
      company: this.api.getUserCompany(),
    };

    console.log('Creating voucher with payload:', payload);

    this.api.post('/journal-voucher/create_voucher/', payload).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.toast.show('Success', 'Journal Voucher created successfully', 'success');
          if (this.isModal) {
            // Close modal and refresh parent data
            this.closeModal();
          }
        } else {
          this.toast.show('Error', 'Failed to create journal voucher', 'danger');
        }
      },
      error: (error) => {
        console.error('Error creating voucher:', error);
        this.toast.show('Error', 'Failed to create journal voucher', 'danger');
      }
    });
  }
  
  updateVoucher() {
    const formValue = this.jvForm.value;

    // Transform the data array to match the required payload structure
    const transformedData = formValue.data.map((entry: any) => {
      const ledger = entry.ledgerdata;
      return {
        voucher_type: entry.voucher_type,
        name: null,
        amount: entry.amount,
        type: "",
        ledgerdata: ledger,
        ledger_name: ledger?.id ?? null,
        ledger_type: ledger?.type ?? null
      };
    });

    // Build the final payload
    const payload = {
      id: this.editJvId,
      voucher_no: formValue.voucher_no,
      voucher_date: formValue.voucher_date,
      data: transformedData,
      narration: formValue.narration,
      company: this.api.getUserCompany(),
    };

    console.log('Updating voucher with payload:', payload);

    this.api.put('/journal-voucher/update-voucher/', payload).subscribe({
      next: (response: any) => {
        if (response.status === 200) {
          this.toast.show('Success', 'Journal Voucher updated successfully', 'success');
          if (this.isModal) {
            // Close modal and refresh parent data
            this.closeModal();
          }
        } else {
          this.toast.show('Error', 'Failed to update journal voucher', 'danger');
        }
      },
      error: (error) => {
        console.error('Error updating voucher:', error);
        this.toast.show('Error', 'Failed to update journal voucher', 'danger');
      }
    });
  }
}

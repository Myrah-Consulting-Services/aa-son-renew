import { Component, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Party } from '../../parties/party/party';
import { CreateCash } from "../create-cash/create-cash";
import { CreateBank } from "../create-bank/create-bank";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Api } from '../../../core/services/api';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../core/services/toast.service';
(pdfMake as any).vfs = (pdfFonts as any).vfs;

@Component({
  selector: 'app-payment-in',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TranslateModule, Party, CreateCash, CreateBank],
  templateUrl: './payment-in.html',
  styleUrl: './payment-in.scss'
})
export class PaymentIn {
  @Input() modalRef: any;

  @Input() isModal: any
  @Input() editinvoiceId: any
  paymentIn: FormGroup;
  loading = false;
  disabledbutton = false;
  // Dummy data for autocomplete and select fields
  received_F: any[] = [];
  for_received: any[] = [];
  c_Ledger: any[] = [];
 
  invoiceList: any[] = [];
  keyword = '';
  keyword1 = '';
  keyword2 = '';
  keyword3 = '';
  keyword4 = '';
  v1 = true;
  v2 = true;
  show = false;
  name: any;
  tempBalAmt: any;
  partyModalRef: any;
  emit_Ledger2: any;
  bank_P1: any;
  receiptSaved = false;
  bankList: any;
  

  constructor(private fb: FormBuilder, private api: Api, private toast: ToastService, @Optional() public activeModal?: NgbActiveModal) {
    this.paymentIn = this.fb.group({
      receipt_no: [''],
      balance_amt: [0],
      receipt_date: ['', Validators.required],
      received_for1: [null, Validators.required],
      received_for: [null],
      party: [null],
      party_name1: [null],
      ledger_name1: [null],
      ledger: [null],
      amount: [0, [Validators.required, Validators.min(1)]],
      payment_type: ['', Validators.required],
      payment_for: [[], Validators.required],
      handover_to: [null],
      bank: [null],
      cheque_no: [''],
      cleared_date: [''],
      reference_no: [''],
      notes: [''],
      invoice_list: [[]],
      company: [this.api.getUserCompany()],
      id: [null]
    });

    // Hardcoded data for development/testing


   
    

    // Set default values
    const today = new Date();
    this.paymentIn.patchValue({
      receipt_no: this.generateReceiptNo(),
      receipt_date: today.toISOString().slice(0, 10),
      cleared_date: today.toISOString().slice(0, 10),
      payment_type: '1' // Default to Cash
    });
  }
  ngOnInit() {
    this.getledgers();
    this.getCashList();
    this.getBankList();
    if(this.editinvoiceId){
      this.getparticulars();
    }
  }
  getparticulars(){
    if (!this.editinvoiceId) return;
    
    this.loading = true; // Set loading to true when starting to fetch data
    
    this.api.post('/money/particular_payment/'+this.editinvoiceId+'/',{
      company:this.api.getUserCompany()
    }).subscribe({
      next: (res: any) => {
        console.log(res);
        if(res.status == 200){
          const data = res.data;
          
          // Parse JSON strings
          const paymentFor = data.payment_for ? JSON.parse(data.payment_for) : [];
          const invoiceList = data.invoice_list ? JSON.parse(data.invoice_list) : [];
          
          // Populate the form
          this.paymentIn.patchValue({
            receipt_no: data.receipt_no,
            receipt_date: data.receipt_date,
            amount: data.amount,
            payment_for: paymentFor,
            cheque_no: data.cheque_no,
            cleared_date: data.cleared_date,
            reference_no: data.reference_no,
            notes: data.notes,
            payment_type: data.payment_type,
            handover_to: data.handover_to,
            bank: data.bank,
            company: data.company,
            id: data.id
          });
          
          // Set party and ledger if available
          if (data.party) {
            this.paymentIn.patchValue({
              party: data.party,
              party_name1: { id: data.party }
            });
            
            // Fetch all available invoices for this party
            this.fetchInvoicesForParty(data.party);
          }
          
          if (data.received_for) {
            // First ensure received_F is loaded, then set the value
            if (this.received_F.length > 0) {
              this.setReceivedForAndParty(data);
            } else {
              // Wait for received_F to load, then set the values
              setTimeout(() => {
                this.setReceivedForAndParty(data);
              }, 1000);
            }
          }
          
          // Set invoice list and calculate balances
          if (invoiceList.length > 0) {
            // Wait for fetchInvoicesForParty to complete, then mark previously selected invoices
            setTimeout(() => {
              // Ensure invoices are loaded before marking
              if (this.invoiceList && this.invoiceList.length > 0) {
                this.markPreviouslySelectedInvoices(invoiceList);
              } else {
                // If invoices not loaded yet, wait a bit more
                setTimeout(() => {
                  this.markPreviouslySelectedInvoices(invoiceList);
                }, 1000);
              }
            }, 1000);
            
            this.tempBalAmt = data.balance_amt;
            this.paymentIn.get('invoice_list')?.setValue(invoiceList);
            
            // Force show invoice table for edit mode
            this.show = true;
          }
          
          // Set loading to false after all data is processed
          this.loading = false;
        } else {
          this.loading = false; // Set loading to false even if there's an error
        }
      },
      error: (error) => {
        console.error('Error fetching payment details:', error);
        this.loading = false; // Set loading to false on error
      }
    });
  }
  getledgers() {
    this.api.post('/money/recieved-for/', { company:this.api.getUserCompany() }).subscribe((res: any) => {
      console.log(res);
      if (res.status == 200) {
        this.received_F = res.data;
        this.paymentIn.patchValue({
          received_for1: this.received_F[13]
        });
        this.getpaidledgers(this.paymentIn.value.received_for1?.id);
      }
    });
  }
  getpaidledgers(a:any) {
    this.api.post('/money/paid-received/'+this.api.getUserCompany()+'/', {"ledger_under": a}).subscribe((res: any) => {
      console.log(res);
      if (res.status == 200) {
        this.for_received = res.data;
      }
    });
  }
  getCashList(){
    this.api.get('/money/list-cash/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Cash list:', response);
        if(response.status === 200){
          this.c_Ledger = response.data;
          if(this.c_Ledger.length > 0){ 
            this.paymentIn.patchValue({
              handover_to: this.c_Ledger[0].id
            })
          }
        }
      }
    });
  }
  getBankList(){
    this.api.get('/money/list-bank/'+this.api.getUserCompany()+'/').subscribe({
      next: (response: any) => {
        console.log('Bank list:', response);
        if(response.status === 200){
          this.bankList = response.data;
          if(this.bankList.length > 0){
            this.paymentIn.patchValue({
              bank: this.bankList[0].id
            })
          }
          console.log('Bank list:', this.bankList);
        }
      }
    });
  }
  submit() {
    const formData = this.paymentIn.value;
    formData.handover_to = this.paymentIn.value.handover_to ?? null;
    formData.bank = this.paymentIn.value.bank ?? null;
    formData.reference_no = this.paymentIn.value.reference_no ?? null;
    formData.notes = this.paymentIn.value.notes ?? null;
    formData.cheque_no = this.paymentIn.value.cheque_no ?? null;
    formData.cleared_date = this.paymentIn.value.cleared_date ?? null;
    formData.received_for = this.paymentIn.value.received_for1?.id ?? null;
    formData.party = this.paymentIn.value.party_name1?.id ?? null;
    formData.ledger = this.paymentIn.value.ledger_name1?.id ?? null;
    formData.balance_amt = this.tempBalAmt ?? 0;
    // Set fields to null based on payment_type
    if (formData.payment_type === '1') { // Cash
      formData.bank = null;
      formData.cheque_no = null;
      formData.reference_no = null;
    } else if (formData.payment_type === '2') { // Cheque
      formData.reference_no = null;
      formData.handover_to = null;
    } else if (formData.payment_type === '3') { // Bank Transfer
      formData.handover_to = null;
      formData.cheque_no = null;
    }
    if(this.editinvoiceId){
      formData.id = this.editinvoiceId;
      this.api.put('/money/Edit_PaymentIn_AgainstInvoice/'+this.editinvoiceId+'/', formData).subscribe((res: any) => {
        console.log(res);
        if (res.status == 200) {
          this.receiptSaved = true;
          this.toast.show('Success','Payment updated successfully','success');
          this.modalRef.close();
        }else{
          this.toast.show('Error','Payment updated failed','danger');
        }
      });
    }else{
    this.api.post('/money/pay_against_inv/', formData).subscribe((res: any) => {
      console.log(res);
      if (res.status == 200) {
        this.receiptSaved = true;
        this.paymentIn.reset();
        this.toast.show('Success','Payment received successfully','success');
        this.modalRef.close();
      }else{
        this.toast.show('Error','Payment received failed','danger');
      }
    });
  }
    // console.log(this.invoiceList,'invoiceList');
    console.log(formData,'paymentIn');
    // if (this.paymentIn.valid) {
    // Submit logic here (fake save for now)
    
    // Optionally, reset form or show a message
    // }
  }

  downloadReceipt() {
    const form = this.paymentIn.value;
    const docDefinition = {
      content: [
        { text: 'Payment Receipt', style: 'header' },
        { text: `Receipt No: ${form.receipt_no}` },
        { text: `Date: ${form.receipt_date}` },
        { text: `Party: ${form.party_name1?.Party_name || 'N/A'}` },
        { text: `Amount: ₹${form.amount}` },
        { text: `Payment Mode: ${form.payment_type === '1' ? 'Cash' : form.payment_type === '2' ? 'Cheque' : 'Bank Transfer'}` },
        { text: `Notes: ${form.notes || '-'}` },
        { text: '---' },
        { text: 'Thank you for your payment!', style: 'footer' }
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] as [number, number, number, number] },
        footer: { italics: true, margin: [0, 20, 0, 0] as [number, number, number, number] }
      }
    };
    pdfMake.createPdf(docDefinition).open(); // open preview, or use .download('receipt.pdf')
  }

  // Stub methods for template events
  getPaid(event: any) { }
  invoice_Details(event: any) { }
  onFocused(event: any) { }
  chngeA(aa: number) {
    for (const [index, y] of this.invoiceList.entries()) {
      y.checked = false;
      y.a = y.remaining_amt; // Always reset to original pending
      y.deductedAmount = 0;
      let event = {
        target: {
          checked: false
        }
      };
      this.checkDta(event, index);
    }
    this.tempBalAmt = aa;
  }
  datetime(paymentType: any) { }
  checkbox() { }
  valueget(event: any) { }
  checkDta(event: any, i: number) {
    const checked = event.target.checked;
    this.invoiceList[i].checked = checked;
    const mainAmount = this.paymentIn.value.amount;

    // Calculate the total already deducted (excluding the current invoice)
    const totalDeductedOther = this.invoiceList
      .filter((inv, idx) => inv.checked && idx !== i)
      .reduce((sum, inv) => sum + (inv.deductedAmount || 0), 0);

    // Calculate the available balance for this invoice
    const available = mainAmount - totalDeductedOther;

    if (checked) {
      if (available <= 0) {
        this.invoiceList[i].deductedAmount = 0;
        this.invoiceList[i].a = this.invoiceList[i].remaining_amt;
        this.invoiceList[i].checked = false;
        return;
      }
      const deductedAmount = Math.min(available, this.invoiceList[i].a);
      this.invoiceList[i].deductedAmount = deductedAmount;
      this.invoiceList[i].a = this.invoiceList[i].remaining_amt - deductedAmount;
    } else {
      this.invoiceList[i].a = this.invoiceList[i].remaining_amt;
      this.invoiceList[i].deductedAmount = 0;
    }

    // Update tempBalAmt to reflect the new total deducted
    const totalDeducted = this.invoiceList.filter(inv => inv.checked).reduce((sum, inv) => sum + (inv.deductedAmount || 0), 0);
    this.tempBalAmt = mainAmount - totalDeducted;

    // Update invoice_list in the form
    const invoiceListFormValue = this.invoiceList
      .filter(inv => inv.checked)
      .map(inv => ({
        inv_id: inv.id,
        inv_amt: inv.deductedAmount,
        old_value: inv.remaining_amt,
        invoice_no: inv.invoice_no
      }));
    this.paymentIn.get('invoice_list')?.setValue(invoiceListFormValue);
  }
  inExtraLarge(modal: any) {
    // this.modalRef = modal;
  }
  largeModal2(modal: any) { }
  largeModalbank(modal: any) { }
  cashAddLedger(event: any) { }
  addBankFunction(event: any) { }
  partyCreateFunction(event: any) { }
  ledgerAFunction(event: any) { }

  // Update show logic: show invoice table only if party is selected and 'AGAINST INVOICE' is selected
  ngDoCheck() {
    const partySelected = !!this.paymentIn.value.party_name1;
    const againstInvoiceSelected = Array.isArray(this.paymentIn.value.payment_for) && this.paymentIn.value.payment_for.includes('2');
    
    // Show invoice table if:
    // 1. Party is selected AND 'AGAINST INVOICE' is selected (for new payments)
    // 2. OR if we're editing and have invoice data (for edit mode)
    this.show = (partySelected && againstInvoiceSelected) || 
                (this.editinvoiceId && this.invoiceList.length > 0);
  }

  get selectedInvoiceCount(): number {
    return Array.isArray(this.invoiceList) ? this.invoiceList.filter(inv => inv.checked).length : 0;
  }

  get selectedInvoiceTotal(): number {
    return Array.isArray(this.invoiceList)
      ? this.invoiceList.filter(inv => inv.checked).reduce((sum, inv) => sum + (inv.deductedAmount || 0), 0)
      : 0;
  }

  fetchInvoicesForParty(partyId: number) {
    // allparty-wise-sales/<int:party_id>/<int:invoice_type_id>/ used this while edit mode else used below api
    if(this.editinvoiceId){
      this.api.get(`/invoice/allparty-wise-sales/${partyId}/1/`+this.api.getUserCompany()+`/`).subscribe({
        next: (data: any) => {
          if (data.status == 200) {
            this.invoiceList = data.data;
            this.invoiceList.forEach(element => {
              element.checked = false;
              element.deductedAmount = 0;
              element.a = element.remaining_amt;
            });
          }else{
            this.invoiceList = [];
          }
        },
        error: () => {
          this.invoiceList = [];
        }
      });
    }else{
      this.api.get(`/invoice/party-wise-sales/${partyId}/`+1+`/`+this.api.getUserCompany()+`/`).subscribe({
      next: (data: any) => {
        if (data.status == 200) {
          this.invoiceList = data.data;
          this.invoiceList.forEach(element => {
            element.checked = false;
            element.deductedAmount = 0;
            element.a = element.remaining_amt;
          });
        } else {
          this.invoiceList = [];
        }
      },
      error: () => {
        this.invoiceList = [];
      }
    });}
  }

  onPartySelected() {
    console.log('working');
    
    const party = this.paymentIn.get('party_name1')?.value;
    const paymentFor = this.paymentIn.get('payment_for')?.value;
    if (party && party.id) {
      this.fetchInvoicesForParty(party.id);
    } else {
      this.invoiceList = [];
    }
  }
  close() {
    if (this.activeModal) {
      this.activeModal.close();
    }
  }

  generateReceiptNo() {
    // Generate short receipt number with year and month
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const receiptNo = `RCPT-${year}${month}`;
    return receiptNo;
  }

  // Mark previously selected invoices when editing
  markPreviouslySelectedInvoices(previousInvoiceList: any[]) {
    if (!previousInvoiceList || !this.invoiceList) return;
    
    console.log('Previous invoice list:', previousInvoiceList);
    console.log('Current invoice list:', this.invoiceList);
    
    // Mark previously selected invoices as checked
    this.invoiceList.forEach(invoice => {
      // Find the previously selected invoice by matching invoice_id
      const previousInvoice = previousInvoiceList.find(prev => prev.inv_id === invoice.id);
      
      if (previousInvoice) {
        console.log('Marking invoice as checked:', invoice.invoice_no, previousInvoice);
        invoice.checked = true;
        invoice.deductedAmount = previousInvoice.inv_amt;
        invoice.a = previousInvoice.old_value - previousInvoice.inv_amt;
        invoice.remaining_amt = previousInvoice.old_value;
      } else {
        invoice.checked = false;
        invoice.deductedAmount = 0;
        invoice.a = invoice.remaining_amt;
      }
    });
    
    // Update form invoice_list
    const invoiceListFormValue = this.invoiceList
      .filter(inv => inv.checked)
      .map(inv => ({
        inv_id: inv.id,
        inv_amt: inv.deductedAmount,
        old_value: inv.remaining_amt,
        invoice_no: inv.invoice_no
      }));
    this.paymentIn.get('invoice_list')?.setValue(invoiceListFormValue);
    
    console.log('Updated invoice list:', this.invoiceList);
    console.log('Form invoice_list value:', invoiceListFormValue);
  }

  // Set received_for and party values after ensuring dependent data is loaded
  setReceivedForAndParty(data: any) {
    // Find the received_for object from received_F array
    const receivedForObj = this.received_F.find(item => item.id === data.received_for);
    if (receivedForObj) {
      this.paymentIn.patchValue({
        received_for1: receivedForObj
      });
      
      // Now get the paid ledgers for this received_for
      this.getpaidledgers(data.received_for);
      
      // Wait for for_received to load, then set party
      setTimeout(() => {
        if (this.for_received.length > 0) {
          const partyObj = this.for_received.find(item => item.id === data.party);
          if (partyObj) {
            this.paymentIn.patchValue({
              party_name1: partyObj
            });
            console.log('Party set successfully:', partyObj);
          }
        }
      }, 500);
    }
  }
}

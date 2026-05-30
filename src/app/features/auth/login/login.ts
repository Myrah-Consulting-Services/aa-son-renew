import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../../core/services/auth';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  loginForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private auth: Auth,
    private toast: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      ip:['', []],
      loc:['', []],
      portal_type:['', []], // 1 account and warehouse 2 POS portal
    });
  }

  ngOnInit() {
    this.fetch_currentIP();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  fetch_currentIP(){
    console.log('Fetching current IP and location...');
    
          let ip = this.auth.getUserIp().subscribe({
            next: (response:any) => {
              if(response && response.ip){ 
                console.log('IP Address:', response.ip);
                this.loginForm.patchValue({ ip: response.ip });
              }
            },
            error: (error:any) => {
              console.error('Error fetching IP address:', error);
              this.toast.show('Error', 'Failed to fetch IP address', 'danger');
            }
          });
          let loc = this.auth.getUserLocation().subscribe({
            next: (response:any) => {
              if(response && response.loc){
                console.log('Location:', response.loc);
                this.loginForm.patchValue({ loc: response.loc });
              }
            },
            error: (error:any) => {
              console.error('Error fetching location:', error);
              this.toast.show('Error', 'Failed to fetch location', 'danger');
            }
          });
          //this.loginForm.patchValue({ ip: ip });
          // this.loginForm.patchValue({ loc: loc });
          this.loginForm.patchValue({ portal_type: 1 }); // Default to account and warehouse portal

  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      this.auth.login(this.loginForm.value).subscribe({
        next: (res:any) => {
          if(res.status==200){
            this.isLoading = false;
            this.toast.show('Success', 'Login successful', 'success');
          }else{
            this.isLoading = false;
            this.toast.show('Error', res.data, 'danger');
          }
          
          
          // Navigation is handled in the Auth service after successful login
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Login failed. Please try again.';
          this.toast.show('Error', this.errorMessage, 'danger');
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
      this.toast.show('Error', 'Please fill all required fields correctly', 'danger');
    }
  }
}

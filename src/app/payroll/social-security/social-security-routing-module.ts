import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BenefitDetails } from './benefit-details/benefit-details';
import { PensionModal } from './pension-modal/pension-modal';


const routes: Routes = [
  { path: 'benefits', component: BenefitDetails },
  { path: 'pension', component: PensionModal },
  { path: '', redirectTo: 'benefits', pathMatch: 'full' }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SocialSecurityRoutingModule { }

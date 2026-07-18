import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TestIntegration } from '../Setting/test-integration/test-integration';

@Component({
  selector: 'app-platform-integration-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TestIntegration],
  templateUrl: './platform-integration-page.html',
  styleUrl: './platform-integration-page.scss',
})
export class PlatformIntegrationPage {}

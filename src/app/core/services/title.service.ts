import { Injectable } from '@angular/core';
import { Api } from './api';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  constructor(
    private api: Api
  ) {}

  /**
   * Set the document title with company name
   */
  setCompanyTitle() {
    // First try to get from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const companyName = user[0]?.company[0]?.company_name || user[0]?.company[0]?.business_name;
        if (companyName) {
          document.title = `ESARWA | ${companyName}`;
          return;
        }
      } catch (error) {
        console.warn('Error parsing user data from localStorage:', error);
      }
    }

    // If not in localStorage, try to get from API
    const companyId = this.api.getUserCompany();
    if (companyId) {
      this.api.get(`/company/get-company/${companyId}/`).subscribe({
        next: (res: any) => {
          if (res.status === 200 && res.data) {
            const companyName = res.data.business_name || res.data.company_name || 'Company';
            document.title = `ESARWA | ${companyName}`;
          } else {
            document.title = 'ESARWA | Company';
          }
        },
        error: (error: any) => {
          console.warn('Error fetching company data:', error);
          document.title = 'ESARWA | Company';
        }
      });
    } else {
      document.title = 'ESARWA | Company';
    }
  }

  /**
   * Set a custom title
   */
  setTitle(title: string) {
    if (title && title.trim()) {
      document.title = `ESARWA | ${title.trim()}`;
    }
  }

  /**
   * Set default title
   */
  setDefaultTitle() {
    document.title = 'ESARWA | Company';
  }

  /**
   * Get current title
   */
  getTitle(): string {
    return document.title;
  }

  /**
   * Refresh title from localStorage or API
   * Useful when user logs in/out or company data changes
   */
  refreshTitle() {
    this.setCompanyTitle();
  }

  /**
   * Set page-specific title while maintaining ESARWA prefix
   * @param pageTitle The specific page title
   */
  setPageTitle(pageTitle: string) {
    if (pageTitle && pageTitle.trim()) {
      document.title = `ESARWA | ${pageTitle.trim()}`;
    }
  }
}

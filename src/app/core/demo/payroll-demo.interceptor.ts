import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { PayrollLocalStore } from './payroll-local.store';

export const payrollDemoInterceptor: HttpInterceptorFn = (req, next) => {
  const store = inject(PayrollLocalStore);
  if (!store.isPayrollUrl(req.url)) {
    return next(req);
  }

  const extra: Record<string, string> = {};
  req.params.keys().forEach((key) => {
    extra[key] = req.params.get(key) || '';
  });

  const body = store.handleRequest(req.method, req.url, req.body, extra);
  return of(new HttpResponse({
    status: 200,
    body,
    url: req.url,
  }));
};

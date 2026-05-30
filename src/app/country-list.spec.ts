import { TestBed } from '@angular/core/testing';

import { CountryList } from './country-list';

describe('CountryList', () => {
  let service: CountryList;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CountryList);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierTransactionsComponent } from './supplier-transactions.component';

describe('SupplierTransactionsComponent', () => {
  let component: SupplierTransactionsComponent;
  let fixture: ComponentFixture<SupplierTransactionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SupplierTransactionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleDealsComponent } from './bundle-deals.component';

describe('BundleDealsComponent', () => {
  let component: BundleDealsComponent;
  let fixture: ComponentFixture<BundleDealsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BundleDealsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundleDealsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

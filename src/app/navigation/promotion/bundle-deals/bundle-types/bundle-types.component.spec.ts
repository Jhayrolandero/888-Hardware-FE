import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BundleTypesComponent } from './bundle-types.component';

describe('BundleTypesComponent', () => {
  let component: BundleTypesComponent;
  let fixture: ComponentFixture<BundleTypesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BundleTypesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundleTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

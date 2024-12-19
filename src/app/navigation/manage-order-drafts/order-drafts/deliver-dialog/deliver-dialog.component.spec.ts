import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverDialogComponent } from './deliver-dialog.component';

describe('DeliverDialogComponent', () => {
  let component: DeliverDialogComponent;
  let fixture: ComponentFixture<DeliverDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliverDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliverDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

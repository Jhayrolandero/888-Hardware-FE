import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMassComponent } from './add-mass.component';

describe('AddMassComponent', () => {
  let component: AddMassComponent;
  let fixture: ComponentFixture<AddMassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddMassComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

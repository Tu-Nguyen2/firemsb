import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MsbComponent } from './msb.component';

describe('MsbComponent', () => {
  let component: MsbComponent;
  let fixture: ComponentFixture<MsbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MsbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MsbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

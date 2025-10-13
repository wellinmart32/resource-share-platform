import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MyDonationsComponent } from './my-donations.component';

describe('MyDonationsComponent', () => {
  let component: MyDonationsComponent;
  let fixture: ComponentFixture<MyDonationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MyDonationsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyDonationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

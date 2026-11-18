import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  it('renders the translated app name', async () => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()],
    });
    const fixture = TestBed.createComponent(FooterComponent);
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'app.name',
    );
  });
});

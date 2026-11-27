import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ExampleService } from '@core/api/example-api/example/example.service';
import MainComponent from './main.component';

describe('MainComponent', () => {
  const exampleService = { getExample: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        { provide: ExampleService, useValue: exampleService },
      ],
    });
  });

  it('renders the data returned by the API', async () => {
    exampleService.getExample.mockResolvedValue({ example: 'API data' });
    const fixture = TestBed.createComponent(MainComponent);

    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(exampleService.getExample).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('API data');
    expect(host.textContent).not.toContain('main.exampleLoading');
  });

  it('shows the loading text until the API answers', async () => {
    exampleService.getExample.mockReturnValue(new Promise(() => undefined));
    const fixture = TestBed.createComponent(MainComponent);

    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'main.exampleLoading',
    );
  });
});

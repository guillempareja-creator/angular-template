import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ExampleService } from '@core/api/example/example.service';
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

    expect(exampleService.getExample).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'API data',
    );
  });

  it('renders the empty state while there is no data', async () => {
    exampleService.getExample.mockReturnValue(new Promise(() => undefined));
    const fixture = TestBed.createComponent(MainComponent);

    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'main.exampleEmpty',
    );
  });
});

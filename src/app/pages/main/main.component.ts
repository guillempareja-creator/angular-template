import {
  ChangeDetectionStrategy,
  Component,
  inject,
  type OnInit,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ExampleService } from '@core/api/example/example.service';
import type { GetExampleResponse } from '@core/api/example/example.types';

/**
 * Template example page: shows the full flow
 * API service (`core/api/`) → signal → template with i18n.
 * Replace it with the first real screen of the application.
 */
@Component({
  selector: 'app-main',
  imports: [TranslatePipe],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MainComponent implements OnInit {
  // Injections
  private exampleService = inject(ExampleService);

  // Data
  public readonly example = signal<GetExampleResponse | null>(null);

  // Methods
  public ngOnInit(): void {
    void this.loadExample();
  }

  private async loadExample(): Promise<void> {
    const response = await this.exampleService.getExample();
    this.example.set(response);
  }
}

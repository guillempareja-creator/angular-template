import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  // Data
  private readonly activeRequests = signal<number>(0);

  // Computeds
  public readonly isLoading = computed(() => this.activeRequests() > 0);

  // Methods
  public show(): void {
    this.activeRequests.update((count) => count + 1);
  }

  public hide(): void {
    this.activeRequests.update((count) => Math.max(0, count - 1));
  }
}

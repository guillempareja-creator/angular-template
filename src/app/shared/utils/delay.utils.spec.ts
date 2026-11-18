import { sleep } from './delay.utils';

describe('sleep', () => {
  it('should resolve after the given time', async () => {
    vi.useFakeTimers();
    const promise = sleep(1000);

    vi.advanceTimersByTime(1000);

    await expect(promise).resolves.not.toThrow();
    vi.useRealTimers();
  });
});

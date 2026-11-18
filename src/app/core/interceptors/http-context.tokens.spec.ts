import {
  DEFAULT_SUCCESS_MESSAGE,
  requestContext,
  SHOW_LOADER,
  SUCCESS_MESSAGE,
} from './http-context.tokens';

describe('requestContext', () => {
  it('shows the loader and no success message by default', () => {
    const context = requestContext({});

    expect(context.get(SHOW_LOADER)).toBe(true);
    expect(context.get(SUCCESS_MESSAGE)).toBeNull();
  });

  it('applies the given options', () => {
    const context = requestContext({
      showLoader: false,
      successMessage: DEFAULT_SUCCESS_MESSAGE,
    });

    expect(context.get(SHOW_LOADER)).toBe(false);
    expect(context.get(SUCCESS_MESSAGE)).toBe('default');
  });
});

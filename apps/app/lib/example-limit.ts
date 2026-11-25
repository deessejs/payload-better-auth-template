import { APIError } from 'payload';

export const EXAMPLE_LIMIT_MESSAGE = 'You have reached the limit of 10 records for your account.';

export class ExampleLimitError extends APIError {
  constructor() {
    super(EXAMPLE_LIMIT_MESSAGE, 409, undefined, true);
    this.name = 'ExampleLimitError';
  }
}

export class EcoleDirecteError extends Error {
  constructor(message: string, public code?: number) {
    super(message);
    this.name = 'EcoleDirecteError';
  }
}

export class EcoleDirecteAuthError extends EcoleDirecteError {
  constructor(message: string, code?: number) {
    super(message, code);
    this.name = 'EcoleDirecteAuthError';
  }
}

export class EcoleDirecteAPIError extends EcoleDirecteError {
  constructor(message: string, code?: number, public host?: string) {
    super(message, code);
    this.name = 'EcoleDirecteAPIError';
  }
}

export class EcoleDirecteAccountTypeError extends EcoleDirecteError {
  constructor(message: string = 'Account type not supported (only Student "E" is allowed)') {
    super(message, 505);
    this.name = 'EcoleDirecteAccountTypeError';
  }
}

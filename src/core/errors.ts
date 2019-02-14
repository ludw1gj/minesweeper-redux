export class IllegalStateError extends Error {
  public name: string;

  constructor(message: string) {
    super(message);
    this.name = 'IllegalStateError';
  }
}

export class IllegalParameterError extends Error {
  public name: string;

  constructor(message: string) {
    super(message);
    this.name = 'IllegalParameterError';
  }
}

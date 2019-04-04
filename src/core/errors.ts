/** Error representing illegal state has occurred. */
export class IllegalStateError extends Error {
  public name: string;

  constructor(message: string) {
    super(message);
    this.name = 'IllegalStateError';
  }
}

/** Error representing illegal parameters were given. */
export class IllegalParameterError extends Error {
  public name: string;

  constructor(message: string) {
    super(message);
    this.name = 'IllegalParameterError';
  }
}

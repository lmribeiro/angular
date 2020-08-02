/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export interface AstHost<TExpression> {
  getSymbolName(node: TExpression): string|null;

  parseStringLiteral(node: TExpression): string;

  parseNumberLiteral(node: TExpression): number;

  parseBooleanLiteral(node: TExpression): boolean;

  parseArrayLiteral(node: TExpression): TExpression[];

  parseObjectLiteral(node: TExpression): Map<string, TExpression>;
}

export function isFatalLinkerError(e: any): e is FatalLinkerError {
  return e.type === 'FatalLinkerError';
}

export class FatalLinkerError extends Error {
  private readonly type = 'FatalLinkerError';

  constructor(public node: unknown, message: string) {
    super(message);
  }
}

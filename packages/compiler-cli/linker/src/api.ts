/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export interface AstHost<TExpression> {
  getSymbolName(node: TExpression): string|null;

  isStringLiteral(node: TExpression): boolean;
  parseStringLiteral(node: TExpression): string;

  isNumberLiteral(node: TExpression): boolean;
  parseNumberLiteral(node: TExpression): number;

  isBooleanLiteral(node: TExpression): boolean;
  parseBooleanLiteral(node: TExpression): boolean;

  isArrayLiteral(node: TExpression): boolean;
  parseArrayLiteral(node: TExpression): TExpression[];

  isObjectLiteral(node: TExpression): boolean;
  parseObjectLiteral(node: TExpression): Map<string, TExpression>;

  isFunction(node: TExpression): boolean;
  unwrapFunction(node: TExpression): TExpression;

  getRange(node: TExpression): Range;
}

export interface Range {
  startPos: number;
  startLine: number;
  startCol: number;
  endPos: number;
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

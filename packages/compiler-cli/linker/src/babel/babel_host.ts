/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as t from '@babel/types';
import {AstHost, FatalLinkerError, Range} from '../api';
import {assert, extractRightMostName} from './source_file_utils';

export class BabelAstHost implements AstHost<t.Expression> {
  getSymbolName(node: t.Expression): string|null {
    return extractRightMostName(node);
  }

  isStringLiteral = t.isStringLiteral;

  parseStringLiteral(node: t.Expression): string {
    assert(node, t.isStringLiteral, 'a string literal');
    return node.value;
  }

  isNumberLiteral = t.isNumberLiteral;

  parseNumberLiteral(node: t.Expression): number {
    assert(node, t.isNumericLiteral, 'a number literal');
    return node.value;
  }

  isBooleanLiteral = t.isBooleanLiteral;

  parseBooleanLiteral(node: t.Expression): boolean {
    assert(node, t.isBooleanLiteral, 'a boolean literal');
    return node.value;
  }

  isArrayLiteral = t.isArrayExpression;

  parseArrayLiteral(node: t.Expression): t.Expression[] {
    assert(node, t.isArrayExpression, 'an array literal');
    return node.elements.filter(
        (element): element is t.Expression => element !== null && t.isExpression(element));
  }

  isObjectLiteral = t.isObjectExpression;

  parseObjectLiteral(node: t.Expression): Map<string, t.Expression> {
    assert(node, t.isObjectExpression, 'an object literal');

    const result = new Map<string, t.Expression>();
    for (const property of node.properties) {
      assert(property, t.isObjectProperty, 'a property assignment');
      assert(property.value, t.isExpression, 'an expression');

      let key: string;
      if (t.isIdentifier(property.key)) {
        key = property.key.name;
      } else if (t.isStringLiteral(property.key)) {
        key = property.key.value;
      } else {
        throw new FatalLinkerError(property.key, 'Unsupported syntax, expected a property name');
      }

      result.set(key, property.value);
    }
    return result;
  }

  isFunction = t.isFunction;

  unwrapFunction(node: t.Expression): t.Expression {
    assert(node, t.isFunction, 'a function');
    assert(node.body, t.isBlock, 'a function');
    if (node.body.body.length !== 1) {
      throw new FatalLinkerError(node.body, 'Unsupported syntax, expected exactly one statement');
    }
    const stmt = node.body.body[0];
    assert(stmt, t.isReturnStatement, 'a return statement');
    if (stmt.argument === null) {
      throw new FatalLinkerError(stmt, 'Unsupported syntax, expected to have a return value');
    }

    return stmt.argument;
  }

  getRange(node: t.Expression): Range {
    if (node.loc === null || node.start === null || node.end === null) {
      throw new FatalLinkerError(
          node, 'Unable to read range for node - it is missing location information.');
    }
    return {
      startLine: node.loc.start.line,
      startCol: node.loc.start.column,
      startPos: node.start,
      endPos: node.end,
    };
  }
}

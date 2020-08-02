/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as t from '@babel/types';
import {AstHost, FatalLinkerError} from '../api';
import {assert, extractRightMostName} from './source_file_utils';

export class BabelAstHost implements AstHost<t.Expression> {
  getSymbolName(node: t.Expression): string|null {
    return extractRightMostName(node);
  }

  parseStringLiteral(node: t.Expression): string {
    assert(node, t.isStringLiteral, 'a string literal');
    return node.value;
  }

  parseNumberLiteral(node: t.Expression): number {
    assert(node, t.isNumericLiteral, 'a number literal');
    return node.value;
  }

  parseBooleanLiteral(node: t.Expression): boolean {
    assert(node, t.isBooleanLiteral, 'a boolean literal');
    return node.value;
  }

  parseArrayLiteral(node: t.Expression): t.Expression[] {
    assert(node, t.isArrayExpression, 'an array literal');
    return node.elements.filter(
        (element): element is t.Expression => element !== null && t.isExpression(element));
  }

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
}

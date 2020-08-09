/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as t from '@babel/types';

import {AstFactory, ObjectLiteralProperty, SourceMapRange} from '../../../src/ngtsc/translator';

import {assert} from './source_file_utils';

export class BabelFactory implements AstFactory<t.Statement, t.Expression> {
  createArrayLiteral(elements: t.Expression[]): t.Expression {
    return t.arrayExpression(elements);
  }

  createAssignment(target: t.Expression, value: t.Expression): t.Expression {
    assert(target, t.isLVal, 'must be a left hand side expression');
    return t.assignmentExpression('=', target, value);
  }

  createBinaryExpression(leftOperand: t.Expression, operator: string, rightOperand: t.Expression):
      t.Expression {
    switch (operator) {
      case '&&':
      case '||':
        return t.logicalExpression(operator, leftOperand, rightOperand);
      default:
        return t.binaryExpression(operator as any, leftOperand, rightOperand);
    }
  }

  createCommentStatement(commentText: string, multiline: boolean): t.Statement {
    const statement = t.emptyStatement();
    t.addComment(statement, 'leading', commentText, multiline);
    return statement;
  }

  createConditional(
      condition: t.Expression, thenExpression: t.Expression,
      elseExpression: t.Expression): t.Expression {
    return t.conditionalExpression(condition, thenExpression, elseExpression);
  }

  createParenthesizedExpression(expression: t.Expression): t.Expression {
    return t.parenthesizedExpression(expression);
  }

  createElementAccess(expression: t.Expression, element: t.Expression): t.Expression {
    return t.memberExpression(expression, element, /* computed */ true);
  }

  createExpressionStatement(expression: t.Expression): t.Statement {
    return t.expressionStatement(expression);
  }

  createCallExpression(callee: t.Expression, args: t.Expression[], pure: boolean): t.Expression {
    return t.callExpression(callee, args);
  }

  createFunctionDeclaration(functionName: string|null, parameters: string[], body: t.Statement):
      t.Statement {
    assert(body, t.isBlockStatement, 'a block');
    return t.functionDeclaration(
        t.identifier(functionName), parameters.map(param => t.identifier(param)), body);
  }

  createFunctionExpression(functionName: string|null, parameters: string[], body: t.Statement):
      t.Expression {
    assert(body, t.isBlockStatement, 'a block');
    const name = functionName !== null ? t.identifier(functionName) : null;
    return t.functionExpression(name, parameters.map(param => t.identifier(param)), body);
  }

  createIdentifier(name: string): t.Expression {
    return t.identifier(name);
  }

  createIfStatement(
      condition: t.Expression, thenStatement: t.Statement,
      elseStatement: t.Statement|null): t.Statement {
    return t.ifStatement(condition, thenStatement, elseStatement);
  }

  createLiteral(value: string|number|boolean|null|undefined): t.Expression {
    if (typeof value === 'string') {
      return t.stringLiteral(value);
    } else if (typeof value === 'number') {
      return t.numericLiteral(value);
    } else if (typeof value === 'boolean') {
      return t.booleanLiteral(value);
    } else if (value === undefined) {
      return t.identifier('undefined');
    } else if (value === null) {
      return t.nullLiteral();
    } else {
      throw new Error('Invalid literal');
    }
  }

  createNewExpression(expression: t.Expression, args: t.Expression[]): t.Expression {
    return t.newExpression(expression, args);
  }

  createObjectLiteral(properties: ObjectLiteralProperty<t.Expression>[]): t.Expression {
    return t.objectExpression(properties.map(prop => {
      const key =
          prop.quoted ? t.stringLiteral(prop.propertyName) : t.identifier(prop.propertyName);
      return t.objectProperty(key, prop.value, prop.quoted);
    }));
  }

  createPropertyAccess(expression: t.Expression, propertyName: string): t.Expression {
    return t.memberExpression(expression, t.identifier(propertyName), /* computed */ false);
  }

  createReturnStatement(expression: t.Expression|null): t.Statement {
    return t.returnStatement(expression);
  }

  createThrowStatement(expression: t.Expression): t.Statement {
    return t.throwStatement(expression);
  }

  createBlock(body: t.Statement[]): t.Statement {
    return t.blockStatement(body);
  }

  createTypeOfExpression(expression: t.Expression): t.Expression {
    return t.unaryExpression('typeof', expression);
  }

  createUnaryExpression(operator: string, operand: t.Expression): t.Expression {
    return t.unaryExpression(operator as any, operand);
  }

  createVariableDeclaration(variableName: string, initializer: t.Expression|null, final: boolean):
      t.Statement {
    return t.variableDeclaration(
        final ? 'const' : 'var', [t.variableDeclarator(t.identifier(variableName), initializer)]);
  }

  setSourceMapRange(node: t.Statement|t.Expression, sourceMapRange: SourceMapRange): void {
    // TODO: Babel does not appear to support external source map sources. We should verify that
    //  the range that is being set at least corresponds with the file that is transformed,
    //  otherwise the line/column information should not used to set the node's location.
    node.loc = {
      start: {
        line: sourceMapRange.start.line,
        column: sourceMapRange.start.column,
      },
      end: {
        line: sourceMapRange.end.line,
        column: sourceMapRange.end.column,
      },
    };
  }
}

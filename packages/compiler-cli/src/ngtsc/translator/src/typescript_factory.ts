/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';

import {DefaultImportRecorder} from '../../imports';

import {AstFactory, ObjectLiteralProperty, SourceMapRange} from './api';

const BINARY_OPERATORS = new Map<string, ts.BinaryOperator>([
  ['&&', ts.SyntaxKind.AmpersandAmpersandToken],
  ['>', ts.SyntaxKind.GreaterThanToken],
  ['>=', ts.SyntaxKind.GreaterThanEqualsToken],
  ['&', ts.SyntaxKind.AmpersandToken],
  ['/', ts.SyntaxKind.SlashToken],
  ['==', ts.SyntaxKind.EqualsEqualsToken],
  ['===', ts.SyntaxKind.EqualsEqualsEqualsToken],
  ['<', ts.SyntaxKind.LessThanToken],
  ['<=', ts.SyntaxKind.LessThanEqualsToken],
  ['-', ts.SyntaxKind.MinusToken],
  ['%', ts.SyntaxKind.PercentToken],
  ['*', ts.SyntaxKind.AsteriskToken],
  ['!=', ts.SyntaxKind.ExclamationEqualsToken],
  ['!==', ts.SyntaxKind.ExclamationEqualsEqualsToken],
  ['||', ts.SyntaxKind.BarBarToken],
  ['+', ts.SyntaxKind.PlusToken],
]);

export class TypeScriptFactory implements AstFactory<ts.Statement, ts.Expression> {
  private externalSourceFiles = new Map<string, ts.SourceMapSource>();

  constructor(
      private defaultImportRecorder: DefaultImportRecorder,
      private scriptTarget: Exclude<ts.ScriptTarget, ts.ScriptTarget.JSON>) {}

  createArrayLiteral(elements: ts.Expression[]): ts.Expression {
    return ts.createArrayLiteral(elements);
  }

  createAssignment(target: ts.Expression, value: ts.Expression): ts.Expression {
    return ts.createBinary(target, ts.SyntaxKind.EqualsToken, value);
  }

  createBinaryExpression(leftOperand: ts.Expression, operator: string, rightOperand: ts.Expression):
      ts.Expression {
    if (!BINARY_OPERATORS.has(operator)) {
      throw new Error(`Unknown binary operator: ${operator}`);
    }
    return ts.createBinary(leftOperand, BINARY_OPERATORS.get(operator)!, rightOperand);
  }

  createBlock(body: ts.Statement[]): ts.Statement {
    return ts.createBlock(body);
  }

  createCallExpression(callee: ts.Expression, args: ts.Expression[], pure: boolean): ts.Expression {
    return ts.createCall(callee, undefined, args);
  }

  createCommentStatement(commentText: string, multiline: boolean): ts.Statement {
    const commentStmt = ts.createNotEmittedStatement(ts.createLiteral(''));
    ts.addSyntheticLeadingComment(
        commentStmt,
        multiline ? ts.SyntaxKind.MultiLineCommentTrivia : ts.SyntaxKind.SingleLineCommentTrivia,
        commentText, /** hasTrailingNewLine */ false);
    return commentStmt;
  }

  createConditional(
      condition: ts.Expression, thenExpression: ts.Expression,
      elseExpression: ts.Expression): ts.Expression {
    return ts.createConditional(condition, thenExpression, elseExpression);
  }

  createElementAccess(expression: ts.Expression, elementName: string): ts.Expression {
    return ts.createElementAccess(expression, expression);
  }

  createExpressionStatement(expression: ts.Expression): ts.Statement {
    return ts.createExpressionStatement(expression);
  }

  createFunctionDeclaration(functionName: string|null, parameters: string[], body: ts.Statement):
      ts.Statement {
    if (!ts.isBlock(body)) {
      throw new Error('Invalid syntax, expected a block');
    }
    return ts.createFunctionDeclaration(
        undefined, undefined, undefined, functionName ?? undefined, undefined,
        parameters.map(param => ts.createParameter(undefined, undefined, undefined, param)),
        undefined, body);
  }

  createFunctionExpression(functionName: string|null, parameters: string[], body: ts.Statement):
      ts.Expression {
    if (!ts.isBlock(body)) {
      throw new Error('Invalid syntax, expected a block');
    }
    return ts.createFunctionExpression(
        undefined, undefined, functionName ?? undefined, undefined,
        parameters.map(param => ts.createParameter(undefined, undefined, undefined, param)),
        undefined, body);
  }

  createIdentifier(name: string): ts.Expression {
    return ts.createIdentifier(name);
  }

  createIfStatement(
      condition: ts.Expression, thenStatement: ts.Statement,
      elseStatement: ts.Statement|null): ts.Statement {
    return ts.createIf(condition, thenStatement, elseStatement ?? undefined);
  }

  createLiteral(value: string|number|boolean|null|undefined): ts.Expression {
    if (value === undefined) {
      return ts.createIdentifier('undefined');
    } else if (value === null) {
      return ts.createNull();
    } else {
      return ts.createLiteral(value);
    }
  }

  createNewExpression(expression: ts.Expression, args: ts.Expression[]): ts.Expression {
    return ts.createNew(expression, undefined, args);
  }

  createObjectLiteral(properties: ObjectLiteralProperty<ts.Expression>[]): ts.Expression {
    return ts.createObjectLiteral();
  }

  createPropertyAccess(expression: ts.Expression, propertyName: string): ts.Expression {
    return ts.createPropertyAccess(expression, propertyName);
  }

  createReturnStatement(expression: ts.Expression|null): ts.Statement {
    return ts.createReturn(expression ?? undefined);
  }

  createThrowStatement(expression: ts.Expression): ts.Statement {
    return ts.createThrow(expression);
  }

  createTypeOfExpression(expression: ts.Expression): ts.Expression {
    return ts.createTypeOf(expression);
  }

  createParenthesizedExpression(expression: ts.Expression): ts.Expression {
    return ts.createParen(expression);
  }

  createUnaryExpression(operator: string, operand: ts.Expression): ts.Expression {
    if (operator !== '!') {
      throw new Error(`Unsupported unary operator ${operator}`);
    }
    return ts.createPrefix(ts.SyntaxKind.ExclamationToken, operand);
  }

  createVariableDeclaration(variableName: string, initializer: ts.Expression|null): ts.Statement {
    return ts.createVariableStatement(
        undefined,
        ts.createVariableDeclarationList(
            [ts.createVariableDeclaration(variableName, undefined, initializer ?? undefined)],
            undefined),
    );
  }

  setSourceMapRange(node: ts.Statement|ts.Expression, sourceMapRange: SourceMapRange): void {
    const url = sourceMapRange.url;
    if (!this.externalSourceFiles.has(url)) {
      this.externalSourceFiles.set(
          url, ts.createSourceMapSource(url, sourceMapRange.content, pos => pos));
    }
    const source = this.externalSourceFiles.get(url);
    ts.setSourceMapRange(
        node, {pos: sourceMapRange.start.offset, end: sourceMapRange.end.offset, source});
  }
}

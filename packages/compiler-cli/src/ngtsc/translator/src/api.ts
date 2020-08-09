/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

export interface SourceMapLocation {
  offset: number;
  line: number;
  column: number;
}

export interface SourceMapRange {
  url: string;
  content: string;
  start: SourceMapLocation;
  end: SourceMapLocation;
}

export interface PropertyAssignment<TExpression> {
  propertyName: string;
  quoted: boolean;
  value: TExpression;
}

export type ObjectLiteralProperty<TExpression> = PropertyAssignment<TExpression>;

export interface AstFactory<TStatement, TExpression> {
  createIdentifier(name: string): TExpression;

  createPropertyAccess(expression: TExpression, propertyName: string): TExpression;

  createElementAccess(expression: TExpression, element: TExpression): TExpression;

  createAssignment(target: TExpression, value: TExpression): TExpression;

  createConditional(
      condition: TExpression, thenExpression: TExpression,
      elseExpression: TExpression): TExpression;

  createParenthesizedExpression(expression: TExpression): TExpression;

  createUnaryExpression(operator: string, operand: TExpression): TExpression;

  createBinaryExpression(leftOperand: TExpression, operator: string, rightOperand: TExpression):
      TExpression;

  createCallExpression(callee: TExpression, args: TExpression[], pure: boolean): TExpression;

  createNewExpression(expression: TExpression, args: TExpression[]): TExpression;

  createTypeOfExpression(expression: TExpression): TExpression;

  createLiteral(value: string|number|boolean|null|undefined): TExpression;

  createArrayLiteral(elements: TExpression[]): TExpression;

  createObjectLiteral(properties: ObjectLiteralProperty<TExpression>[]): TExpression;

  createVariableDeclaration(variableName: string, initializer: TExpression|null, final: boolean):
      TStatement;

  createFunctionExpression(functionName: string|null, parameters: string[], body: TStatement):
      TExpression;

  createFunctionDeclaration(functionName: string|null, parameters: string[], body: TStatement):
      TStatement;

  createExpressionStatement(expression: TExpression): TStatement;

  createIfStatement(
      condition: TExpression, thenStatement: TStatement,
      elseStatement: TStatement|null): TStatement;

  createReturnStatement(expression: TExpression|null): TStatement;

  createBlock(body: TStatement[]): TStatement;

  createThrowStatement(expression: TExpression): TStatement;

  createCommentStatement(commentText: string, multiline: boolean): TStatement;

  setSourceMapRange(node: TStatement|TExpression, sourceMapRange: SourceMapRange): void;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as ts from 'typescript';

import {DefaultImportRecorder} from '../../imports';

import {AstFactory, ObjectLiteralProperty, SourceMapRange, TemplateLiteral} from './api';

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
  private nextComments: {text: string, multiline: boolean}[] = [];

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
    return this.attachComments(ts.createBlock(body));
  }

  createCallExpression(callee: ts.Expression, args: ts.Expression[], pure: boolean): ts.Expression {
    return ts.createCall(callee, undefined, args);
  }

  addLeadingComment(text: string, multiline: boolean): void {
    this.nextComments.push({text, multiline});
  }

  createConditional(
      condition: ts.Expression, thenExpression: ts.Expression,
      elseExpression: ts.Expression): ts.Expression {
    return ts.createConditional(condition, thenExpression, elseExpression);
  }

  createElementAccess(expression: ts.Expression, element: ts.Expression): ts.Expression {
    return ts.createElementAccess(expression, expression);
  }

  createExpressionStatement(expression: ts.Expression): ts.Statement {
    return this.attachComments(ts.createExpressionStatement(expression));
  }

  createFunctionDeclaration(functionName: string|null, parameters: string[], body: ts.Statement):
      ts.Statement {
    if (!ts.isBlock(body)) {
      throw new Error('Invalid syntax, expected a block');
    }
    return this.attachComments(ts.createFunctionDeclaration(
        undefined, undefined, undefined, functionName ?? undefined, undefined,
        parameters.map(param => ts.createParameter(undefined, undefined, undefined, param)),
        undefined, body));
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
    return this.attachComments(ts.createIf(condition, thenStatement, elseStatement ?? undefined));
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

  createTaggedTemplate(tag: ts.Expression, template: TemplateLiteral<ts.Expression>):
      ts.Expression {
    let templateLiteral: ts.TemplateLiteral;
    const length = template.elements.length;
    const head = template.elements[0];
    if (length === 1) {
      templateLiteral = ts.createNoSubstitutionTemplateLiteral(head.cooked, head.raw);
    } else {
      const spans: ts.TemplateSpan[] = [];
      // Create the middle parts
      for (let i = 1; i < length - 1; i++) {
        const {cooked, raw} = template.elements[i];
        spans.push(
            ts.createTemplateSpan(template.expressions[i - 1], createTemplateMiddle(cooked, raw)));
      }
      // Create the tail part
      const resolvedExpression = template.expressions[length - 2];
      const templatePart = template.elements[length - 1];
      const templateTail = createTemplateTail(templatePart.cooked, templatePart.raw);
      spans.push(ts.createTemplateSpan(resolvedExpression, templateTail));
      // Put it all together
      templateLiteral =
          ts.createTemplateExpression(ts.createTemplateHead(head.cooked, head.raw), spans);
    }
    return ts.createTaggedTemplate(tag, templateLiteral);
  }


  createPropertyAccess(expression: ts.Expression, propertyName: string): ts.Expression {
    return ts.createPropertyAccess(expression, propertyName);
  }

  createReturnStatement(expression: ts.Expression|null): ts.Statement {
    return this.attachComments(ts.createReturn(expression ?? undefined));
  }

  createThrowStatement(expression: ts.Expression): ts.Statement {
    return this.attachComments(ts.createThrow(expression));
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

  createVariableDeclaration(variableName: string, initializer: ts.Expression|null, final: boolean):
      ts.Statement {
    const nodeFlags = ((this.scriptTarget >= ts.ScriptTarget.ES2015) && final) ?
        ts.NodeFlags.Const :
        ts.NodeFlags.None;
    return this.attachComments(ts.createVariableStatement(
        undefined,
        ts.createVariableDeclarationList(
            [ts.createVariableDeclaration(variableName, undefined, initializer ?? undefined)],
            nodeFlags),
        ));
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

  private attachComments(statement: ts.Statement): ts.Statement {
    let comment: {text: string, multiline: boolean}|undefined;
    while (comment = this.nextComments.shift()) {
      ts.addSyntheticLeadingComment(
          statement,
          comment.multiline ? ts.SyntaxKind.MultiLineCommentTrivia :
                              ts.SyntaxKind.SingleLineCommentTrivia,
          comment.text, /** hasTrailingNewLine */ false);
    }
    return statement;
  }
}

// HACK: Use this in place of `ts.createTemplateMiddle()`.
// Revert once https://github.com/microsoft/TypeScript/issues/35374 is fixed
function createTemplateMiddle(cooked: string, raw: string): ts.TemplateMiddle {
  const node: ts.TemplateLiteralLikeNode = ts.createTemplateHead(cooked, raw);
  node.kind = ts.SyntaxKind.TemplateMiddle;
  return node as ts.TemplateMiddle;
}

// HACK: Use this in place of `ts.createTemplateTail()`.
// Revert once https://github.com/microsoft/TypeScript/issues/35374 is fixed
function createTemplateTail(cooked: string, raw: string): ts.TemplateTail {
  const node: ts.TemplateLiteralLikeNode = ts.createTemplateHead(cooked, raw);
  node.kind = ts.SyntaxKind.TemplateTail;
  return node as ts.TemplateTail;
}

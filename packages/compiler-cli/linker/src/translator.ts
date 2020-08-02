/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AssertNotNull, BinaryOperator, BinaryOperatorExpr, CastExpr, ClassStmt, CommaExpr, CommentStmt, ConditionalExpr, DeclareFunctionStmt, DeclareVarStmt, Expression, ExpressionStatement, ExpressionVisitor, ExternalExpr, FunctionExpr, IfStmt, InstantiateExpr, InvokeFunctionExpr, InvokeMethodExpr, JSDocCommentStmt, LiteralArrayExpr, LiteralExpr, LiteralMapExpr, NotExpr, ReadKeyExpr, ReadPropExpr, ReadVarExpr, ReturnStatement, Statement, StatementVisitor, ThrowStmt, TryCatchStmt, TypeofExpr, WrappedNodeExpr, WriteKeyExpr, WritePropExpr, WriteVarExpr} from '../../../compiler';
import {LocalizedString} from '../../../compiler/src/output/output_ast';
import {AstFactory, ObjectLiteralProperty} from '../../src/ngtsc/translator';

export class Context {
  constructor(readonly isStatement: boolean) {}

  get withExpressionMode(): Context {
    return this.isStatement ? new Context(false) : this;
  }

  get withStatementMode(): Context {
    return !this.isStatement ? new Context(true) : this;
  }
}

const BINARY_OPERATORS = new Map<BinaryOperator, string>([
  [BinaryOperator.And, '&&'],
  [BinaryOperator.Bigger, '>'],
  [BinaryOperator.BiggerEquals, '>='],
  [BinaryOperator.BitwiseAnd, '&'],
  [BinaryOperator.Divide, '/'],
  [BinaryOperator.Equals, '=='],
  [BinaryOperator.Identical, '==='],
  [BinaryOperator.Lower, '<'],
  [BinaryOperator.LowerEquals, '<='],
  [BinaryOperator.Minus, '-'],
  [BinaryOperator.Modulo, '%'],
  [BinaryOperator.Multiply, '*'],
  [BinaryOperator.NotEquals, '!='],
  [BinaryOperator.NotIdentical, '!=='],
  [BinaryOperator.Or, '||'],
  [BinaryOperator.Plus, '+'],
]);

export function translateExpression<TExpression>(
    expression: Expression, factory: AstFactory<unknown, TExpression>,
    ngImport: TExpression): TExpression {
  return expression.visitExpression(
      new ExpressionTranslatorVisitor(factory, ngImport), new Context(false));
}

export function translateStatement<TStatement, TExpression>(
    statement: Statement, factory: AstFactory<TStatement, TExpression>,
    ngImport: TExpression): TStatement {
  return statement.visitStatement(
      new ExpressionTranslatorVisitor(factory, ngImport), new Context(false));
}

class ExpressionTranslatorVisitor<TStatement, TExpression> implements ExpressionVisitor,
                                                                      StatementVisitor {
  constructor(private factory: AstFactory<TStatement, TExpression>, private ngImport: TExpression) {
  }

  visitDeclareVarStmt(stmt: DeclareVarStmt, context: Context): TStatement {
    return this.factory.createVariableDeclaration(
        stmt.name, stmt.value && stmt.value.visitExpression(this, context.withExpressionMode));
  }

  visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: Context): TStatement {
    return this.factory.createFunctionDeclaration(
        stmt.name, stmt.params.map(param => param.name),
        this.factory.createBlock(
            stmt.statements.map(child => child.visitStatement(this, context.withStatementMode))));
  }

  visitExpressionStmt(stmt: ExpressionStatement, context: Context): TStatement {
    return this.factory.createExpressionStatement(
        stmt.expr.visitExpression(this, context.withStatementMode));
  }

  visitReturnStmt(stmt: ReturnStatement, context: Context): TStatement {
    return this.factory.createReturnStatement(
        stmt.value.visitExpression(this, context.withExpressionMode));
  }

  visitDeclareClassStmt(stmt: ClassStmt, context: Context): never {
    throw new Error('Method not implemented.');
  }

  visitIfStmt(stmt: IfStmt, context: Context): TStatement {
    return this.factory.createIfStatement(
        stmt.condition.visitExpression(this, context),
        this.factory.createBlock(
            stmt.trueCase.map(child => child.visitStatement(this, context.withStatementMode))),
        stmt.falseCase.length > 0 ?
            this.factory.createBlock(stmt.falseCase.map(
                child => child.visitStatement(this, context.withStatementMode))) :
            null);
  }

  visitTryCatchStmt(stmt: TryCatchStmt, context: Context): never {
    throw new Error('Method not implemented.');
  }

  visitThrowStmt(stmt: ThrowStmt, context: Context): TStatement {
    return this.factory.createThrowStatement(
        stmt.error.visitExpression(this, context.withExpressionMode));
  }

  visitCommentStmt(stmt: CommentStmt, context: Context): TStatement {
    return this.factory.createCommentStatement(stmt.comment, stmt.multiline);
  }

  visitJSDocCommentStmt(stmt: JSDocCommentStmt, context: Context): TStatement {
    return this.factory.createCommentStatement(stmt.toString(), true);
  }

  visitReadVarExpr(ast: ReadVarExpr, context: Context): TExpression {
    const identifier = this.factory.createIdentifier(ast.name!);
    this.setSourceMapRange(identifier, ast);
    return identifier;
  }

  visitWriteVarExpr(expr: WriteVarExpr, context: Context): TExpression {
    const assignment = this.factory.createAssignment(
        this.factory.createIdentifier(expr.name),
        expr.value.visitExpression(this, context),
    );
    return context.isStatement ? assignment :
                                 this.factory.createParenthesizedExpression(assignment);
  }

  visitWriteKeyExpr(expr: WriteKeyExpr, context: Context): TExpression {
    const exprContext = context.withExpressionMode;
    const target = this.factory.createElementAccess(
        expr.receiver.visitExpression(this, exprContext),
        expr.index.visitExpression(this, exprContext),
    );
    const assignment =
        this.factory.createAssignment(target, expr.value.visitExpression(this, exprContext));
    return context.isStatement ? assignment :
                                 this.factory.createParenthesizedExpression(assignment);
  }

  visitWritePropExpr(expr: WritePropExpr, context: Context): TExpression {
    const exprContext = context.withExpressionMode;
    const target = this.factory.createPropertyAccess(
        expr.receiver.visitExpression(this, exprContext), expr.name);
    const assignment =
        this.factory.createAssignment(target, expr.value.visitExpression(this, exprContext));
    return context.isStatement ? assignment :
                                 this.factory.createParenthesizedExpression(assignment);
  }

  visitInvokeMethodExpr(ast: InvokeMethodExpr, context: Context): TExpression {
    const target = ast.receiver.visitExpression(this, context);
    const call = this.factory.createCallExpression(
        ast.name !== null ? this.factory.createPropertyAccess(target, ast.name) : target,
        ast.args.map(arg => arg.visitExpression(this, context)),
        false,
    );
    this.setSourceMapRange(call, ast);
    return call;
  }

  visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: Context): TExpression {
    const call = this.factory.createCallExpression(
        ast.fn.visitExpression(this, context),
        ast.args.map(arg => arg.visitExpression(this, context)),
        ast.pure,
    );
    this.setSourceMapRange(call, ast);
    return call;
  }

  visitInstantiateExpr(ast: InstantiateExpr, context: Context): TExpression {
    return this.factory.createNewExpression(
        ast.classExpr.visitExpression(this, context),
        ast.args.map(arg => arg.visitExpression(this, context)));
  }

  visitLiteralExpr(ast: LiteralExpr, context: Context): TExpression {
    const expr = this.factory.createLiteral(ast.value);
    this.setSourceMapRange(expr, ast);
    return expr;
  }

  visitLocalizedString(ast: LocalizedString, context: Context): TExpression {
    throw new Error('TODO');
  }

  visitExternalExpr(ast: ExternalExpr, context: Context): TExpression {
    if (ast.value.moduleName !== '@angular/core') {
      throw new Error(`Unable to import from anything other than '@angular/core'`);
    }

    if (ast.value.name === null) {
      return this.ngImport;
    } else {
      return this.factory.createPropertyAccess(this.ngImport, ast.value.name);
    }
  }

  visitConditionalExpr(ast: ConditionalExpr, context: Context): TExpression {
    let cond: TExpression = ast.condition.visitExpression(this, context);

    // Ordinarily the ternary operator is right-associative. The following are equivalent:
    //   `a ? b : c ? d : e` => `a ? b : (c ? d : e)`
    //
    // However, occasionally Angular needs to produce a left-associative conditional, such as in
    // the case of a null-safe navigation production: `{{a?.b ? c : d}}`. This template produces
    // a ternary of the form:
    //   `a == null ? null : rest of expression`
    // If the rest of the expression is also a ternary though, this would produce the form:
    //   `a == null ? null : a.b ? c : d`
    // which, if left as right-associative, would be incorrectly associated as:
    //   `a == null ? null : (a.b ? c : d)`
    //
    // In such cases, the left-associativity needs to be enforced with parentheses:
    //   `(a == null ? null : a.b) ? c : d`
    //
    // Such parentheses could always be included in the condition (guaranteeing correct behavior) in
    // all cases, but this has a code size cost. Instead, parentheses are added only when a
    // conditional expression is directly used as the condition of another.
    //
    // TODO(alxhub): investigate better logic for precendence of conditional operators
    if (ast.condition instanceof ConditionalExpr) {
      // The condition of this ternary needs to be wrapped in parentheses to maintain
      // left-associativity.
      cond = this.factory.createParenthesizedExpression(cond);
    }

    return this.factory.createConditional(
        cond, ast.trueCase.visitExpression(this, context),
        ast.falseCase!.visitExpression(this, context));
  }

  visitNotExpr(ast: NotExpr, context: Context): TExpression {
    return this.factory.createUnaryExpression('!', ast.condition.visitExpression(this, context));
  }

  visitAssertNotNullExpr(ast: AssertNotNull, context: Context): TExpression {
    return ast.condition.visitExpression(this, context);
  }

  visitCastExpr(ast: CastExpr, context: Context): TExpression {
    return ast.value.visitExpression(this, context);
  }

  visitFunctionExpr(ast: FunctionExpr, context: Context): TExpression {
    return this.factory.createFunctionExpression(
        ast.name ?? null, ast.params.map(param => param.name),
        this.factory.createBlock(ast.statements.map(stmt => stmt.visitStatement(this, context))));
  }

  visitBinaryOperatorExpr(ast: BinaryOperatorExpr, context: Context): TExpression {
    if (!BINARY_OPERATORS.has(ast.operator)) {
      throw new Error(`Unknown binary operator: ${BinaryOperator[ast.operator]}`);
    }
    return this.factory.createBinaryExpression(
        ast.lhs.visitExpression(this, context),
        BINARY_OPERATORS.get(ast.operator)!,
        ast.rhs.visitExpression(this, context),
    );
  }

  visitReadPropExpr(ast: ReadPropExpr, context: Context): TExpression {
    return this.factory.createPropertyAccess(ast.receiver.visitExpression(this, context), ast.name);
  }

  visitReadKeyExpr(ast: ReadKeyExpr, context: Context): TExpression {
    return this.factory.createElementAccess(
        ast.receiver.visitExpression(this, context), ast.index.visitExpression(this, context));
  }

  visitLiteralArrayExpr(ast: LiteralArrayExpr, context: Context): TExpression {
    const expr = this.factory.createArrayLiteral(
        ast.entries.map(expr => expr.visitExpression(this, context)));
    this.setSourceMapRange(expr, ast);
    return expr;
  }

  visitLiteralMapExpr(ast: LiteralMapExpr, context: Context): TExpression {
    const properties: ObjectLiteralProperty<TExpression>[] = ast.entries.map(entry => {
      return {
        propertyName: entry.key,
        quoted: entry.quoted,
        value: entry.value.visitExpression(this, context)
      };
    });
    const expr = this.factory.createObjectLiteral(properties);
    this.setSourceMapRange(expr, ast);
    return expr;
  }

  visitCommaExpr(ast: CommaExpr, context: Context): never {
    throw new Error('Method not implemented.');
  }

  visitWrappedNodeExpr(ast: WrappedNodeExpr<any>, context: Context): any {
    return ast.node;
  }

  visitTypeofExpr(ast: TypeofExpr, context: Context): TExpression {
    return this.factory.createTypeOfExpression(ast.expr.visitExpression(this, context));
  }

  private setSourceMapRange(node: TStatement|TExpression, ast: Expression): void {
    if (ast.sourceSpan) {
      const {start, end} = ast.sourceSpan;
      const {url, content} = start.file;
      if (url) {
        this.factory.setSourceMapRange(node, {
          url,
          content,
          start: {offset: start.offset, line: start.line, column: start.col},
          end: {offset: end.offset, line: end.line, column: end.col},
        });
      }
    }
  }
}

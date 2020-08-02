/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {compileComponentFromMetadata, ConstantPool, InterpolationConfig, makeBindingParser, ParseLocation, ParseSourceFile, ParseSourceSpan, parseTemplate, R3ComponentMetadata, R3QueryMetadata, R3Reference, WrappedNodeExpr} from '@angular/compiler';

import {ChangeDetectionStrategy, ViewEncapsulation} from '../../../compiler/src/core';
import {AstFactory} from '../../src/ngtsc/translator';

import {AstHost, FatalLinkerError} from './api';
import {translateExpression, translateStatement} from './translator';

export interface LinkerEnvironment<TStatement, TExpression> {
  astHost: AstHost<TExpression>;
  factory: AstFactory<TStatement, TExpression>;
}

export interface LinkerOptions {
  enableGlobalStatements: boolean;
}

export function createLinker<TStatement, TExpression>(
    sourceUrl: string, env: LinkerEnvironment<TStatement, TExpression>,
    options: Partial<LinkerOptions> = {}): FileLinker<TStatement, TExpression> {
  return new FileLinker(sourceUrl, env, {
    enableGlobalStatements: true,
    ...options,
  });
}

export class FileLinker<TStatement, TExpression> {
  private readonly globalConstantPool: ConstantPool|null;
  private ngImport: TExpression|null = null;

  constructor(
      private sourceUrl: string, private env: LinkerEnvironment<TStatement, TExpression>,
      private options: LinkerOptions) {
    this.globalConstantPool = options.enableGlobalStatements ? new ConstantPool() : null;
  }

  getGlobalStatements(): TStatement[]|null {
    if (this.globalConstantPool === null || this.globalConstantPool.statements.length === 0) {
      return null;
    }

    if (this.ngImport === null) {
      throw new Error('Invalid state: @angular/core import must be available');
    }

    return this.globalConstantPool.statements.map(
        stmt => translateStatement(stmt, this.env.factory, this.ngImport));
  }

  linkCall(callee: TExpression, args: TExpression[]): TExpression|null {
    const symbolName = this.env.astHost.getSymbolName(callee);
    if (symbolName !== '$ngDeclareComponent') {
      return null;
    } else if (args.length !== 1) {
      this.fail(callee, 'Expected $ngDeclareComponent to be called with exactly one argument');
    }

    const metaObj = AstObject.parse(args[0], this.env.astHost);

    const version = metaObj.getNumber('version');
    if (version !== 1) {
      this.fail(metaObj.getNode('version'), 'Expected metadata version to be 1');
    }

    const typeName = this.env.astHost.getSymbolName(metaObj.getNode('type')) ?? 'anonymous';

    const interpolation = InterpolationConfig.fromArray(
        metaObj.getArray('interpolation').map(entry => entry.getString()) as [string, string]);
    const templateStr = metaObj.getString('template');
    const template = parseTemplate(templateStr, this.sourceUrl, {
      escapedString: true,
      interpolationConfig: interpolation,
    });
    if (template.errors !== undefined) {
      const errors = template.errors.map(err => err.toString()).join(', ');
      this.fail(
          metaObj.getNode('template'), `Errors found in the template of ${typeName}: ${errors}`);
    }

    const host = metaObj.getObject('host');

    const meta: R3ComponentMetadata = {
      typeSourceSpan: createSourceSpan('Component', typeName, this.sourceUrl),
      type: wrapReference(metaObj.getOpaque('type')),
      typeArgumentCount: 0,
      internalType: metaObj.getOpaque('type'),
      deps: null,
      host: {
        attributes: host.getObject('attributes').toLiteral(value => value.getOpaque()),
        listeners: host.getObject('listeners').toLiteral(value => value.getString()),
        properties: host.getObject('properties').toLiteral(value => value.getString()),
        specialAttributes: {/* TODO */}
      },
      inputs: metaObj.getObject('inputs').toLiteral(
          value => value.getString()),  // FIXME(joost): this does not account for the two forms
      outputs: metaObj.getObject('outputs').toLiteral(value => value.getString()),
      queries: metaObj.getArray('queries').map(entry => this.toQueryMetadata(entry.getObject())),
      viewQueries:
          metaObj.getArray('queries').map(entry => this.toQueryMetadata(entry.getObject())),
      providers: metaObj.getOpaque('providers'),
      viewProviders: metaObj.getOpaque('viewProviders'),
      fullInheritance: metaObj.getBoolean('fullInheritance'),
      selector: metaObj.getString('selector'),
      template: {
        template: templateStr,
        nodes: template.nodes,
        ngContentSelectors: template.ngContentSelectors
      },
      wrapDirectivesAndPipesInClosure: false,
      styles: metaObj.getArray('styles').map(entry => entry.getString()),
      encapsulation: this.parseEncapsulation(metaObj.getNode('encapsulation')),
      interpolation,
      changeDetection: this.parseChangeDetectionStrategy(metaObj.getNode('changeDetection')),
      animations: metaObj.getOpaque('animations'),
      relativeContextFilePath: this.sourceUrl,
      i18nUseExternalIds: true,
      pipes: metaObj.getObject('pipes').toLiteral(value => value.getOpaque()),
      directives:
          metaObj.getArray('directives').map(entry => this.toDirectiveMetadata(entry.getObject())),
      exportAs: metaObj.getArray('exportAs')
                    .map(entry => entry.getString()),  // FIXME: account for two forms (or make it
                                                       // always an array)
      lifecycle: {usesOnChanges: metaObj.getBoolean('usesOnChanges')},
      name: typeName,
      usesInheritance: metaObj.getBoolean('usesInheritance'),
    };
    const ngImport = metaObj.getNode('ngImport');

    // Capture the ngImport to be able to emit the constant pool.
    this.ngImport = ngImport;

    const constantPool = this.globalConstantPool ?? new ConstantPool();
    const bindingParser = makeBindingParser();
    const output = compileComponentFromMetadata(meta, constantPool, bindingParser);

    // TODO: consider a two-phase compile, where translation occurs after the whole file has been
    //  compiled to achieve better constant sharing. See #38213 for a similar change in ngtsc.
    const result = translateExpression(output.expression, this.env.factory, ngImport);
    if (this.globalConstantPool !== null) {
      // If the constant pool is shared globally, return the expression as is.
      return result;
    }

    if (constantPool.statements.length === 0) {
      // If the constant pool is empty, also return the expression as is.
      return result;
    }

    const statements =
        constantPool.statements.map(stmt => translateStatement(stmt, this.env.factory, ngImport));
    const iifeBody = this.env.factory.createBlock([
      ...statements,
      this.env.factory.createReturnStatement(result),
    ]);
    const iife = this.env.factory.createFunctionExpression(null, [], iifeBody);
    return this.env.factory.createCallExpression(iife, [], false);
  }

  private toQueryMetadata(value: AstObject<TExpression>): R3QueryMetadata {
    return {
      propertyName: value.getString('propertyName'),
      first: value.getBoolean('first'),
      predicate: value.getOpaque('predicate'),  // FIXME: account for the two forms
      descendants: value.getBoolean('descendants'),
      read: value.getOpaque('read'),
      static: value.getBoolean('static'),
    };
  }

  private toDirectiveMetadata(value: AstObject<TExpression>): R3ComponentMetadata['directives'][0] {
    return {
      selector: value.getString('selector'),
      expression: value.getOpaque('type'),
      meta: null,
    };
  }

  private parseEncapsulation(expr: TExpression): ViewEncapsulation {
    const symbolName = this.env.astHost.getSymbolName(expr);
    if (symbolName === null) {
      this.fail(expr, 'Expected encapsulation to have a symbol name');
    }
    switch (symbolName) {
      case ViewEncapsulation[ViewEncapsulation.Emulated]:
        return ViewEncapsulation.Emulated;
      case ViewEncapsulation[ViewEncapsulation.Native]:
        return ViewEncapsulation.Native;
      case ViewEncapsulation[ViewEncapsulation.None]:
        return ViewEncapsulation.None;
      case ViewEncapsulation[ViewEncapsulation.ShadowDom]:
        return ViewEncapsulation.ShadowDom;
    }
    this.fail(expr, 'Unsupported encapsulation');
  }

  private parseChangeDetectionStrategy(expr: TExpression): ChangeDetectionStrategy {
    const symbolName = this.env.astHost.getSymbolName(expr);
    if (symbolName === null) {
      this.fail(expr, 'Expected change detection strategy to have a symbol name');
    }
    switch (symbolName) {
      case ChangeDetectionStrategy[ChangeDetectionStrategy.OnPush]:
        return ChangeDetectionStrategy.OnPush;
      case ChangeDetectionStrategy[ChangeDetectionStrategy.Default]:
        return ChangeDetectionStrategy.Default;
    }
    this.fail(expr, 'Unsupported change detection strategy');
  }

  private fail(node: TStatement|TExpression, message: string): never {
    throw new FatalLinkerError(node, message);
  }
}

function wrapReference(wrapped: WrappedNodeExpr<unknown>): R3Reference {
  return {value: wrapped, type: wrapped};
}

export function createSourceSpan(
    kind: string, typeName: string, sourceUrl: string): ParseSourceSpan {
  const sourceFileName = `in ${kind} ${typeName} in ${sourceUrl}`;
  const sourceFile = new ParseSourceFile('', sourceFileName);
  return new ParseSourceSpan(
      new ParseLocation(sourceFile, -1, -1, -1), new ParseLocation(sourceFile, -1, -1, -1));
}

class AstObject<TExpression> {
  static parse<TExpression>(expr: TExpression, host: AstHost<TExpression>): AstObject<TExpression> {
    const obj = host.parseObjectLiteral(expr);
    return new AstObject<TExpression>(expr, obj, host);
  }

  constructor(
      private expr: TExpression, private obj: Map<string, TExpression>,
      private host: AstHost<TExpression>) {}

  getNumber(propertyName: string): number {
    return this.host.parseNumberLiteral(this.getRequiredProperty(propertyName));
  }
  getString(propertyName: string): string {
    return this.host.parseStringLiteral(this.getRequiredProperty(propertyName));
  }
  getBoolean(propertyName: string): boolean {
    return this.host.parseBooleanLiteral(this.getRequiredProperty(propertyName));
  }
  getObject(propertyName: string): AstObject<TExpression> {
    const obj = this.host.parseObjectLiteral(this.getRequiredProperty(propertyName));
    return new AstObject(this.expr, obj, this.host);
  }
  getArray(propertyName: string): AstValue<TExpression>[] {
    const arr = this.host.parseArrayLiteral(this.getRequiredProperty(propertyName));
    return arr.map(entry => new AstValue(entry, this.host));
  }
  getOpaque(propertyName: string): WrappedNodeExpr<any> {
    return new WrappedNodeExpr(this.getRequiredProperty(propertyName));
  }
  getNode(propertyName: string): TExpression {
    return this.getRequiredProperty(propertyName);
  }
  toLiteral<T>(mapper: (value: AstValue<TExpression>) => T): {[key: string]: T} {
    const result: {[key: string]: T} = {};
    for (const [key, expression] of this.obj) {
      result[key] = mapper(new AstValue(expression, this.host));
    }
    return result;
  }
  private getRequiredProperty(propertyName: string): TExpression {
    if (!this.obj.has(propertyName)) {
      throw new FatalLinkerError(this.expr, `Expected property '${propertyName}' to be present`);
    }
    return this.obj.get(propertyName)!;
  }
}

class AstValue<TExpression> {
  constructor(private value: TExpression, private host: AstHost<TExpression>) {}

  getNumber(): number {
    return this.host.parseNumberLiteral(this.value);
  }
  getString(): string {
    return this.host.parseStringLiteral(this.value);
  }
  getBoolean(): boolean {
    return this.host.parseBooleanLiteral(this.value);
  }
  getObject(): AstObject<TExpression> {
    return AstObject.parse(this.value, this.host);
  }
  getArray(): AstValue<TExpression>[] {
    const arr = this.host.parseArrayLiteral(this.value);
    return arr.map(entry => new AstValue(entry, this.host));
  }
  getOpaque(): WrappedNodeExpr<any> {
    return new WrappedNodeExpr(this.value);
  }
}

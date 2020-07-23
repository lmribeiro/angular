/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */


/**
 * A set of interfaces which are shared between `@angular/core` and `@angular/compiler` to allow
 * for late binding of `@angular/compiler` for JIT purposes.
 *
 * This file has two copies. Please ensure that they are in sync:
 *  - packages/compiler/src/compiler_facade_interface.ts             (master)
 *  - packages/core/src/compiler/compiler_facade_interface.ts     (copy)
 *
 * Please ensure that the two files are in sync using this command:
 * ```
 * cp packages/compiler/src/compiler_facade_interface.ts \
 *    packages/core/src/compiler/compiler_facade_interface.ts
 * ```
 */

export interface ExportedCompilerFacade {
  ɵcompilerFacade: CompilerFacade;
}

export interface CompilerFacade {
  compilePipe(angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3PipeMetadataFacade):
      any;
  compileInjectable(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3InjectableMetadataFacade): any;
  compileInjector(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3InjectorMetadataFacade): any;
  compileNgModule(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3NgModuleMetadataFacade): any;
  compileDirective(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3DirectiveMetadataFacade): any;
  compileComponent(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3ComponentMetadataFacade): any;
  compilePrelinkedComponent(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, decl: R3DeclareComponentMetadata): any;
  compileFactory(
      angularCoreEnv: CoreEnvironment, sourceMapUrl: string, meta: R3FactoryDefMetadataFacade): any;

  createParseSourceSpan(kind: string, typeName: string, sourceUrl: string): ParseSourceSpan;

  R3ResolvedDependencyType: typeof R3ResolvedDependencyType;
  R3FactoryTarget: typeof R3FactoryTarget;
  ResourceLoader: {new(): ResourceLoader};
}

export interface CoreEnvironment {
  [name: string]: Function;
}

export type ResourceLoader = {
  get(url: string): Promise<string>|string;
};

export type StringMap = {
  [key: string]: string;
};

export type StringMapWithRename = {
  [key: string]: string|[string, string];
};

export type Provider = any;

export enum R3ResolvedDependencyType {
  Token = 0,
  Attribute = 1,
  ChangeDetectorRef = 2,
  Invalid = 3,
}

export enum R3FactoryTarget {
  Directive = 0,
  Component = 1,
  Injectable = 2,
  Pipe = 3,
  NgModule = 4,
}

export interface R3DependencyMetadataFacade {
  token: any;
  resolved: R3ResolvedDependencyType;
  host: boolean;
  optional: boolean;
  self: boolean;
  skipSelf: boolean;
}

export interface R3PipeMetadataFacade {
  name: string;
  type: any;
  typeArgumentCount: number;
  pipeName: string;
  deps: R3DependencyMetadataFacade[]|null;
  pure: boolean;
}

export interface R3InjectableMetadataFacade {
  name: string;
  type: any;
  typeArgumentCount: number;
  providedIn: any;
  useClass?: any;
  useFactory?: any;
  useExisting?: any;
  useValue?: any;
  userDeps?: R3DependencyMetadataFacade[];
}

export interface R3NgModuleMetadataFacade {
  type: any;
  bootstrap: Function[];
  declarations: Function[];
  imports: Function[];
  exports: Function[];
  schemas: {name: string}[]|null;
  id: string|null;
}

export interface R3InjectorMetadataFacade {
  name: string;
  type: any;
  deps: R3DependencyMetadataFacade[]|null;
  providers: any[];
  imports: any[];
}

export interface R3DirectiveMetadataFacade {
  name: string;
  type: any;
  typeArgumentCount: number;
  typeSourceSpan: ParseSourceSpan;
  deps: R3DependencyMetadataFacade[]|null;
  selector: string|null;
  queries: R3QueryMetadataFacade[];
  host: {[key: string]: string};
  propMetadata: {[key: string]: any[]};
  lifecycle: {usesOnChanges: boolean;};
  inputs: string[];
  outputs: string[];
  usesInheritance: boolean;
  exportAs: string[]|null;
  providers: Provider[]|null;
  viewQueries: R3QueryMetadataFacade[];
}

export interface R3ComponentMetadataFacade extends R3DirectiveMetadataFacade {
  template: string;
  preserveWhitespaces: boolean;
  animations: any[]|undefined;
  pipes: Record<string, any>;
  directives: {selector: string, expression: any, meta: null}[];
  styles: string[];
  encapsulation: ViewEncapsulation;
  viewProviders: Provider[]|null;
  interpolation?: [string, string];
  changeDetection?: ChangeDetectionStrategy;
}

export interface R3FactoryDefMetadataFacade {
  name: string;
  type: any;
  typeArgumentCount: number;
  deps: R3DependencyMetadataFacade[]|null;
  injectFn: 'directiveInject'|'inject';
  target: R3FactoryTarget;
}

export enum ViewEncapsulation {
  Emulated = 0,
  Native = 1,
  None = 2,
  ShadowDom = 3
}

export type ChangeDetectionStrategy = number;

export interface R3QueryMetadataFacade {
  propertyName: string;
  first: boolean;
  predicate: any|string[];
  descendants: boolean;
  read: any|null;
  static: boolean;
}

export interface ParseSourceSpan {
  start: any;
  end: any;
  details: any;
}

export interface R3DeclareComponentMetadata {
  // Version number of the metadata format. This is used to evolve the metadata
  // interface later - the linker will be able to detect which version a library
  // is using and interpret its metadata accordingly.
  version: 1;

  // The component's unparsed template string.
  template: string;

  // CSS from inline styles and included styleUrls.
  styles: string[];

  // Unparsed selector of the component.
  selector: string;

  // Reference to the component class itself.
  type: OpaqueExpression;

  providers: OpaqueExpression|null;

  viewProviders: OpaqueExpression|null;

  // Map of inputs, keyed by the name of the input field.
  inputs: {[fieldName: string]: string|[string, string]};

  // Map of outputs, keyed by the name of the output field.
  outputs: {[fieldName: string]: string};

  // Information about host bindings present on the component.
  host: {
    attributes: {[key: string]: OpaqueExpression}; listeners: {[key: string]: string};
    properties: {[key: string]: string};
  };

  // List of directives which matched in the template, including sufficient
  // metadata for each directive to attribute bindings and references within
  // the template to each directive specifically, if the runtime instructions
  // support this.
  directives: {
    // Selector of the directive.
    selector: string;

    // Reference to the directive class (possibly a forward reference).
    type: OpaqueExpression | OpaqueExpressionFactory;

    // Property names of the directive's inputs.
    inputs: string[];

    // Event names of the directive's outputs.
    outputs: string[];

    // Names by which this directive exports itself for references.
    exportAs: string[] | null;
  }[];

  // Map of pipe names to an expression representing the pipe class or
  // a function to call that returns the class.
  pipes: Record<string, OpaqueExpression|OpaqueExpressionFactory>;

  // Map of queries from this component.
  queries: R3DeclarationQueryMetadata[];
  viewQueries: R3DeclarationQueryMetadata[];

  animations: OpaqueExpression|null;

  exportAs: string[]|null;

  // Information about the specific settings of this component and the
  // way it is meant to be compiled.
  changeDetectionStrategy: ChangeDetectionStrategy;
  encapsulation: ViewEncapsulation;
  interpolation: InterpolationConfig;
  i18nUseExternalIds: boolean;
  usesInheritance: boolean;
  fullInheritance: boolean;
  usesOnChanges: boolean;

  // A reference to the `@angular/core` ES module, which allows access
  // to all Angular exports, including Ivy instructions.
  ngImport: OpaqueExpression;
}

export type OpaqueExpression = any;
export type OpaqueExpressionFactory = () => any;
export type InterpolationConfig = [string, string];

export interface R3DeclarationQueryMetadata {
  /**
   * Name of the property on the class to update with query results.
   */
  propertyName: string;

  /**
   * Whether to read only the first matching result, or an array of results.
   */
  first: boolean;

  /**
   * Either an expression representing a type or `InjectionToken` for the query
   * predicate, or a set of string selectors.
   */
  predicate: OpaqueExpression|string[];

  /**
   * Whether to include only direct children or all descendants.
   */
  descendants: boolean;

  /**
   * An expression representing a type to read from each matched node, or null if the default value
   * for a given node is to be returned.
   */
  read: OpaqueExpression|null;

  /**
   * Whether or not this query should collect only static results.
   *
   * If static is true, the query's results will be set on the component after nodes are created,
   * but before change detection runs. This means that any results that relied upon change detection
   * to run (e.g. results inside *ngIf or *ngFor views) will not be collected. Query results are
   * available in the ngOnInit hook.
   *
   * If static is false, the query's results will be set on the component after change detection
   * runs. This means that the query results can contain nodes inside *ngIf or *ngFor views, but
   * the results will not be available in the ngOnInit hook (only in the ngAfterContentInit for
   * content hooks and ngAfterViewInit for view hooks).
   */
  static: boolean;
}

/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {AttributeMarker} from '@angular/compiler/src/core';
import {arrayToMockDir, MockCompilerHost, MockData, MockDirectory, setup, toMockFileArray} from '@angular/compiler/test/aot/test_util';
import {expectEmit} from './mock_compile';
import {AotCompilerOptions} from '../../../compiler';
import {NodeJSFileSystem, setFileSystem} from '../../src/ngtsc/file_system';
import {NgtscProgram} from '../../src/ngtsc/program';
import * as ts from 'typescript';


/**
 * These tests are codified version of the tests in compiler_canonical_spec.ts. Every
 * test in compiler_canonical_spec.ts should have a corresponding test here.
 */
fdescribe('compiler linker compliance', () => {
  const angularFiles = setup({
    compileAngular: false,
    compileAnimations: false,
    compileFakeCore: true,
  });

  it('should compile ngDeclareComponent', () => {
    const files = {
      app: {
        'spec.ts': `
            import {Component, Directive, NgModule, Input, Output, EventEmitter, HostBinding, HostListener} from '@angular/core';

            @Component({selector: 'child', template: 'child-view'})
            export class ChildComponent {}

            @Directive({selector: '[some-directive]'})
            export class SomeDirective {}

            @Component({
              selector: 'my-component',
              template: '<child some-directive></child>!',
              host: {
                '[a]': 'foo.bar',
                '(click)': 'handleClick($event)',
              },
            })
            export class MyComponent {
              @HostBinding() hostExpr: string;
              @HostListener() hostListener() {}
              @Input() input: string;
              @Input('in') aliasedIn: string;
              @Output() output: EventEmitter<string>;
              @Output('out') aliasedOut: EventEmitter<string>;
            }

            @NgModule({declarations: [ChildComponent, SomeDirective, MyComponent]})
            export class MyModule {}
          `
      }
    };

    // ChildComponent definition should be:
    const ChildComponentDefinition = `
        ChildComponent.ɵcmp = $r3$.$ngDeclareComponent({
          version: 1,
          template: "child-view",
          styles: [],
          type: ChildComponent,
          selector: "child",
          exportAs: null,
          inputs: {},
          outputs: {},
          encapsulation: i0.ViewEncapsulation.Emulated,
          ngImport: i0
        });
`;

    const ChildComponentFactory =
      `ChildComponent.ɵfac = function ChildComponent_Factory(t) { return new (t || ChildComponent)(); };`;

    // SomeDirective definition should be:
    const SomeDirectiveDefinition = `
        SomeDirective.ɵdir = $r3$.ɵɵdefineDirective({
          type: SomeDirective,
          selectors: [["", "some-directive", ""]]
        });
      `;

    const SomeDirectiveFactory =
      `SomeDirective.ɵfac = function SomeDirective_Factory(t) {return new (t || SomeDirective)(); };`;

    // MyComponent definition should be:
    const MyComponentDefinition = `
        …
        MyComponent.ɵcmp = $r3$.$ngDeclareComponent({
          version: 1,
          template: "<child some-directive></child>!",
          styles: [],
          type: MyComponent,
          selector: "my-component",
          exportAs: null,
          inputs: {
            "input": "input",
            "aliasedIn": ["in", "aliasedIn"]
          },
          outputs: {
            "output": "output",
            "aliasedOut": "out"
          },
          encapsulation: i0.ViewEncapsulation.Emulated,
          ngImport: i0
        });
      `;

    const MyComponentFactory =
      `MyComponent.ɵfac = function MyComponent_Factory(t) { return new (t || MyComponent)(); };`;

    const result = prelink(files, angularFiles);
    const source = result.source;

    expectEmit(source, ChildComponentDefinition, 'Incorrect ChildComponent.ɵcmp');
    expectEmit(source, ChildComponentFactory, 'Incorrect ChildComponent.ɵfac');
    expectEmit(source, SomeDirectiveDefinition, 'Incorrect SomeDirective.ɵdir');
    expectEmit(source, SomeDirectiveFactory, 'Incorrect SomeDirective.ɵfac');
    expectEmit(source, MyComponentDefinition, 'Incorrect MyComponentDefinition.ɵcmp');
    expectEmit(source, MyComponentFactory, 'Incorrect MyComponentDefinition.ɵfac');
  });

  xdescribe('components & directives', () => {
    xit('should instantiate directives', () => {
      const files = {
        app: {
          'spec.ts': `
            import {Component, Directive, NgModule} from '@angular/core';

            @Component({selector: 'child', template: 'child-view'})
            export class ChildComponent {}

            @Directive({selector: '[some-directive]'})
            export class SomeDirective {}

            @Component({selector: 'my-component', template: '<child some-directive></child>!'})
            export class MyComponent {}

            @NgModule({declarations: [ChildComponent, SomeDirective, MyComponent]})
            export class MyModule{}
          `
        }
      };

      // ChildComponent definition should be:
      const ChildComponentDefinition = `
        ChildComponent.ɵcmp = $r3$.ɵɵdefineComponent({
          type: ChildComponent,
          selectors: [["child"]],
          decls: 1,
          vars: 0,
          template:  function ChildComponent_Template(rf, ctx) {
            if (rf & 1) {
              $r3$.ɵɵtext(0, "child-view");
            }
          },
          encapsulation: 2
        });`;

      const ChildComponentFactory =
          `ChildComponent.ɵfac = function ChildComponent_Factory(t) { return new (t || ChildComponent)(); };`;

      // SomeDirective definition should be:
      const SomeDirectiveDefinition = `
        SomeDirective.ɵdir = $r3$.ɵɵdefineDirective({
          type: SomeDirective,
          selectors: [["", "some-directive", ""]]
        });
      `;

      const SomeDirectiveFactory =
          `SomeDirective.ɵfac = function SomeDirective_Factory(t) {return new (t || SomeDirective)(); };`;

      // MyComponent definition should be:
      const MyComponentDefinition = `
        …
        MyComponent.ɵcmp = $r3$.ɵɵdefineComponent({
          type: MyComponent,
          selectors: [["my-component"]],
          decls: 2,
          vars: 0,
          consts: [["some-directive", ""]],
          template:  function MyComponent_Template(rf, ctx) {
            if (rf & 1) {
              $r3$.ɵɵelement(0, "child", 0);
              $r3$.ɵɵtext(1, "!");
            }
          },
          directives: [ChildComponent, SomeDirective],
          encapsulation: 2
        });
      `;

      const MyComponentFactory =
          `MyComponent.ɵfac = function MyComponent_Factory(t) { return new (t || MyComponent)(); };`;

      const result = prelink(files, angularFiles);
      const source = result.source;

      expectEmit(source, ChildComponentDefinition, 'Incorrect ChildComponent.ɵcmp');
      expectEmit(source, ChildComponentFactory, 'Incorrect ChildComponent.ɵfac');
      expectEmit(source, SomeDirectiveDefinition, 'Incorrect SomeDirective.ɵdir');
      expectEmit(source, SomeDirectiveFactory, 'Incorrect SomeDirective.ɵfac');
      expectEmit(source, MyComponentDefinition, 'Incorrect MyComponentDefinition.ɵcmp');
      expectEmit(source, MyComponentFactory, 'Incorrect MyComponentDefinition.ɵfac');
    });

    xit('should support components without selector', () => {
      const files = {
        app: {
          'spec.ts': `
            import {Component, Directive, NgModule} from '@angular/core';

            @Component({template: '<router-outlet></router-outlet>'})
            export class EmptyOutletComponent {}

            @NgModule({declarations: [EmptyOutletComponent]})
            export class MyModule{}
          `
        }
      };

      // EmptyOutletComponent definition should be:
      const EmptyOutletComponentDefinition = `
        …
        EmptyOutletComponent.ɵcmp = $r3$.ɵɵdefineComponent({
          type: EmptyOutletComponent,
          selectors: [["ng-component"]],
          decls: 1,
          vars: 0,
          template: function EmptyOutletComponent_Template(rf, ctx) {
            if (rf & 1) {
              $r3$.ɵɵelement(0, "router-outlet");
            }
          },
          encapsulation: 2
        });
      `;

      const EmptyOutletComponentFactory =
          `EmptyOutletComponent.ɵfac = function EmptyOutletComponent_Factory(t) { return new (t || EmptyOutletComponent)(); };`;

      const result = prelink(files, angularFiles);
      const source = result.source;

      expectEmit(source, EmptyOutletComponentDefinition, 'Incorrect EmptyOutletComponent.ɵcmp');
      expectEmit(source, EmptyOutletComponentFactory, 'Incorrect EmptyOutletComponent.ɵfac');
    });

    xdescribe('queries', () => {
      const directive = {
        'some.directive.ts': `
          import {Directive} from '@angular/core';

          @Directive({
            selector: '[someDir]',
          })
          export class SomeDirective { }
        `
      };

      xit('should support view queries with directives', () => {
        const files = {
          app: {
            ...directive,
            'view_query.component.ts': `
            import {Component, NgModule, ViewChild, ViewChildren} from '@angular/core';
            import {SomeDirective} from './some.directive';

            @Component({
              selector: 'view-query-component',
              template: \`
                <div someDir></div>
              \`
            })
            export class ViewQueryComponent {
              @ViewChild(SomeDirective) someDir: SomeDirective;
              @ViewChildren(SomeDirective) someDirs: QueryList<SomeDirective>;
            }

            @NgModule({declarations: [SomeDirective, ViewQueryComponent]})
            export class MyModule {}
            `
          }
        };

        const ViewQueryComponentDefinition = `
          …
          ViewQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            type: ViewQueryComponent,
            selectors: [["view-query-component"]],
            viewQuery: function ViewQueryComponent_Query(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵviewQuery(SomeDirective, true);
                $r3$.ɵɵviewQuery(SomeDirective, true);
              }
              if (rf & 2) {
                var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDir = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDirs = $tmp$);
              }
            },
            decls: 1,
            vars: 0,
            consts: [["someDir",""]],
            template:  function ViewQueryComponent_Template(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵelement(0, "div", 0);
              }
            },
            directives: function () { return [SomeDirective]; },
            encapsulation: 2
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ViewQueryComponentDefinition, 'Invalid ViewQuery declaration');
      });

      xit('should support view queries with local refs', () => {
        const files = {
          app: {
            'view_query.component.ts': `
            import {Component, NgModule, ViewChild, ViewChildren, QueryList} from '@angular/core';

            @Component({
              selector: 'view-query-component',
              template: \`
                <div #myRef></div>
                <div #myRef1></div>
              \`
            })
            export class ViewQueryComponent {
              @ViewChild('myRef') myRef: any;
              @ViewChildren('myRef1, myRef2, myRef3') myRefs: QueryList<any>;
            }

            @NgModule({declarations: [ViewQueryComponent]})
            export class MyModule {}
            `
          }
        };

        const ViewQueryComponentDefinition = `
          const $e0_attrs$ = ["myRef"];
          const $e1_attrs$ = ["myRef1", "myRef2", "myRef3"];
          …
          ViewQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            …
            viewQuery: function ViewQueryComponent_Query(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵviewQuery($e0_attrs$, true);
                $r3$.ɵɵviewQuery($e1_attrs$, true);
              }
              if (rf & 2) {
                var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRef = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRefs = $tmp$);
              }
            },
            …
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ViewQueryComponentDefinition, 'Invalid ViewQuery declaration');
      });

      xit('should support static view queries', () => {
        const files = {
          app: {
            ...directive,
            'view_query.component.ts': `
            import {Component, NgModule, ViewChild} from '@angular/core';
            import {SomeDirective} from './some.directive';

            @Component({
              selector: 'view-query-component',
              template: \`
                <div someDir></div>
              \`
            })
            export class ViewQueryComponent {
              @ViewChild(SomeDirective, {static: true}) someDir !: SomeDirective;
              @ViewChild('foo') foo !: ElementRef;
            }

            @NgModule({declarations: [SomeDirective, ViewQueryComponent]})
            export class MyModule {}
            `
          }
        };

        const ViewQueryComponentDefinition = `
          const $refs$ = ["foo"];
          …
          ViewQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            type: ViewQueryComponent,
            selectors: [["view-query-component"]],
            viewQuery: function ViewQueryComponent_Query(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵstaticViewQuery(SomeDirective, true);
                $r3$.ɵɵviewQuery($refs$, true);
              }
              if (rf & 2) {
                var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDir = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.foo = $tmp$.first);
              }
            },
            decls: 1,
            vars: 0,
            consts: [["someDir",""]],
            template:  function ViewQueryComponent_Template(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵelement(0, "div", 0);
              }
            },
            directives: function () { return [SomeDirective]; },
            encapsulation: 2
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ViewQueryComponentDefinition, 'Invalid ViewQuery declaration');
      });

      xit('should support view queries with read tokens specified', () => {
        const files = {
          app: {
            ...directive,
            'view_query.component.ts': `
            import {Component, NgModule, ViewChild, ViewChildren, QueryList, ElementRef, TemplateRef} from '@angular/core';
            import {SomeDirective} from './some.directive';

            @Component({
              selector: 'view-query-component',
              template: \`
                <div someDir></div>
                <div #myRef></div>
                <div #myRef1></div>
              \`
            })
            export class ViewQueryComponent {
              @ViewChild('myRef', {read: TemplateRef}) myRef: TemplateRef;
              @ViewChildren('myRef1, myRef2, myRef3', {read: ElementRef}) myRefs: QueryList<ElementRef>;
              @ViewChild(SomeDirective, {read: ElementRef}) someDir: ElementRef;
              @ViewChildren(SomeDirective, {read: TemplateRef}) someDirs: QueryList<TemplateRef>;
            }

            @NgModule({declarations: [ViewQueryComponent]})
            export class MyModule {}
            `
          }
        };

        const ViewQueryComponentDefinition = `
          const $e0_attrs$ = ["myRef"];
          const $e1_attrs$ = ["myRef1", "myRef2", "myRef3"];
          …
          ViewQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            …
            viewQuery: function ViewQueryComponent_Query(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵviewQuery($e0_attrs$, true, TemplateRef);
                $r3$.ɵɵviewQuery(SomeDirective, true, ElementRef);
                $r3$.ɵɵviewQuery($e1_attrs$, true, ElementRef);
                $r3$.ɵɵviewQuery(SomeDirective, true, TemplateRef);
              }
              if (rf & 2) {
                var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRef = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDir = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRefs = $tmp$);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDirs = $tmp$);
              }
            },
            …
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ViewQueryComponentDefinition, 'Invalid ViewQuery declaration');
      });

      xit('should support content queries with directives', () => {
        const files = {
          app: {
            ...directive,
            'content_query.ts': `
            import {Component, ContentChild, ContentChildren, NgModule, QueryList} from '@angular/core';
            import {SomeDirective} from './some.directive';

            @Component({
              selector: 'content-query-component',
              template: \`
                <div><ng-content></ng-content></div>
              \`
            })
            export class ContentQueryComponent {
              @ContentChild(SomeDirective) someDir: SomeDirective;
              @ContentChildren(SomeDirective) someDirList !: QueryList<SomeDirective>;
            }

            @Component({
              selector: 'my-app',
              template: \`
                <content-query-component>
                  <div someDir></div>
                </content-query-component>
              \`
            })
            export class MyApp { }

            @NgModule({declarations: [SomeDirective, ContentQueryComponent, MyApp]})
            export class MyModule { }
            `
          }
        };

        const ContentQueryComponentDefinition = `
          ContentQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            type: ContentQueryComponent,
            selectors: [["content-query-component"]],
            contentQueries: function ContentQueryComponent_ContentQueries(rf, ctx, dirIndex) {
              if (rf & 1) {
              $r3$.ɵɵcontentQuery(dirIndex, SomeDirective, true);
              $r3$.ɵɵcontentQuery(dirIndex, SomeDirective, false);
              }
              if (rf & 2) {
              var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDir = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDirList = $tmp$);
              }
            },
            ngContentSelectors: _c0,
            decls: 2,
            vars: 0,
            template:  function ContentQueryComponent_Template(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵprojectionDef();
                $r3$.ɵɵelementStart(0, "div");
                $r3$.ɵɵprojection(1);
                $r3$.ɵɵelementEnd();
              }
            },
            encapsulation: 2
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ContentQueryComponentDefinition, 'Invalid ContentQuery declaration');
      });

      xit('should support content queries with local refs', () => {
        const files = {
          app: {
            'content_query.component.ts': `
            import {Component, ContentChild, ContentChildren, NgModule, QueryList} from '@angular/core';

            @Component({
              selector: 'content-query-component',
              template: \`
                <div #myRef></div>
                <div #myRef1></div>
              \`
            })
            export class ContentQueryComponent {
              @ContentChild('myRef') myRef: any;
              @ContentChildren('myRef1, myRef2, myRef3') myRefs: QueryList<any>;
            }
            @NgModule({declarations: [ContentQueryComponent]})
            export class MyModule {}
          `
          }
        };

        const ContentQueryComponentDefinition = `
          const $e0_attrs$ = ["myRef"];
          const $e1_attrs$ = ["myRef1", "myRef2", "myRef3"];
          …
          ContentQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            …
            contentQueries: function ContentQueryComponent_ContentQueries(rf, ctx, dirIndex) {
              if (rf & 1) {
              $r3$.ɵɵcontentQuery(dirIndex, $e0_attrs$, true);
              $r3$.ɵɵcontentQuery(dirIndex, $e1_attrs$, false);
              }
              if (rf & 2) {
              var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRef = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRefs = $tmp$);
              }
            },
            …
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ContentQueryComponentDefinition, 'Invalid ContentQuery declaration');
      });

      xit('should support static content queries', () => {
        const files = {
          app: {
            ...directive,
            'content_query.ts': `
            import {Component, ContentChild, NgModule} from '@angular/core';
            import {SomeDirective} from './some.directive';

            @Component({
              selector: 'content-query-component',
              template: \`
                <div><ng-content></ng-content></div>
              \`
            })
            export class ContentQueryComponent {
              @ContentChild(SomeDirective, {static: true}) someDir !: SomeDirective;
              @ContentChild('foo') foo !: ElementRef;
            }

            @Component({
              selector: 'my-app',
              template: \`
                <content-query-component>
                  <div someDir></div>
                </content-query-component>
              \`
            })
            export class MyApp { }

            @NgModule({declarations: [SomeDirective, ContentQueryComponent, MyApp]})
            export class MyModule { }
            `
          }
        };

        const ContentQueryComponentDefinition = `
          ContentQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            type: ContentQueryComponent,
            selectors: [["content-query-component"]],
            contentQueries: function ContentQueryComponent_ContentQueries(rf, ctx, dirIndex) {
              if (rf & 1) {
              $r3$.ɵɵstaticContentQuery(dirIndex, SomeDirective, true);
              $r3$.ɵɵcontentQuery(dirIndex, $ref0$, true);
              }
              if (rf & 2) {
              var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDir = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.foo = $tmp$.first);
              }
            },
            ngContentSelectors: $_c1$,
            decls: 2,
            vars: 0,
            template:  function ContentQueryComponent_Template(rf, ctx) {
              if (rf & 1) {
                $r3$.ɵɵprojectionDef();
                $r3$.ɵɵelementStart(0, "div");
                $r3$.ɵɵprojection(1);
                $r3$.ɵɵelementEnd();
              }
            },
            encapsulation: 2
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ContentQueryComponentDefinition, 'Invalid ContentQuery declaration');
      });

      xit('should support content queries with read tokens specified', () => {
        const files = {
          app: {
            ...directive,
            'content_query.component.ts': `
            import {Component, ContentChild, ContentChildren, NgModule, QueryList, ElementRef, TemplateRef} from '@angular/core';
            import {SomeDirective} from './some.directive';

            @Component({
              selector: 'content-query-component',
              template: \`
                <div someDir></div>
                <div #myRef></div>
                <div #myRef1></div>
              \`
            })
            export class ContentQueryComponent {
              @ContentChild('myRef', {read: TemplateRef}) myRef: TemplateRef;
              @ContentChildren('myRef1, myRef2, myRef3', {read: ElementRef}) myRefs: QueryList<ElementRef>;
              @ContentChild(SomeDirective, {read: ElementRef}) someDir: ElementRef;
              @ContentChildren(SomeDirective, {read: TemplateRef}) someDirs: QueryList<TemplateRef>;
            }
            @NgModule({declarations: [ContentQueryComponent]})
            export class MyModule {}
          `
          }
        };

        const ContentQueryComponentDefinition = `
          const $e0_attrs$ = ["myRef"];
          const $e1_attrs$ = ["myRef1", "myRef2", "myRef3"];
          …
          ContentQueryComponent.ɵcmp = $r3$.ɵɵdefineComponent({
            …
            contentQueries: function ContentQueryComponent_ContentQueries(rf, ctx, dirIndex) {
              if (rf & 1) {
                $r3$.ɵɵcontentQuery(dirIndex, $e0_attrs$, true, TemplateRef);
              $r3$.ɵɵcontentQuery(dirIndex, SomeDirective, true, ElementRef);
              $r3$.ɵɵcontentQuery(dirIndex, $e1_attrs$, false, ElementRef);
              $r3$.ɵɵcontentQuery(dirIndex, SomeDirective, false, TemplateRef);
              }
              if (rf & 2) {
              var $tmp$;
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRef = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDir = $tmp$.first);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.myRefs = $tmp$);
                $r3$.ɵɵqueryRefresh($tmp$ = $r3$.ɵɵloadQuery()) && (ctx.someDirs = $tmp$);
              }
            },
            …
          });`;

        const result = prelink(files, angularFiles);
        const source = result.source;

        expectEmit(source, ContentQueryComponentDefinition, 'Invalid ContentQuery declaration');
      });
    });

    xit('should instantiate directives in a closure when they are forward referenced', () => {
      const files = {
        app: {
          'spec.ts': `
            import {Component, NgModule, Directive} from '@angular/core';

            @Component({
              selector: 'host-binding-comp',
              template: \`
                <my-forward-directive></my-forward-directive>
              \`
            })
            export class HostBindingComp {
            }

            @Directive({
              selector: 'my-forward-directive'
            })
            class MyForwardDirective {}

            @NgModule({declarations: [HostBindingComp, MyForwardDirective]})
            export class MyModule {}
          `
        }
      };

      const MyAppDefinition = `
        …
        directives: function () { return [MyForwardDirective]; }
        …
      `;

      const result = prelink(files, angularFiles);
      const source = result.source;
      expectEmit(source, MyAppDefinition, 'Invalid component definition');
    });

    xit('should instantiate pipes in a closure when they are forward referenced', () => {
      const files = {
        app: {
          'spec.ts': `
            import {Component, NgModule, Pipe} from '@angular/core';

            @Component({
              selector: 'host-binding-comp',
              template: \`
                <div [attr.style]="{} | my_forward_pipe">...</div>
              \`
            })
            export class HostBindingComp {
            }

            @Pipe({
              name: 'my_forward_pipe'
            })
            class MyForwardPipe {}

            @NgModule({declarations: [HostBindingComp, MyForwardPipe]})
            export class MyModule {}
          `
        }
      };

      const MyAppDefinition = `
        …
        pipes: function () { return [MyForwardPipe]; }
        …
      `;

      const result = prelink(files, angularFiles);
      const source = result.source;
      expectEmit(source, MyAppDefinition, 'Invalid component definition');
    });

    xit('should split multiple `exportAs` values into an array', () => {
      const files = {
        app: {
          'spec.ts': `
            import {Directive, NgModule} from '@angular/core';

            @Directive({selector: '[some-directive]', exportAs: 'someDir, otherDir'})
            export class SomeDirective {}

            @NgModule({declarations: [SomeDirective]})
            export class MyModule{}
          `
        }
      };

      // SomeDirective definition should be:
      const SomeDirectiveDefinition = `
        SomeDirective.ɵdir = $r3$.ɵɵdefineDirective({
          type: SomeDirective,
          selectors: [["", "some-directive", ""]],
          exportAs: ["someDir", "otherDir"]
        });
      `;

      const result = prelink(files, angularFiles);
      const source = result.source;

      expectEmit(source, SomeDirectiveDefinition, 'Incorrect SomeDirective.ɵdir');
    });

    xit('should not generate a selectors array if the directive does not have a selector', () => {
      const files = {
        app: {
          'spec.ts': `
            import {Directive} from '@angular/core';

            @Directive()
            export class AbstractDirective {
            }
          `
        }
      };
      const expectedOutput = `
      // ...
      AbstractDirective.ɵdir = $r3$.ɵɵdefineDirective({
        type: AbstractDirective
      });
      // ...
      `;
      const result = prelink(files, angularFiles);
      expectEmit(result.source, expectedOutput, 'Invalid directive definition');
    });

  });
});


export function prelink(
  data: MockDirectory, angularFiles: MockData, options: AotCompilerOptions = {},
  errorCollector: (error: any, fileName?: string) => void = error => {
    throw error;
  }): {
  source: string,
} {
  setFileSystem(new NodeJSFileSystem());
  const testFiles = toMockFileArray(data);
  const scripts = testFiles.map(entry => entry.fileName);
  const angularFilesArray = toMockFileArray(angularFiles);
  const files = arrayToMockDir([...testFiles, ...angularFilesArray]);
  const mockCompilerHost = new MockCompilerHost(scripts, files);

  const program = new NgtscProgram(
    scripts, {
      target: ts.ScriptTarget.ES2015,
      module: ts.ModuleKind.ES2015,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      enableI18nLegacyMessageIdFormat: false,
      compilationModel: 'prelink',
      ...options,
    },
    mockCompilerHost);
  program.emit();
  const source =
    scripts.map(script => mockCompilerHost.readFile(script.replace(/\.ts$/, '.js'))).join('\n');

  return {source};
}

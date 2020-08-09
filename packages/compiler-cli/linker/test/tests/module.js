// clang-format off
import * as i0 from '@angular/core';

class MyComponent {}

MyComponent.ɵcmp = i0.$ngDeclareComponent({
  version: 1,
  template: '<child *ngIf="true" some-directive>{{ 1 | multiply:2 }}</child>!',
  styles: [],
  type: MyComponent,
  selector: 'my-component',
  inputs: {input: 'input', aliasedIn: ['in', 'aliasedIn']},
  outputs: {output: 'output', aliasedOut: 'out'},
  host: {
    attributes: {},
    listeners: {'click': 'handleClick($event)', 'mouseover': 'hostListener($event.target)'},
    properties: {'a': 'foo.bar', 'hostExpr': 'hostExpr'}
  },
  directives: [
    {
      selector: 'child',
      type: function() {
        return ChildComponent;
      },
      inputs: ['input', 'in'],
      outputs: ['output', 'out'],
      exportAs: ['child1', 'child2']
    },
    {
      selector: '[some-directive]',
      type: function() {
        return SomeDirective;
      },
      inputs: [],
      outputs: [],
      exportAs: null
    }
  ],
  pipes: {
    'multiply': function() {
      return MultiplyPipe;
    }
  },
  queries: [],
  viewQueries: [],
  providers: [{provide: 'a', useValue: 'A'}],
  viewProviders: [{provide: 'b', useValue: 'B'}],
  animations: null,
  exportAs: [],
  encapsulation: i0.ViewEncapsulation.Emulated,
  changeDetection: i0.ChangeDetectionStrategy.OnPush,
  interpolation: ['{{', '}}'],
  usesInheritance: false,
  fullInheritance: false,
  usesOnChanges: false,
  ngImport: i0
});

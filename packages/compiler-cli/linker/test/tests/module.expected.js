// clang-format off
import * as i0 from '@angular/core';
var _c0 = ["b"];
var _c1 = ["c"];
var _c2 = ["a"];

function MyComponent_child_0_Template(rf, ctx) {
  if (rf & 1) {
    i0.ɵɵelementStart(0, "child", 1);
    i0.ɵɵtext(1);
    i0.ɵɵpipe(2, "multiply");
    i0.ɵɵelementEnd();
  }

  if (rf & 2) {
    i0.ɵɵadvance(1);
    i0.ɵɵtextInterpolate(i0.ɵɵpipeBind2(2, 1, 1, 2));
  }
}

class MyComponent {
}

MyComponent.ɵcmp = i0.ɵɵdefineComponent({
  type: MyComponent,
  selectors: [["my-component"]],
  contentQueries: function MyComponent_ContentQueries(rf, ctx, dirIndex) {
    if (rf & 1) {
      i0.ɵɵstaticContentQuery(dirIndex, _c0, true, i0.ViewComponentRef);
      i0.ɵɵcontentQuery(dirIndex, _c1, false);
    }

    if (rf & 2) {
      var _t;

      i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.contentChild = _t.first);
      i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.contentChildren = _t);
    }
  },
  viewQuery: function MyComponent_Query(rf, ctx) {
    if (rf & 1) {
      i0.ɵɵstaticViewQuery(ChildComponent, true, i0.ViewComponentRef);
      i0.ɵɵviewQuery(_c2, true);
    }

    if (rf & 2) {
      var _t;

      i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.viewChild = _t.first);
      i0.ɵɵqueryRefresh(_t = i0.ɵɵloadQuery()) && (ctx.viewChildren = _t);
    }
  },
  hostVars: 2,
  hostBindings: function MyComponent_HostBindings(rf, ctx) {
    if (rf & 1) {
      i0.ɵɵlistener("click", function MyComponent_click_HostBindingHandler($event) {
        return ctx.handleClick($event);
      })("mouseover", function MyComponent_mouseover_HostBindingHandler($event) {
        return ctx.hostListener($event.target);
      });
    }

    if (rf & 2) {
      i0.ɵɵhostProperty("a", ctx.foo.bar)("hostExpr", ctx.hostExpr);
    }
  },
  inputs: {
    input: "input",
    aliasedIn: ["in", "aliasedIn"]
  },
  outputs: {
    output: "output",
    aliasedOut: "out"
  },
  exportAs: [],
  features: [i0.ɵɵProvidersFeature([{
    provide: 'a',
    useValue: 'A'
  }], [{
    provide: 'b',
    useValue: 'B'
  }])],
  decls: 2,
  vars: 1,
  consts: [["some-directive", "", 4, "ngIf"], ["some-directive", ""]],
  template: function MyComponent_Template(rf, ctx) {
    if (rf & 1) {
      i0.ɵɵtemplate(0, MyComponent_child_0_Template, 3, 4, "child", 0);
      i0.ɵɵtext(1, "!");
    }

    if (rf & 2) {
      i0.ɵɵproperty("ngIf", true);
    }
  },
  directives: function() {
    return [ChildComponent, SomeDirective];
  },
  pipes: function () {
    return [MultiplyPipe];
  },
  encapsulation: 2,
  data: {
    animation: null
  },
  changeDetection: 0
});

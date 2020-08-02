// clang-format off
import * as i0 from '@angular/core';

var _c0 = function () {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9];
};

class MyComponent {}
MyComponent.ɵcmp = i0.ɵɵdefineComponent({
  type: MyComponent,
  selectors: [["my-component"]],
  exportAs: [],
  features: [i0.ɵɵProvidersFeature([], [])],
  decls: 2,
  vars: 2,
  consts: [[3, "constant"]],
  template: function MyComponent_Template(rf, ctx) {
    if (rf & 1) {
      i0.ɵɵelement(0, "child", 0);
      i0.ɵɵtext(1, "!");
    }

    if (rf & 2) {
      i0.ɵɵproperty("constant", i0.ɵɵpureFunction0(1, _c0));
    }
  },
  encapsulation: 2,
  data: {
    animation: null
  },
  changeDetection: 0
});

class DuplicateComponent {}
DuplicateComponent.ɵcmp = i0.ɵɵdefineComponent({
  type: DuplicateComponent,
  selectors: [["my-component"]],
  exportAs: [],
  features: [i0.ɵɵProvidersFeature([], [])],
  decls: 2,
  vars: 2,
  consts: [[3, "constant"]],
  template: function DuplicateComponent_Template(rf, ctx) {
    if (rf & 1) {
      i0.ɵɵelement(0, "child", 0);
      i0.ɵɵtext(1, "!");
    }

    if (rf & 2) {
      i0.ɵɵproperty("constant", i0.ɵɵpureFunction0(1, _c0));
    }
  },
  encapsulation: 2,
  data: {
    animation: null
  },
  changeDetection: 0
});

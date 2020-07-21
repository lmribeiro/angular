/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {getCompilerFacade} from '../../compiler/compiler_facade';
import {R3DeclareComponentMetadata} from '../../compiler/compiler_facade_interface';
import {NG_COMP_DEF} from '../fields';

import {angularCoreEnv} from './environment';

export function $ngDeclareComponent(decl: R3DeclareComponentMetadata): void {
  let ngComponentDef: any = null;
  Object.defineProperty(decl.type, NG_COMP_DEF, {
    get: () => {
      if (ngComponentDef === null) {
        const compiler = getCompilerFacade();
        ngComponentDef = compiler.compilePrelinkedComponent(
            angularCoreEnv, `ng:///${decl.type.name}/template.html`, decl);
        return ngComponentDef;
      }
    }
  });
}

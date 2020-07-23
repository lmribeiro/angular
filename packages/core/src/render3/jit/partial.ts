/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {getCompilerFacade} from '../../compiler/compiler_facade';
import {R3DeclareComponentMetadata} from '../../compiler/compiler_facade_interface';
import {ComponentDef} from '../interfaces/definition';

import {angularCoreEnv} from './environment';

export function $ngDeclareComponent<T>(decl: R3DeclareComponentMetadata): ComponentDef<T> {
  const compiler = getCompilerFacade();
  return compiler.compilePrelinkedComponent(
      angularCoreEnv, `ng:///${decl.type.name}/template.html`, decl);
}

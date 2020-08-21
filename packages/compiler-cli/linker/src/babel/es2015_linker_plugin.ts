/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {PluginObj} from '@babel/core';
import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';

import {isFatalLinkerError} from '../api';
import {createLinker, FileLinker, LinkerEnvironment} from '../linker';

import {BabelFactory} from './babel_factory';
import {BabelAstHost} from './babel_host';
import {buildCodeFrameError} from './source_file_utils';

export function makeEs2015LinkerPlugin(): PluginObj<State> {
  const env: LinkerEnvironment<t.Statement, t.Expression> = {
    astHost: new BabelAstHost(),
    factory: new BabelFactory(),
  };

  return {
    visitor: {
      Program: {
        enter(path: NodePath<t.Program>, state: State): void {
          state.linker = createLinker(path.hub.file.opts.filename, path.hub.file.code, env, {
            // Note: instead of relying on `sourceType` (which depends on the equivalently named
            // Babel parser option) we may want to look for import/export statements here.
            enableGlobalStatements: path.node.sourceType === 'module',
          });
        },
        exit(path: NodePath<t.Program>, state: State): void {
          const globalStatements = state.linker!.getGlobalStatements();
          if (globalStatements !== null) {
            const stmts = path.get('body') as NodePath<t.Statement>[];
            const importDecls = stmts.filter(stmt => stmt.isImportDeclaration());

            if (importDecls.length > 0) {
              const lastImport = importDecls[importDecls.length - 1];
              lastImport.insertAfter(globalStatements);
            } else {
              path.unshiftContainer('body', globalStatements);
            }
          }
          state.linker = undefined;
        }
      },

      CallExpression(path: NodePath<t.CallExpression>, state: State): void {
        if (state.linker === undefined) {
          return;
        }

        const callee = path.node.callee;
        if (t.isV8IntrinsicIdentifier(callee)) {
          return;
        }
        const args = path.node.arguments as t.Expression[];

        try {
          const replacement = state.linker.linkCall(callee, args);
          if (replacement === null) {
            return;
          }

          path.skip();
          path.replaceWith(replacement);
        } catch (e) {
          const node = isFatalLinkerError(e) ? e.node as t.Node : path.node;
          throw buildCodeFrameError(path, e.message, node);
        }
      }
    }
  };
}

interface State {
  linker?: FileLinker<t.Statement, t.Expression>;
}

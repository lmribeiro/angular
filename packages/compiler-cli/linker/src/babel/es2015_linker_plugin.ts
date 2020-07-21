/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {NodePath, PluginObj} from '@babel/core';
import * as t from '@babel/types';
import {buildCodeFrameError, isBabelParseError} from './source_file_utils';

export function makeEs2015LinkerPlugin(): PluginObj {
  return {
    visitor: {
      CallExpression(path: NodePath<t.CallExpression>) {
        try {
          // ...
        } catch (e) {
          if (isBabelParseError(e)) {
            // If we get a BabelParseError here then something went wrong with Babel itself
            // since there must be something wrong with the structure of the AST generated
            // by Babel parsing a TaggedTemplateExpression.
            throw buildCodeFrameError(path, e);
          }
        }
      }
    }
  };
}

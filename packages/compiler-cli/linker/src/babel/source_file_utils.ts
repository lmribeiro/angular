/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {AbsoluteFsPath, relative, resolve} from '../../../src/ngtsc/file_system';
import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';

export class BabelParseError extends Error {
  private readonly type = 'BabelParseError';
  constructor(public node: t.Node, message: string) {
    super(message);
  }
}

export function isBabelParseError(e: any): e is BabelParseError {
  return e.type === 'BabelParseError';
}

export function buildCodeFrameError(path: NodePath, e: BabelParseError): string {
  const filename = path.hub.file.opts.filename || '(unknown file)';
  const message = path.hub.file.buildCodeFrameError(e.node, e.message).message;
  return `${filename}: ${message}`;
}

function getFileFromPath(path: NodePath|undefined): AbsoluteFsPath|null {
  const opts = path?.hub.file.opts;
  return opts?.filename ?
      resolve(opts.generatorOpts.sourceRoot, relative(opts.cwd, opts.filename)) :
      null;
}

function getLineAndColumn(loc: {line: number, column: number}): {line: number, column: number} {
  // Note we want 0-based line numbers but Babel returns 1-based.
  return {line: loc.line - 1, column: loc.column};
}

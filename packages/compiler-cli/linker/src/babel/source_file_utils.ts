/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {NodePath} from '@babel/traverse';
import * as t from '@babel/types';
import {FatalLinkerError} from '../api';

export function buildCodeFrameError(path: NodePath, message: string, node: t.Node): string {
  const file = path.hub.file;
  const filename = file.opts.filename || '(unknown file)';
  const error = file.buildCodeFrameError(node, message);
  return `${filename}: ${error.message}`;
}

export function extractRightMostName(node: t.Expression|t.V8IntrinsicIdentifier): string|null {
  if (t.isIdentifier(node)) {
    return node.name;
  } else if (t.isMemberExpression(node)) {
    return extractRightMostName(node.property);
  } else {
    return null;
  }
}

// @babel/types has commented out the `assertXXX` exports, presumably because its `asserts` return
// type requires a recent TS version.
export function assert<T extends t.Node>(
    node: t.Node, cb: (node: t.Node) => node is T, expected: string): asserts node is T {
  if (!cb(node)) {
    throw new FatalLinkerError(node, `Unsupported syntax, expected ${expected}`);
  }
}

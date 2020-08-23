/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {transformFileSync} from '@babel/core';
import {readFileSync} from 'fs';
import {resolve} from 'path';

import {makeEs2015LinkerPlugin} from '../src/babel/es2015_linker_plugin';
import {LinkerOptions} from '../src/linker';

import {expectEmit} from './expect_emit';

describe('linker integration', () => {
  it('should work for modules', () => runTest('module'));
  it('should share constants in modules', () => runTest('shared-constants'));
  it('should use IIFEs in scripts', () => runTest('script'));
});

function runTest(name: string): void {
  const filename = resolve(__dirname, 'tests', `${name}.js`);
  const expected = readFileSync(resolve(__dirname, 'tests', `${name}.expected.js`), 'utf-8');

  const actual = link(filename, {});
  expectEmit(actual, expected, 'Incorrect compilation');
}

function link(filename: string, linkerOptions: Partial<LinkerOptions>): string {
  const result = transformFileSync(filename, {
    plugins: [makeEs2015LinkerPlugin(linkerOptions)],
    parserOpts: {sourceType: 'unambiguous'},
  });
  if (result === null) {
    throw fail('Failed to transform');
  }
  if (result.code == null) {
    throw fail('Transform result does not have any code');
  }
  return result.code;
}

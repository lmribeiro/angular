#!/usr/bin/env node
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as yargs from 'yargs';

import {NodeJSFileSystem, setFileSystem} from '../../src/ngtsc/file_system';

if (require.main === module) {
  const args = process.argv.slice(2);
  const options =
      yargs
          .option('s', {
            alias: 'source',
            required: true,
            describe: '',
          })
          .strict()
          .help()
          .parse(args);

  const fs = new NodeJSFileSystem();
  setFileSystem(fs);


}

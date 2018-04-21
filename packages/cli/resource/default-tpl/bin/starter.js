#!/usr/bin/env node
"use strict";

try {
  require('ts-node/register')
} catch (e) {}
const parentDir = require.extensions['.ts'] ? 'src' : 'lib'
require(`../${parentDir}/global-setting`)
require('olympic-util/lib/process-event-log')
require(`../${parentDir}/process/worker`)
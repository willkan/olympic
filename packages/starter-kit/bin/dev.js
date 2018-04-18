#!/usr/bin/env node
"use strict";

const { fork } = require('child_process')
const watch = require('glob-watcher')
const { createLog } = require("olympic-util/lib/log")
const parse = require('minimist')

const argv = parse(process.argv)
const workerPath = argv.worker || './bin/starter.js'

const logger = createLog('dev')

let child

const startChild = () => {
  child = fork(workerPath)
  logger.info(`child [${workerPath}] has been started`)
}

startChild()

const watcher = watch([
  'etc/*',
  'src/**/*'
])

watcher.on('change', function(path, stat) {
  logger.info('file [' + path + '] is changed')
  child.kill()
  logger.info('child has been killed')
  startChild()
});
import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as yaml from 'js-yaml'

let etcDir = process.cwd()
let envEtcPath

export function setEtcDir(_etcDir: string) {
  etcDir = _etcDir
}

export function setEnvEtcPath(_envEtcPath: string) {
  envEtcPath = _envEtcPath
}

let etc

function init() {
  let defaultPath = path.join(etcDir, "config.default.yaml")
  const _envEtcPath = envEtcPath == void 0 ? envEtcPath = path.join(etcDir, "config.yaml") : envEtcPath
  let defaultEtc = yaml.safeLoad(fs.readFileSync(defaultPath, 'utf8'))
  let envEtc
  if (fs.existsSync(_envEtcPath)) {
    envEtc = yaml.safeLoad(fs.readFileSync(_envEtcPath, 'utf8'))
  } else {
    console.warn(`cannot found ${_envEtcPath}, it will only use config.default.yaml as etc`)
  }
  etc = _.extend({
    root: path.join(etcDir)
  }, defaultEtc, envEtc)
}

export function clear() {
  etc = null
}

export function getEtc() {
  if (etc) return etc
  init()
  return etc
}

export function mock(mockEtc: {[key: string]: any}) {
  etc = _.extend({}, getEtc(), mockEtc)
}

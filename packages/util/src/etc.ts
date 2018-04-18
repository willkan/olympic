import * as fs from 'fs'
import * as path from 'path'
import * as _ from 'lodash'
import * as yaml from 'js-yaml'

let etcDir = process.cwd()

export function setEtcDir(_etcDir: string) {
  etcDir = _etcDir
}

let etc

function init() {
  let defaultPath = path.join(etcDir, "config.default.yaml")
  let envPath = path.join(etcDir, "config.yaml")
  let defaultEtc = yaml.safeLoad(fs.readFileSync(defaultPath, 'utf8'))
  let envEtc
  if (fs.existsSync(envPath)) {
    envEtc = yaml.safeLoad(fs.readFileSync(envPath, 'utf8'))
  } else {
    console.warn('cannot found config.yaml, it will only use config.default.yaml as etc')
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

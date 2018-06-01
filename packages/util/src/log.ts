import * as path from 'path'
import { isObject, extend, template } from 'lodash'
import * as onlylog from 'onlylog'
import {Onlylog, OnlylogOptions, Level} from 'onlylog'
import chalk from 'chalk'
import { Request, Response, NextFunction } from 'express'
import * as fs from 'fs-extra'
import {getIp} from './get-ip'
import {getRid as defaultGetRid} from './rid'

export interface Options {
  logDir: string
  logLevels: Level[]
  logStdio?: any
}

let globalOptions: Options = {
  logLevels: ['info', 'debug', 'warn', 'error'],
  logStdio: true
} as any

export function setGlobalOptions(options: Options) {
  globalOptions = options
}

const getLogStdioColor = (() => {
  let counter = 0
  const styleArr = [
    'red',
    'green',
    'yellow',
    'blue',
    'magenta',
    'cyan',
    'gray',
    'grey',
    'bgBlack',
    'bgRed',
    'bgGreen',
    'bgYellow',
    'bgBlue',
    'bgMagenta',
    'bgCyan',
    'bgWhite'
  ]
  return function (str: string) {
    counter++
    return (chalk as any)[styleArr[counter % styleArr.length]](str)
  }
})()

const logs: {[key: string]: Onlylog} = {}

export function destroyLogs() {
  for (const key in logs) {
    if (key === 'process') continue
    logs[key].info("[onlylog destroyed]")
    if (logs[key].options.stream === process.stdout) continue
    logs[key].destroy()
  }
}

export function createLog(name: string, useStdout = false) {
  if (logs[name]) return logs[name]
  let options: OnlylogOptions = {
    bufferLength: 100,
    duration: 2000,
    logLevels: globalOptions.logLevels
  }
  if (useStdout || globalOptions.logStdio) {
    let prefix = getLogStdioColor(`[${name}]`)
    options.bufferLength = 0
    options.stream = process.stdout
    options.format = (options) => {
      return prefix + ' ' + onlylog.format(options)
    }
  } else {
    fs.mkdirsSync(globalOptions.logDir)
    options.filename = `[${path.join(globalOptions.logDir, name)}]-YYYY-MM-DD[.log]`
  }
  logs[name] = onlylog(options)
  logs[name].on('error', function (err: Error) {
    console.error('[OnlylogError]', err)
  })
  return logs[name]
}

const defaultLogMiddlewareOptions: LogMiddlewareOptions = {
  getRid(req) {
    return (req as any).rid || defaultGetRid()
  },
  getUserID(req) {
    return '-'
  },
  logFormat: '${ip} ${pid} ${rid} \"${userID}\" \"${method} ${url}\" ${status} ${useTime} \"${referer}\" \"${userAgent}\" \"${body}\"',
}

export interface LogMiddlewareOptions {
  getUserID: (req: Request) => string
  getRid: (req: Request) => string
  logFormat: string
}

export function logMiddleware(name: string, options?: LogMiddlewareOptions) {
  const log = createLog(name)
  options = extend({}, defaultLogMiddlewareOptions, options)
  const {getUserID, getRid, logFormat} = options
  const logCompiled = template(logFormat, {})
  const pid = process.pid
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now()
    //获取ip必须在连接关闭前, 关闭后req.socket.remoteAddress将为undefined
    const ip = getIp(req)
    function logAccess () {
      const useTime = Date.now() - start
      const method = req.method
      const url = req.originalUrl || req.url
      const referer = req.headers['referer'] || req.headers['refferer'] || '-'
      const userAgent = req.headers['User-Agent'] || '-'
      const status = res.statusCode
      let body = req.body || ''
      if (isObject(body)) body = JSON.stringify(body)
      const userID = getUserID(req) || "-"
      const rid = getRid(req) || "-"

      log.info(logCompiled({
        ip,
        pid,
        rid,
        userID,
        method,
        url,
        status,
        useTime,
        referer,
        userAgent,
        body,
        req
      }))

    }
    res.on('close', logAccess)
    res.on('finish', logAccess)
    next()
  }
}
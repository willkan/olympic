import {isString, isNumber} from 'lodash'

let logger: any = console
export function setLogger(_logger: any) {
  logger = _logger
}

let errorCounter = 0
const errorCodes: {[key: string]: number} = {
}

export type ErrorCodeWithSpecifyNumber = {0: string, 1: number}

export function defineErrorCode(...errorCodeArr: (string|ErrorCodeWithSpecifyNumber)[]) {
  errorCodeArr.forEach(errorCode => {
    if (errorCode == void 0) throw new Error('errorCode cannot be empty')
    if (isString(errorCode)) {
      if (errorCodes[errorCode as string] != void 0) {
        throw new Error(`ErrorCode ${errorCode} has been defined`)
      }
      errorCodes[errorCode as string] = errorCounter++
      return
    }
    
    if (isString(errorCode[0]) && isNumber(errorCode[1])) {
      const errorCodeKey = errorCode[0] as string
      if (errorCodes[errorCodeKey] != void 0) {
        throw new Error(`ErrorCode ${errorCodeKey} has been defined`)
      }
      const errorCodeNum = errorCode[1] as number
      let isErrorCodeNumberUsed = false
      for (const k in errorCodes) {
        if (errorCodes[k] === errorCodeNum) {
          isErrorCodeNumberUsed = true
        }
      }
      if (isErrorCodeNumberUsed) {
        throw new Error(`ErrorCodeNumber ${errorCodeNum} has been defined`)
      }
      errorCodes[errorCodeKey] = errorCodeNum
      errorCounter = errorCodeNum
      return
    }

    throw new Error('errorCode must be a string or [string, number]')
  })
}

export function useDefaultErrorCode() {
  defineErrorCode(
    ['UNCAUGHT_EXCEPTION', -1]
  )
}

export class CustomError extends Error {
  code: string
  msg: string
  codeNumber: number
  statusCode: number

  constructor(code: string, msg: string, statusCode: number = 500, stack?: string) {
    super(msg)
    this.code = code
    this.codeNumber = errorCodes[code]
    this.statusCode = statusCode
    Object.defineProperty(this, 'message', {
      enumerable: true,
      configurable: false,
      writable: false,
      value: msg
    })
    if (stack) {
      Object.defineProperty(this, 'stack', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: this.stack + "\n-------origin stack-------\n" + stack
      })
    }
    if (this.codeNumber == void 0) logger.warn('errorCode [%s] is not defined: %s', code, this.stack)
  }
}

export function makeError(code: string, msg: string, statusCode?: number, stack?: string) {
  return new CustomError(code, msg, statusCode, stack)
}

export function assert(condition: boolean, code: string, message: string, statusCode?: number, stack?: string) {
  if (condition) return
  throw makeError(code, message, statusCode, stack)
}
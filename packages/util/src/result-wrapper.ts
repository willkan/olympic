import {makeError} from './error-helper'

let isFailStackShow = false

export function showFailStack(_isFailStackShow: boolean) {
  isFailStackShow = _isFailStackShow
}

export function success(data: any) {
  return {
    isError: false,
    data: data
  }
}

export function fail(err: Error) {
  if ((err as any).statusCode == void 0) {
    const stack = err.stack
    err = makeError('UNCAUGHT_EXCEPTION', err.message, 500, stack)
  }
  const wrapper: any = {
    isError: true,
    error: err
  }
  if (isFailStackShow) {
    wrapper.stack = err.stack
  }
  return wrapper
}


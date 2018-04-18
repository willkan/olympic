import { Response } from "express"

export function getData(wrapper: any) {
  if (wrapper.isError) {
    throw wrapper.error
  }
  return wrapper.data
}

export class Res {
  send: Function
  isSendCalled: boolean = false
  data: any
  _status: number = 200
  constructor(send: Function = () => {}) {
    this.send = (data: any) => {
      send(data)
      this.data = data
      this.isSendCalled = true
    }
  }
  status(status: number) {
    this._status = status
    return this
  }
  getStatus() {
    return this._status
  }
}

export function mockRes(send: Function = () => {}) {
  return new Res(send) as any as (Response & Res)
}
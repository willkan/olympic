import { Request as ExpressRequest } from "express"
import { success, fail } from 'olympic-util/lib/result-wrapper'
import * as Joi from 'joi'
import { makeError } from "olympic-util/lib/error-helper"
import { Response } from 'express-serve-static-core'

export type Request = ExpressRequest & {
  joiResult: any
}

export interface Logger {
  error(message?: any, ...optionalParams: any[]): void;
  [key: string]: any
}

let logger: Logger = {
  ...console,
  debug: console.info.bind(console)
}

export function setLogger(_logger: Logger) {
  logger = _logger
}

export type ReqConsumer = 
  ((req: Request, res: Response) => any) 
  | ((req: Request) => any) 
  | (() => any)

export interface HttpApiOptions {
  removeResultWrapper?: boolean,
  method?: "POST" | "GET" | "DELETE" | "OPTION" | "PUT"
  joiValidate?: {
    parseReq: ReqConsumer
    joiSchema: Joi.AnySchema
  }
}

const defaultHttpApiOptions: HttpApiOptions = {
}

export function joiValidatePostBody(joiSchema: Joi.AnySchema) {
  return {
    parseReq: (req: Request) => {
      return req.body
    },
    joiSchema: joiSchema
  }
}

export function joiValidateReq(joiSchema: Joi.AnySchema) {
  return {
    parseReq: (req: Request) => {
      return req
    },
    joiSchema: joiSchema
  }
}

export class HttpApi extends Function {
  func: ReqConsumer
  options: HttpApiOptions
  constructor(func: ReqConsumer, options: HttpApiOptions) {
    super()
    this.func = func
    this.options = options
    
    const httpApiRunner = this
    const HttpApiFunction: any = function (req: Request, res: Response) {
      return httpApiRunner.run(this, req, res)
    }
    HttpApiFunction.HttpApi = this
    HttpApiFunction.run = this.run
    return HttpApiFunction
  }
  private async runJoiValidate(req: Request, res: Response) {
    const {joiValidate} = this.options
    if (!joiValidate) {
      return
    }
    let joiResult
    try {
      joiResult = await Joi.validate(joiValidate.parseReq.call(null, req, res), joiValidate.joiSchema) as any
    } catch (e) {
      throw makeError("INPUT_INVALID", e.message, 400)
    }
    (req as any).joiResult = joiResult
  }
  async run(context: any, req: Request, res: Response) {
    let data
    try {
      if (this.options.method && req.method !== this.options.method) {
        throw makeError("INPUT_INVALID", "only support http method " + this.options.method, 400)
      }
      await this.runJoiValidate(req, res)
      if (!this.options.removeResultWrapper) {
        await this.runWithResultWrapper(context, req, res)
        return
      }
      await this.runWithoutResultWrapper(context, req, res)
    } catch (err) {
      if ((err as any).statusCode == void 0) {
        logger.error('[uncaught error]', err, err.stack)
      } else if ((err as any).statusCode >= 500) {
        logger.error('[system error]', err, err.stack)
      }
      return res.status((err as any).statusCode || 500).send(fail(err))
    }
  }
  private async runWithResultWrapper(context: any, req: Request, res: Response) {
    const data = await this.func.call(context, req, res)
    return res.send(success(data))
  }
  private async runWithoutResultWrapper(context: any, req: Request, res: Response) {
    await this.func.call(context, req, res)
  }
}

export function httpApi(options: HttpApiOptions = defaultHttpApiOptions) {
  return (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<ReqConsumer>) => {
    return {
      value: toHttpApi(descriptor.value, options) as any,
      enumerable: true,
      writable: false
    }
  }
}

export function toHttpApi(func: ReqConsumer, options: HttpApiOptions = defaultHttpApiOptions) {
  return new HttpApi(func, options)
}

export function isHttpApi(func: any) {
  if (!func) return false
  return func.HttpApi instanceof HttpApi
}
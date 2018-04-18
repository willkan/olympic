import { Request, NextFunction, Response } from "express"
import { fail } from 'olympic-util/lib/result-wrapper'
import { exec } from 'child_process'
import * as path from 'path'
import { isHttpApi, HttpApi } from "./http-api"
import { getModel } from './model'
import { makeError } from "olympic-util/lib/error-helper"

const regex = /(\w+)\/(\w+)/

export function httpApiMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = req.path.slice(1)
      const matches = path.match(regex)
      if (matches == null) {
        throw makeError("INPUT_INVALID", `no api match ${req.path}`, 404)
      }
  
      const modelName = matches[1]
      const methodName = matches[2]
      let model
      try {
        model = getModel(modelName)
      } catch (e) {
        throw makeError("INPUT_INVALID", e.message, 404, e.stack)
      }
      const method = model[methodName] as HttpApi
  
      if (!isHttpApi(method)) {
        throw makeError("INPUT_INVALID", `${modelName}.${methodName} is not an api`, 404)
      }
  
      await model[methodName](req, res)
    } catch (e) {
      next(e)
    }
  }
}
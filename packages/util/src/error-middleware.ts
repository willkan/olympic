import { fail } from './result-wrapper'
import { Request, NextFunction } from 'express'
import { Response } from 'express-serve-static-core'

export function errorHandler (logger: {error: (message?: any, ...optionalParams: any[]) => void}) {
  return function (err: Error, req: Request, res: Response, next: NextFunction) {
    if ((err as any).statusCode == void 0) {
      logger.error('[uncaught error]', err, err.stack)
    } else if ((err as any).statusCode >= 500) {
      logger.error('[system error]', err, err.stack)
    }
    return res.status((err as any).statusCode || 500).send(fail(err))
  }
}
import * as fs from 'fs'

export interface Logger {
  error?(message?: any, ...optionalParams: any[]): void;
  info?(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  warn?(message?: any, ...optionalParams: any[]): void;
  log?(message?: any, ...optionalParams: any[]): void;
  [key: string]: any
}

let logger: Logger = {
  ...console,
  debug: console.info.bind(console)
}

export function setLogger(_logger: Logger) {
  logger = _logger
}

export type Model = any

export interface ModelConstructor {
  /**
    * Creates a new function.
    * @param args A list of arguments the function accepts.
    */
  new(...args: any[]): Model
}


let models: {[key: string]: Model} = {}

export function setModel(key: string, obj: Model) {
  logger.info(`load model ${key} success`)
  models[key] = obj
}

export function model(key: string) {
  return (target: ModelConstructor) => {
    setModel(key, new target())
  }
}

export function loadFiles(files: string[]) {
  files.forEach(file => {
    require(file)
  })
}

export function getModels() {
  return models
}

export function getModel(name: string) {
  const model = models[name]
  if (model == null) {
    throw new Error(`model ${name} not found`)
  }
  return model
}

export function lazyGetModel(name: string) {
  let model
  return new Proxy({}, {
    get(target: typeof models, p: PropertyKey, receiver: any) {
      if (!model) {
        model = getModel(name)
      }
      return model[p]
    }
  }) as any
}

export function removeModel(name: string) {
  delete models[name]
}

export function clearModels() {
  models = {}
}
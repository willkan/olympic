import { createLog } from './log'

export type BeforeExitFunc = (signal: string) => number | Promise<number>

let beforeExit: BeforeExitFunc = (signal) => {return 98}

const beforeExitTimeoutPromiseGen = (timeout: number = 20000) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error(`beforeExit timeout in ${timeout}`))
    }, timeout)
  })
}

export function setBeforeExit(_beforeExit: BeforeExitFunc) {
  beforeExit = _beforeExit
} 

const logger = createLog('process', true)

process.on('exit', (code) => {
  logger.info(`exit with code ${code}`)
})

process.on('uncaughtException', (err) => {
  logger.error('[uncaughtException]', err.stack)
})

process.on('unhandledRejection', (err) => {
  logger.error('[unhandledRejection]', err.stack)
})

const signals = ["SIGINT", "SIGTERM", "SIGQUIT"]
signals.forEach(signal => {
  process.on(signal as any, async () => {
    logger.info(`[Signal ${signal}] received`)
    let exitNumber
    try {
      exitNumber = await Promise.race([beforeExit(signal), beforeExitTimeoutPromiseGen()])
    } catch (e) {
      logger.error(`[Signal ${signal}] call beforeExit failed: `, e.stack)
      exitNumber = 99
    }
    logger.info(`[onlylog destroyed]`)
    process.exit(exitNumber)
  })
})
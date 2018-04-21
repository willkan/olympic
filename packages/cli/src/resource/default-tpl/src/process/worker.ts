import * as express from 'express'
import * as http from 'http'
import * as bodyParser from 'body-parser'
import { getEtc } from 'olympic-util/lib/etc'
import { createLog, logMiddleware } from 'olympic-util/lib/log'
import { fail } from 'olympic-util/lib/result-wrapper'
import { errorHandler } from 'olympic-util/lib/error-middleware'
import * as compression from 'compression'
import * as helmet from 'helmet'
import * as cookieParser from 'cookie-parser'
import { httpApiMiddleware } from 'olympic-ioc/lib/http-api-middleware'
import { loadFiles, setModel, setLogger as setModelLogger } from 'olympic-ioc/lib/model'
import { setLogger as setHttpApiLogger } from 'olympic-ioc/lib/http-api'
import { makeError } from 'olympic-util/lib/error-helper';

const etc = getEtc()
const logger = createLog('app')

const app = express()
const server = http.createServer(app)
app.disable('x-powered-by')
app.use(helmet())
app.use(compression())
app.use(cookieParser())
app.use(bodyParser.json({ limit: '100mb' }))
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }))
app.use(express.static('../../public'))
app.use(logMiddleware('access'))
app.use("/api", httpApiMiddleware())
app.use(errorHandler(createLog('error-middleware')))
app.use((req, res) => {
  res.status(404).json(fail(makeError('ROUTER_NOT_FOUND', `${req.path} not match any router`, 404)))
})

server.listen(etc.http_port, etc.bind_host || '0.0.0.0', err => {
  if(err) return logger.error('app start failed')
  logger.info('app start at %s', etc.http_port)
})
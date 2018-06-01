import * as path from 'path'
import { getEtc, setEtcDir } from 'olympic-util/lib/etc'
import { setGlobalOptions as setLoggerOptions, createLog } from 'olympic-util/lib/log'
import { showFailStack } from 'olympic-util/lib/result-wrapper'
import { loadFiles, setModel, setLogger as setModelLogger } from 'olympic-ioc/lib/model'
import { setBeforeExit } from 'olympic-util/lib/process-event-log'
import { destroyLogs } from 'olympic-util/lib/log'
import { setLogger as setHttpApiLogger } from 'olympic-ioc/lib/http-api'
import './error-code'

setEtcDir(path.join(__dirname, '..', 'etc'))
const etc = getEtc()

showFailStack(etc.error_stack)
setLoggerOptions({
  logDir: etc.log_dir,
  logLevels: etc.log_levels,
  logStdio: etc.log_stdio
})

setBeforeExit(async (signal) => {
  destroyLogs()
  return 98
})

setHttpApiLogger(createLog('http-api-middleware'))
setModelLogger(createLog('olympic-model'))

loadFiles(etc.models.map((file) => require.resolve(`./model/${file}`)))
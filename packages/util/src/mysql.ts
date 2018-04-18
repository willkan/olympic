import { promisify } from 'util'
import * as mysql from 'mysql'
import { PoolConfig, Pool, Query, Connection, queryCallback, QueryOptions, FieldInfo, QueryFunction } from 'mysql'
import * as crypto from 'crypto'
import * as _ from 'lodash'

function objectToMd5 (obj: any) {
  const keys = Object.keys(obj).sort()
  const tmp:any = {}
  keys.forEach(function (key) {
    tmp[key] = obj[key]
  })
  const str = JSON.stringify(tmp)
  const md5sum = crypto.createHash('md5')
  md5sum.update(str)
  return md5sum.digest('hex')
}

export type QueryResult = [any, FieldInfo[]]

export interface PromisifyQueryFunction {
  (query: Query): Promise<QueryResult>
  (options: string | QueryOptions): Promise<QueryResult>
  (options: string, values: any): Promise<QueryResult>
}

function promisifyQuery(query: QueryFunction): PromisifyQueryFunction {
  return (...args: any[]) => {
    return new Promise((resolve, reject) => {
      const queryCallback: queryCallback = (err, results, fields) => {
        if (err) {
          return reject(err)
        }
        return resolve([results, fields])
      }
      query.apply(null, args.concat(queryCallback))
    }) as Promise<QueryResult>
  }
}

export interface OlympicConnection {
  query: PromisifyQueryFunction
  commit?: () => Promise<any>,
  rollback?: () => Promise<any>
  connection?: Connection
}

export class CustomPool {
  config: PoolConfig
  pool: Pool
  query: PromisifyQueryFunction
  readyPromise?: Promise<any>
  log: any = console
  constructor(config: PoolConfig) {
    this.config = config
    this.pool = mysql.createPool(config)
    this.query = promisifyQuery(this.pool.query.bind(this.pool))
    this.ready()
  }
  setLog(log) {
    this.log = log
  }
  ready() {
    if (this.readyPromise) return this.readyPromise
    return this.readyPromise = this.query('select 1')
    .then((data: QueryResult) => {
      const rows = data[0]
      if (rows[0][1] !== 1) throw new Error(`select 1 return ${JSON.stringify(rows)}`)
      this.log.info(`mysql connected: ${JSON.stringify({...this.config, password: undefined})}`)
    })
    .catch((err: Error) => {
      this.log.error(`mysql connect failed: ${JSON.stringify(this.config)}`
        + `\nerror: ${err}`)
    })
  }
  beginTransaction(): Promise<OlympicConnection> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection((err, connection) => {
        if (err) return reject(err)
        connection.beginTransaction((err) => {
          if (err) return reject(err)
          resolve({
            query: promisifyQuery(connection.query.bind(connection)),
            commit: function () {
              return promisify(connection.commit.bind(connection))()
                .then((data: any) => {
                  connection.release()
                  return data
                })
            },
            rollback: function () {
              return promisify(connection.rollback.bind(connection))()
                .then((data: any) => {
                  connection.release()
                  return data
                })
                .catch((e: Error) => {
                  connection.release()
                  throw e
                })
            },
            connection
          })
        })
      })
    })
  }
}

const pools: {[key: string]: CustomPool} = {}

export function format (query: string, values: any) {
  if (!values) return query
  if (_.isArray(values)) return mysql.format(query, values)
  var sql = query.replace(/\:(\w+)/g, function(txt, key) {
    if (values.hasOwnProperty(key)) {
      return mysql.escape(values[key])
    }
    return txt
  })
  return sql
}

let cloneId = 0
export function getPool(config: PoolConfig, isClone: boolean = false) {
  if (isClone) config = {...config, _id: cloneId++} as (PoolConfig & {_id: number})
  const md5 = objectToMd5(config)
  let pool = pools[md5]
  if (pool == void 0) {
    pool = pools[md5] = new CustomPool(config)
  }
  return pool
}
 
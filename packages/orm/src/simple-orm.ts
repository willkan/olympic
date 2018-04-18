import { OlympicConnection as Connection, format, CustomPool } from "olympic-util/lib/mysql"
import { makeError, defineErrorCode, useDefaultErrorCode } from "olympic-util/lib/error-helper"
import { pick } from 'lodash'
import { FieldInfo } from 'mysql'

defineErrorCode(
  'ROW_NOT_FOUND',
  'UPDATE_NOTHING'
)

export interface Column<U,T> {
  name: string
  alias?: string
  get?: (U) => T
  set?: (T) => U
  detailOnly?: boolean
  canUpdate?: boolean
  autoCreate?: () => T
  autoUpdate?: () => T
}

const defaultColumn = {
  detailOnly: false,
  canUpdate: true,
}

export interface SimpleOrmOptions {
  columns: (string|Column<any, any>)[]
  table: string
  logger?: {
    debug: Function
    warn: Function
  }
  idColumn: string
  pool: CustomPool
  defaultListOptions?: ListOptions
  defaultAlias?: (string) => string
  useDefaultColumns?: boolean
}

const defaultSimpleOrmOptions = {
  logger: console,
  defaultListOptions: {
    where: '',
    pageSize: 0,
    pageNumber: 20,
    orderColumns: ['gmt_create'],
    orderAsc: false
  },
  defaultAlias: (name: string) => name,
  useDefaultColumns: true
}

export interface ListOptions {
  where?: string
  pageSize?: number
  pageNumber?: number
  orderColumns?: string[]
  orderAsc?: boolean
}

export const defaultColumns: (Column<any, any> | string)[] = [
  {
    name: 'gmt_create',
    autoCreate: () => Date.now()
  },
  {
    name: 'gmt_modified',
    autoCreate: () => Date.now(),
    autoUpdate: () => Date.now()
  },
  {
    name: 'is_deleted',
  }
]

export class SimpleOrm {
  options: SimpleOrmOptions
  parsedColumns: Column<any, any>[]
  canUpdateColumns: string[]
  notAutoCreateColumns: string[]
  autoCreateColumns: string[]
  autoUpdateColumns: string[]
  notDetailColumnes: Column<any, any>[]
  table: string
  idColumn: string
  columnMap: {[key: string]: Column<any ,any>} = {}

  constructor(options: SimpleOrmOptions) {
    this.options = {
      ...defaultSimpleOrmOptions,
      ...options,
      defaultListOptions: {
        ...defaultSimpleOrmOptions.defaultListOptions,
        ...options.defaultListOptions
      }
    }
    if (this.options.useDefaultColumns) {
      this.options.columns.push(...defaultColumns)
    }
    this.parsedColumns = this.options.columns.map(column => {
      if (typeof column === 'string') {
        return {
          ...defaultColumn,
          name: column,
          alias: this.options.defaultAlias(column)
        }
      }
      return {
        ...defaultColumn,
        alias: this.options.defaultAlias(column.name),
        ...column,
      }
    })
    this.parsedColumns.forEach(column => {
      this.columnMap[column.alias] = column
    })
    this.canUpdateColumns = this.parsedColumns
      .filter(column => column.canUpdate)
      .map(column => column.alias)
    this.autoUpdateColumns = this.parsedColumns
      .filter(column => column.autoUpdate)
      .map(column => column.alias)
    this.autoCreateColumns = this.parsedColumns
      .filter(column => column.autoCreate)
      .map(column => column.alias)
    this.notAutoCreateColumns = this.parsedColumns
      .filter(column => !column.autoCreate)
      .map(column => column.alias)
    this.notDetailColumnes = this.parsedColumns.filter(column => !column.detailOnly)
    this.table = format('??', [this.options.table])
    this.idColumn = format('??', [this.options.idColumn])
  }

  columnesToAlias(columns: Column<any,any>[]) {
    return columns.map(column => {
      if (column.alias && column.name !== column.alias) {
        return format(`?? as ??`, [column.name, column.alias])
      }
      return format(`??`, [column.name])
    }).join(", ")
  }

  parseWithGetter(row: any) {
    const result = {}
    for (const key in row) {
      if (!this.columnMap[key]) {
        this.options.logger.warn(`no column define with alias ${key}`)
        result[key] = row[key]
        continue
      }
      const getter = this.columnMap[key].get
      result[key] = getter ? getter(row[key]) : row[key]
    }
    return result
  }

  parseWithSetter(row: any) {
    const result = {}
    for (const key in row) {
      if (!this.columnMap[key]) {
        this.options.logger.warn(`no column define with alias ${key}`)
        result[key] = row[key]
        continue
      }
      const setter = this.columnMap[key].set
      result[key] = setter ? setter(row[key]) : row[key]
    }
    return result
  }

  executeQuery(sql: string, connection?: Connection) {
    if (!connection) connection = this.options.pool
    return connection.query(sql)
  }

  async list(listOptions?: ListOptions, connection?: Connection) {
    const {where, pageSize, pageNumber, orderColumns, orderAsc} = Object.assign({}, this.options.defaultListOptions, listOptions)
    let sql = `select ${this.columnesToAlias(this.notDetailColumnes)} from ${this.table} where `
    const whereConditions = []
    if (where) {
      whereConditions.push(where)
    }
    whereConditions.push('is_deleted = 0')
    sql += whereConditions.join(' and ')
    const limit = format(`limit ? offset ?`, [pageNumber, pageSize])
    const orderBy = `order by ` +  orderColumns.map(column => format('??', [column])).join(', ')
    sql += ` ${limit} ${orderBy} ${orderAsc ? 'asc' : 'desc'}`
    this.options.logger.debug(sql)
    const [rows] = await this.executeQuery(sql, connection)
    return rows.map(row => {
      return this.parseWithGetter(row)
    })
  }

  detailById(id: string|number, connection?: Connection) {
    return this.detail(format(`${this.idColumn} = ? and is_deleted = 0`, [id]))
  }

  async detail(where: string, connection?: Connection) {
    let sql = `select ${this.columnesToAlias(this.parsedColumns)} from ${this.table} where ${where} limit 1`
    this.options.logger.debug(sql)
    const [rows] = await this.executeQuery(sql, connection)
    if (rows.length === 0) throw makeError('ROW_NOT_FOUND', `cannot found row with ${where}`, 404)
    return this.parseWithGetter(rows[0])
  }

  async add(row: any, connection?: Connection) {
    row = pick(row, this.notAutoCreateColumns)
    this.autoCreateColumns.forEach(key => row[key] = this.columnMap[key].autoCreate())
    let sql = format(`insert into ${this.table} set ?`, [this.parseWithSetter(row)])
    this.options.logger.debug(sql)
    const [result] = await this.executeQuery(sql, connection)
    return result.insertId
  }

  async update(id: string|number, row: any, connection?: Connection) {
    row = pick(row, this.canUpdateColumns)
    this.autoUpdateColumns.forEach(key => row[key] = this.columnMap[key].autoUpdate())
    if (Object.keys(row).length === 0) throw makeError('UPDATE_NOTHING', `no columns to update`, 400)
    let sql = format(`update ${this.table} set ? where ${this.idColumn} = ? and is_delete = 0 limit 1`, [
      this.parseWithSetter(row),
      id
    ])
    this.options.logger.debug(sql)
    const [result] = await this.executeQuery(sql, connection)
    if (result.affectedRows === 0) {
      throw makeError('ROW_NOT_FOUND', `cannot found row with ${this.idColumn} = ${id}`, 404)
    }
    return true
  }
  
  async remove(id: string|number, connection?: Connection) {
    let sql = format(`update ${this.table} set is_deleted = 1 where ${this.idColumn} = ? limit 1`, [id])
    this.options.logger.debug(sql)
    const [result] = await this.executeQuery(sql, connection)
    if (result.affectedRows === 0) {
      throw makeError('ROW_NOT_FOUND', `cannot found row with ${this.idColumn} = ${id}`)
    }
    return true
  }
}
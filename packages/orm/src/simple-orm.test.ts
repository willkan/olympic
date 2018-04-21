import { SimpleOrm } from './simple-orm'
import { OlympicConnection as Connection, format, CustomPool } from "olympic-util/lib/mysql"
import { createLog } from "olympic-util/lib/log"
import { camelCase } from 'lodash'

describe('SimpleOrm', () => {
  const mockPool: CustomPool = {} as any
  const orm = new SimpleOrm({
    columns: [
      {
        name: 'id',
        canUpdate: false
      },
      'test_id',
      {
        name: 'test_content',
        alias: 'content',
      },
      {
        name: 'test_content2',
        detailOnly: true,
        canUpdate: false,
        set(content) {return JSON.stringify(content)},
        get(content) {return JSON.parse(content)}
      }
    ],
    table: 'my_table',
    logger: createLog('orm-tes'),
    idColumn: 'id',
    pool: mockPool,
    defaultAlias: camelCase
  })
  let _originDateNow = Date.now
  let _originQuery = mockPool.query
  beforeEach(() => {
    Date.now = _originDateNow
    mockPool.query = _originQuery
  })
  describe('list', () => {
    it('case1', async () => {
      mockPool.query = (sql) => {
        expect(sql).toBe("select `id`, `test_id` as `testId`, `test_content` as `content`, " +
          "`gmt_create` as `gmtCreate`, `gmt_modified` as `gmtModified`, `is_deleted` as `isDeleted`" + 
          " from `my_table` " + 
          "where `is_deleted` = 0 limit 20 offset 0 order by `gmt_create` desc")
        const mockResult = [
          {id: 1, testId: 2, content: 'ssss'}
        ]
        return Promise.resolve([mockResult] as any)
      }
      const result = await orm.list()
      expect(result).toHaveLength(1)
      result.forEach(item => {
        expect(item).toHaveProperty('id', 1)
        expect(item).toHaveProperty('testId', 2)
        expect(item).toHaveProperty('content', 'ssss')
      })
    })
    it('case2', async () => {
      mockPool.query = (sql) => {
        expect(sql).toBe("select `id`, `test_id` as `testId`, `test_content` as `content`, " + 
          "`gmt_create` as `gmtCreate`, `gmt_modified` as `gmtModified`, `is_deleted` as `isDeleted`" + 
          " from `my_table` " + 
          "where `id` = 1 and `is_deleted` = 0 limit 100 offset 100 order by `gmt_create`, `gmt_modified` asc")
        const mockResult = [
          {id: 1, testId: 2, content: 'ssss', other: 'x'}
        ]
        return Promise.resolve([mockResult] as any)
      }
      const result = await orm.list(
        {where: '`id` = 1', pageSize: 100, pageNumber: 100, orderColumns: ['gmt_create', 'gmt_modified'], orderAsc: true},
        mockPool
      )
      expect(result).toHaveLength(1)
      result.forEach(item => {
        expect(item).toHaveProperty('id', 1)
        expect(item).toHaveProperty('testId', 2)
        expect(item).toHaveProperty('content', 'ssss')
        expect(item).toHaveProperty('other', 'x')
      })
    })
  })
  describe('detailById', () => {
    it('case1', async () => {
      mockPool.query = (sql) => {
        expect(sql).toBe("select `id`, `test_id` as `testId`, `test_content` as `content`, " + 
          "`test_content2` as `testContent2`, `gmt_create` as `gmtCreate`, " + 
          "`gmt_modified` as `gmtModified`, `is_deleted` as `isDeleted` " + 
          "from `my_table` " + 
          "where `id` = 1 and `is_deleted` = 0 limit 1")
        const mockResult = [
          {id: 1, testId: 2, content: 'ssss', testContent2: '{"ss": 1}'}
        ]
        return Promise.resolve([mockResult] as any)
      }
      const result = await orm.detailById(1)
      expect(result).toHaveProperty('id', 1)
      expect(result).toHaveProperty('testId', 2)
      expect(result).toHaveProperty('content', 'ssss')
      expect((result as any).testContent2).toEqual({ss: 1})
    })
    it(`case2`, async () => {
      mockPool.query = (sql) => {
        expect(sql).toBe("select `id`, `test_id` as `testId`, `test_content` as `content`, " + 
          "`test_content2` as `testContent2`, `gmt_create` as `gmtCreate`, " + 
          "`gmt_modified` as `gmtModified`, `is_deleted` as `isDeleted` " + 
          "from `my_table` " + 
          "where `id` = 1 and `is_deleted` = 0 limit 1")
        const mockResult = []
        return Promise.resolve([mockResult] as any)
      }
      await expect(orm.detailById(1)).rejects.toThrowError('cannot found row with `id` = 1 and `is_deleted` = 0')
    })
  })
  describe('add', () => {
    it('case1', async () => {
      const mockNow = Date.now()
      Date.now = () => mockNow
      const addRow = {testId: 2, content: 'ssss', testContent2: {ss: 1}}
      mockPool.query = (sql) => {
        expect(sql).toBe("insert into `my_table` (" + 
          "`test_id`, `test_content`, `test_content2`, `gmt_create`, `gmt_modified`, `is_deleted`" +
          `) values (${format('?, ?, ?, ?, ?, ?', 
          [addRow.testId, addRow.content, JSON.stringify(addRow.testContent2), mockNow, mockNow, 0])})`)
        return Promise.resolve([{insertId: 1}] as any)
      }
      const result = await orm.add(addRow)
      expect(result).toBe(1)
    })
  })
  describe('update', () => {
    it('case1', async () => {
      const mockNow = Date.now()
      Date.now = () => mockNow
      const updateRow = {testId: 2, content: 'ssss', testContent2: 'xxxx'}
      mockPool.query = (sql) => {
        expect(sql).toBe("update `my_table` set " + 
          format("`test_id` = ?, `test_content` = ?, `gmt_modified` = ?", [updateRow.testId, updateRow.content, mockNow]) +
          " where `id` = 1 and `is_deleted` = 0 limit 1")
        return Promise.resolve([{affectedRows: 1}] as any)
      }
      const result = await orm.update(1, updateRow)
      expect(result).toBe(true)
    })
    it(`case2`, async () => {
      const mockNow = Date.now()
      Date.now = () => mockNow
      const updateRow = {testId: 2, content: 'ssss', testContent2: 'xxxx'}
      mockPool.query = (sql) => {
        expect(sql).toBe("update `my_table` set " + 
          format("`test_id` = ?, `test_content` = ?, `gmt_modified` = ?", [updateRow.testId, updateRow.content, mockNow]) +
          " where `id` = 1 and `is_deleted` = 0 limit 1")
        return Promise.resolve([{affectedRows: 0}] as any)
      }
      await expect(orm.update(1, updateRow)).rejects.toThrowError('cannot found row with `id` = 1')
    })
    it(`case3`, async () => {
      await expect(orm.update(1, {})).rejects.toThrowError('no columns to update')
    })
  })
  describe('remove', () => {
    it('case1', async () => {
      const mockNow = Date.now()
      Date.now = () => mockNow
      mockPool.query = (sql) => {
        expect(sql).toBe("update `my_table` set " + 
          "`is_deleted` = 1" +
          " where `id` = 1 and `is_deleted` = 0 limit 1")
        return Promise.resolve([{affectedRows: 1}] as any)
      }
      const result = await orm.remove(1)
      expect(result).toBe(true)
    })
    it(`case2`, async () => {
      const mockNow = Date.now()
      Date.now = () => mockNow
      mockPool.query = (sql) => {
        expect(sql).toBe("update `my_table` set " + 
          "`is_deleted` = 1" +
          " where `id` = 1 and `is_deleted` = 0 limit 1")
        return Promise.resolve([{affectedRows: 0}] as any)
      }
      await expect(orm.remove(1)).rejects.toThrowError('cannot found row with `id` = 1')
    })
  })
})
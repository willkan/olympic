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
      {
        name: 'test_id'
      },
      {
        name: 'test_content',
        alias: 'content'
      },
      {
        name: 'test_content2',
        detailOnly: true
      }
    ],
    table: 'my_table',
    logger: createLog('orm-tes'),
    idColumn: 'id',
    pool: mockPool,
    defaultAlias: camelCase
  })
  describe('list', () => {
    it('case1', async () => {
      mockPool.query = (sql) => {
        expect(sql).toBe("select `id`, `test_id` as `testId`, `test_content` as `content`, `gmt_create` as `gmtCreate`, `gmt_modified` as `gmtModified`, `is_deleted` as `isDeleted` from `my_table` where is_deleted = 0 limit 20 offset 0 order by `gmt_create` desc")
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
        expect(sql).toBe("select `id`, `test_id` as `testId`, `test_content` as `content`, `gmt_create` as `gmtCreate`, `gmt_modified` as `gmtModified`, `is_deleted` as `isDeleted` from `my_table` where id = 1 and is_deleted = 0 limit 100 offset 100 order by `gmt_create`, `gmt_modified` asc")
        const mockResult = [
          {id: 1, testId: 2, content: 'ssss'}
        ]
        return Promise.resolve([mockResult] as any)
      }
      const result = await orm.list({where: 'id = 1', pageSize: 100, pageNumber: 100, orderColumns: ['gmt_create', 'gmt_modified'], orderAsc: true})
      expect(result).toHaveLength(1)
      result.forEach(item => {
        expect(item).toHaveProperty('id', 1)
        expect(item).toHaveProperty('testId', 2)
        expect(item).toHaveProperty('content', 'ssss')
      })
    })
  })
})
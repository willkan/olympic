## Usage

require the exact path of module

### SimpleOrm
```
import { getPool } from "olympic-util/lib/mysql"
import { SimpleOrm } from "olympic-orm/lib/simple-orm"

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
  pool: getPool(poolConfig),
});

(async () => () {
  const insertId = await orm.add(item)
  await orm.update(insertId, propsToBeUpdated)
  const items = await orm.list()
  const item = await orm.detailById(1)
  await orm.remove(insertId)

})().catch(err => {
  console.error(err)
})
```

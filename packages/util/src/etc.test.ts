import * as path from 'path'
import {getEtc, clear, mock, setEtcDir} from './etc'
describe('etc', () => {
  describe('getEtc()', () => {
    it('should only load success if config.yaml not exists', () => {
      clear()
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc1'))
      expect(getEtc().a).toBe(1)
    })
    it('should only load success if config.yaml exists', () => {
      clear()
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc2'))
      expect(getEtc().a).toBe(2)
      expect(getEtc().b.d).toBe(4)
      expect(getEtc().b).not.toHaveProperty('c')
    })
  })
  describe('mock', () => {
    it('should mock property success', () => {
      clear()
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc2'))
      mock({a: 3})
      expect(getEtc().a).toBe(3)
    })
  })
})
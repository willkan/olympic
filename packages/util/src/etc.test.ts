import * as path from 'path'
import {getEtc, clear, mock, setEtcDir, setEnvEtcPath} from './etc'
describe('etc', () => {
  beforeEach(() => {
    clear()
    setEnvEtcPath(null)
  })
  describe('getEtc()', () => {
    it('should only load success if config.yaml not exists', () => {
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc1'))
      expect(getEtc().a).toBe(1)
    })
    it('should only load success if config.yaml exists', () => {
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc2'))
      expect(getEtc().a).toBe(2)
      expect(getEtc().b.d).toBe(4)
      expect(getEtc().b).not.toHaveProperty('c')
    })
    it('should only load success if envEtcPath exists', () => {
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc2'))
      setEnvEtcPath(path.join(__dirname, 'etc-test-resource', 'etc2', 'otherConfig.yaml'))
      expect(getEtc().a).toBe(3)
    })
  })
  describe('mock', () => {
    it('should mock property success', () => {
      setEtcDir(path.join(__dirname, 'etc-test-resource', 'etc2'))
      mock({a: 3})
      expect(getEtc().a).toBe(3)
    })
  })
})
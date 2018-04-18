import {setLogger, defineErrorCode, CustomError, useDefaultErrorCode, makeError, assert} from './error-helper'
describe('error-helper', () => {
  function createMockLogger() {
    return {
      warn(...args: any[]) {
        this.isWarnedCalled = true
      },
      isWarnedCalled: false
    }
  }
  describe('defineErrorCode', () => {
    it('success with key and default number', () => {
      defineErrorCode('CODE1')
      const logger = createMockLogger()
      setLogger(logger)
      makeError('CODE1', 'test code')
      expect(logger.isWarnedCalled).toBe(false)
    })
    it('success with key and specify number', () => {
      defineErrorCode(
        ['CODE2', 99],
        'CODE3'
      )
      const logger = createMockLogger()
      setLogger(logger)
      const err2 = makeError('CODE2', 'test code')
      expect(err2.codeNumber === 99)
      const err3 = makeError('CODE3', 'test code')
      expect(err3.codeNumber === 100)
      expect(logger.isWarnedCalled).toBe(false)
    })
    it('fail because of repeat key', () => {
      try {
        defineErrorCode('CODE1')
      } catch (e) {
        expect(e.message).toBe('ErrorCode CODE1 has been defined')
        return
      }
      throw new Error('should not run here')
    })
    it('fail because of repeat key 2', () => {
      try {
        defineErrorCode(['CODE1', 1000])
      } catch (e) {
        expect(e.message).toBe('ErrorCode CODE1 has been defined')
        return
      }
      throw new Error('should not run here')
    })
    it('fail because of repeat number', () => {
      try {
        defineErrorCode(['CODE4', 99])
      } catch (e) {
        expect(e.message).toBe('ErrorCodeNumber 99 has been defined')
        return
      }
      throw new Error('should not run here')
    })
    it('fail because of illegal struct', () => {
      try {
        defineErrorCode({} as any)
      } catch (e) {
        expect(e.message).toBe('errorCode must be a string or [string, number]')
        return
      }
      throw new Error('should not run here')
    })
    it('fail because of illegal struct', () => {
      try {
        defineErrorCode(null)
      } catch (e) {
        expect(e.message).toBe('errorCode cannot be empty')
        return
      }
      throw new Error('should not run here')
    })
  })
  describe('useDefaultErrorCode', () => {
    it('should set default errorCode', () => {
      useDefaultErrorCode()
      const logger = createMockLogger()
      setLogger(logger)
      makeError('UNCAUGHT_EXCEPTION', 'test code')
      expect(logger.isWarnedCalled).toBe(false)
    })
  })
  describe('makeError', () => {
    it('should add stack if supply stack', () => {
      const logger = createMockLogger()
      const originError = new Error()
      const error = makeError('CODE1', 'test code', 500, originError.stack)
      expect(error.stack).toContain(originError.stack)
      expect(error.stack).toContain("\n-------origin stack-------\n")
    })
    it('warn if ErrorCode not defined first', () => {
      const logger = createMockLogger()
      setLogger(logger)
      makeError('CODE4', 'test code')
      expect(logger.isWarnedCalled).toBe(true)
    })
  })
  describe('assert', () => {
    it('assert not throw error if condition is true', () => {
      assert(true, 'CODE1', 'it should be true')
    })
    it('assert throw error if condition is false', () => {
      try {
        assert(false, 'CODE1', 'it should be true')
      } catch (e) {
        expect(e.message).toBe('it should be true')
        expect(e.code).toBe('CODE1')
        return
      }
      throw new Error('it should not run here')
    })
  })
})
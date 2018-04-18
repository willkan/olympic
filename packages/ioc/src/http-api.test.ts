import { Request, Response } from 'express'
import { httpApi, toHttpApi, isHttpApi, joiValidatePostBody, joiValidateReq } from './http-api'
import { mockRes } from './http-api-test-util'
import * as Joi from 'joi'

describe("httpapi", () => {
  describe("runWithResultWrapper", () => {
    it("should call send auto", async () => {
      let data: any
      const res = mockRes((_data: any) => {
        data = _data
      })
      const func = (req: any) => Promise.resolve(1)
      await toHttpApi(func)(null as Request, res)
      expect(res.isSendCalled).toBe(true)
      expect(res.getStatus()).toBe(200)
      expect(data.isError).toBe(false)
      expect(data.data).toBe(1)
    })
  })
  describe("runWithoutResultWrapper", () => {
    it("should not call send auto", async () => {
      const res = mockRes()
      const func = (req: any) => Promise.resolve(1)
      await toHttpApi(func, {removeResultWrapper: true})(null as Request, res)
      expect(res.isSendCalled).toBe(false)
    })
  })
  describe("onError", () => {
    it("should return error in wrapper", async () => {
      const res = mockRes()
      const error = new Error()
      const func = (req: any) => {
        throw error
      }
      await toHttpApi(func)(null as Request, res)
      expect(res.getStatus()).toBe(500)
      expect(res.data.isError).toBe(true)
      expect(res.data.error.statusCode).toBe(500)
    })
  })
  describe("toHttpApi", () => {
    it("should return result in wrapper", async () => {
      const res = mockRes()
      const func = toHttpApi((req: any) => Promise.resolve(1))
      expect(isHttpApi(func)).toBe(true)
      await func(null as Request, res)
      expect(res.isSendCalled).toBe(true)
      expect(res.getStatus()).toBe(200)
      expect(res.data.isError).toBe(false)
      expect(res.data.data).toBe(1)
    })
  })
  describe("decorator", () => {
    it("should return result in wrapper", async () => {
      const res = mockRes()
      class Model {
        @httpApi() test(req: any) {
          return Promise.resolve(1)
        }
      }
      const model = new Model()
      expect(isHttpApi(model.test)).toBe(true)
      await (model.test as any)(null as Request, res)
      expect(res.isSendCalled).toBe(true)
      expect(res.getStatus()).toBe(200)
      expect(res.data.isError).toBe(false)
      expect(res.data.data).toBe(1)
    })
  })
  describe("joiValidate", () => {
    class Model {
      @httpApi({
        joiValidate: joiValidatePostBody(Joi.string().required())
      }) test(req: any) {
        return Promise.resolve(req.joiResult)
      }
      @httpApi({
        joiValidate: joiValidateReq(Joi.object({
          body: Joi.string().required()
        }))
      }) testReq(req: any) {
        return Promise.resolve(req.joiResult)
      }
    }
    const model = new Model()
    describe("joiValidatePostBody", () => {
      it("should validate success", async () => {
        const res = mockRes()
        expect(isHttpApi(model.test)).toBe(true)
        await (model.test as any)({body: "xxx"}, res)
        expect(res.data.isError).toBe(false)
        expect(res.data.data).toBe("xxx")
      })
      it("should validate fail", async () => {
        let data: any
        const res = mockRes((_data: any) => {
          data = _data
        })
        await (model.test as any)({body: 1}, res)
        expect(data.isError).toBe(true)
      })
    })
    describe("joiValidateReq", () => {
      it("should validate success", async () => {
        const res = mockRes()
        expect(isHttpApi(model.test)).toBe(true)
        await (model.testReq as any)({body: "xxx"}, res)
        expect(res.data.isError).toBe(false)
        expect(res.data.data).toEqual({body: "xxx"})
      })
      it("should validate fail", async () => {
        const res = mockRes()
        await (model.testReq as any)({body: 1}, res)
        expect(res.data.isError).toBe(true)
      })
    })
  })
  describe("isHttpApi", () => {
    it("true", () => {
      const func = toHttpApi((req: any) => Promise.resolve(1))
      expect(isHttpApi(func)).toBe(true)
    })
    it("false", () => {
      const func = (req: any) => Promise.resolve(1)
      expect(isHttpApi(func)).toBe(false)
    })
    it("false if func is null", () => {
      expect(isHttpApi(null)).toBe(false)
    })
  })
})
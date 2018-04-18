import { model, getModel, setModel, clearModels, loadFiles, setLogger, removeModel, getModels } from './model'

describe('model', () => {
  beforeEach(() => {
    clearModels()
  })
  setLogger({
    ...console,
    debug: console.info.bind(console)
  })
  describe("decorator", () => {
    it("should return ok", () => {
      @model("test") class Test {
      }
      expect(getModel("test")).toBeInstanceOf(Test)
    })
  })
  describe("setModel", () => {
    it("should return ok", () => {
      const testModel = {}
      setModel("test", testModel)
      expect(getModel("test")).toBe(testModel)
    })
  })
  describe("getModel fail", () => {
    it("should return ok", () => {
      try {
        getModel("test")
        fail()
      } catch (error) {
      }
    })
  })
  describe("removeModel", () => {
    it("should return ok", () => {
      @model("test") class Test {
      }
      expect(getModel("test")).toBeInstanceOf(Test)
      removeModel("test")
      expect(getModels().test).toBeUndefined()
    })
  })
  describe("loadFiles", () => {
    const file = require.resolve("./model-test-resource/model")
    it("should return ok", () => {
      loadFiles([
        file
      ])
      expect(getModel("test")).toBeInstanceOf(require(file).default)
    })
  })
})
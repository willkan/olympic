export function mockObjectWithFunction(funcNames: string[]) {
  const obj = {}
  funcNames.forEach(funcName => {
    obj[funcName] = () => {
      throw new Error("should mock")
    }
  })
  return obj
}
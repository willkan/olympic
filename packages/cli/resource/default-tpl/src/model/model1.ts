import { model } from "olympic-ioc/lib/model"
import { httpApi } from "olympic-ioc/lib/http-api"


@model("model1") class Test {
  @httpApi({
    method: 'POST'
  }) test() {
    return true
  }
}

export default Test
      
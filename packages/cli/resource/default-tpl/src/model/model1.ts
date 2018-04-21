import { model } from "olympic-ioc/lib/model"
import { httpApi } from "olympic-ioc/lib/http-api"


@model("model") class Test {
  @httpApi({
    method: 'GET'
  }) test() {
    return true
  }
}

export default Test
      
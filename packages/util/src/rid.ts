let ridCoutner = 0
const ridPrefix = process.pid + "-" + Date.now()
export function getRid() {
  return ridPrefix + "-" + ridCoutner++
}

export function ridMiddleware() {
  return (req, res, next) => {
    req.rid = getRid()
    next()
  }
}
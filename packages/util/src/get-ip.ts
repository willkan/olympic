import { Request } from 'express'

export function getIp(req: Request) {
  const ip = req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.headers['remoteip'] ||
    req.ip || 
    req.socket && req.socket.remoteAddress ||
    req.connection && req.connection.remoteAddress ||
    (req as any).localAddress
  return ip && ip.split(",")[0].trim()
}
import jwt from "jsonwebtoken"
import * as utils from "../utilities/shared.mjs"
import { auth } from "express-oauth2-jwt-bearer"
import {
  extractToken,
  extractUser,
  isTokenExpired
} from "../utilities/token.mjs"

export function authenticateUser() {
  return (req, res, next) => {
    let token = extractToken(req.headers.authorization)
    if (token) {
      if (!isTokenExpired(token, res)) {
        let decodedUser = extractUser(token)
        if (decodedUser) {
          //this block can be modified to check for specific elements (e.g roles, app, permissions...) in the decoded user before passing on.
          req.user = decodedUser
          next()
        } else {
          utils.respondWithError(res, 401, "Invalid token")
        }
      } else {
        return utils.respondWithError(res, 401, "Token is expired")
      }
    } else {
      utils.respondWithError(res, 404, "No authorization token found")
    }
  }
}

export function verifyWithAuth0() {
  return auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    tokenSigningAlg: process.env.AUTH0_SIGN_ALGO
  })
}

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
        if (decodedUser && verifyWithAuth0()) {
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

function verifyWithAuth0() {
  // This function does the same thing as the above, only difference is, all logic of token extraction, passing down, checking expiration, and others is handled by Auth0
  return auth({
    audience: process.env.AUDIENCE,
    issuerBaseURL: process.env.DOMAIN,
    tokenSigningAlg: ["RS256"]
  })
}

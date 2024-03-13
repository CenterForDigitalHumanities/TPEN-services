import jwt from "jsonwebtoken"
import * as utils from "../utilities/shared.mjs"
import { auth } from "express-oauth2-jwt-bearer"

export function jwtMiddleware() {
  const secret = process.env.JWT_SECRET

  return (req, res, next) => {
    const encryptedToken = req.headers.authorization
    if (encryptedToken) {
      try {
        decodedToken = jwt.verify(encryptedToken, secret)
        // if (decodedToken.user_id && decodedToken.role){
        //  req.user = decodedToken // return decodedToken
        // next()
        // }
        decodedToken.user_id && decodedToken.role
          ? next()
          : utils.respondWithError(res, 403, "Invalid token")
      } catch (error) {
        utils.respondWithError(res, 401, "Invalid token")
      }
    } else {
      utils.respondWithError(res, 401, "No authorization token found")
    }
  }
}

export function verifyWithAuth0() {
  return auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    tokenSigningAlg: process.env.AUTH0_SIGN_ALGO,
  })
}

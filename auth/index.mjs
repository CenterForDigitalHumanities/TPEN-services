import * as utils from "../utilities/shared.mjs"
import {auth} from "express-oauth2-jwt-bearer"
import {extractToken, extractUser, isTokenExpired} from "../utilities/token.mjs"
import { User } from "../classes/User/User.mjs"

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
/**
 * This function verifies authorization tokens using Auth0 library. to protect a route using this function in a different component:
  1. import the function in that component
  2. apply to route in the following ways
    a. to apply to all sub routes of a parent route, e.g project/history, project/:id, project/create apply the function on the base route in app.mjs in the following way; app.use("/project/*", auth0Middleware())
    b. to protect an individual route; route.get("/project", auth0Middleware(), controller) 
    c. to protect all routes in the app; app.use(auth0Middleware())
 * @returns authenticated user or 401
 */
function auth0Middleware() {
  const verifier = auth({
    audience: process.env.AUDIENCE,
    issuerBaseURL: `https://${process.env.DOMAIN}/`
  })

  // Extract user from the token and set req.user. req.user can be set to specific info from the payload, like sib, roles, etc.
  async function setUser(req, res, next) {
    const {payload} = req.auth

    const agent = payload["http://store.rerum.io/agent"]
    if (!agent) {
      const err = new Error("Invalid token, missing agent claim")
      err.status = 401
      next(err)
      return
    }

    try {
      const userObj = new User(payload._id)
      const user = await userObj.getByAgent(agent)
      req.user =
        user ??
        (await userObj.create({...payload, _id: agent.split("id/")[1], agent}))
    } catch (error) {
      next(error)
    }

    next()
  }

  return [verifier, setUser]
}
 

export default auth0Middleware

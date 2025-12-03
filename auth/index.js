import { auth } from "express-oauth2-jwt-bearer"
import User from "../classes/User/User.js"
/**
 * This function verifies authorization tokens using Auth0 library. to protect a route using this function in a different component:
  1. import the function in that component
  2. apply to route in the following ways
    a. to apply to all sub routes of a parent route, e.g project/history, project/:id, project/create apply the function on the base route in app.js in the following way; app.use("/project/*", auth0Middleware())
    b. to protect an individual route; route.get("/project", auth0Middleware(), controller) 
    c. to protect all routes in the app; app.use(auth0Middleware())
 * @returns authenticated user or 401
 */
function auth0Middleware() {
  const verifier = auth({
    audience: process.env.AUDIENCE,
    issuerBaseURL: `https://${process.env.DOMAIN}/`,
  })

  // Extract user from the token and set req.user. req.user can be set to specific info from the payload, like sub, roles, etc.
  async function setUser(req, res, next) {
    const { payload } = req.auth

    const agent = payload["http://store.rerum.io/agent"]
    if (!agent) {
      const err = new Error("Invalid token, missing agent claim")
      err.status = 401
      next(err)
      return
    }

    try {
      const uid = agent.split("id/")[1]
      const user = new User(uid)
      user.getSelf().then(async (u) => {
        if(!u || !u?.profile) {
          const email = payload.name

          // Check if a temporary user exists with this email
          let existingUser = null
          try {
            existingUser = await user.getByEmail(email)
          } catch (err) {
            // No user found - that's fine, continue
          }

          if (existingUser && existingUser.inviteCode) {
            // Found a temporary user - merge their memberships into this new user
            user.data = {
              _id: uid,
              agent,
              _sub: payload.sub,
              email: email,
              profile: { displayName: payload.nickname },
            }
            await user.mergeFromTemporaryUser(existingUser)
            await user.save()
            req.user = user
            next()
            return
          } else if (existingUser) {
            // Non-temporary user with same email - this is a conflict
            const err = new Error(`User with email ${email} already exists. Please contact TPEN3 administrators for assistance.`)
            err.status = 409
            next(err)
            return
          } else {
            // No existing user - create new
            user.data = {
              _id: uid,
              agent,
              _sub: payload.sub,
              email: email,
              profile: { displayName: payload.nickname },
            }
            await user.save()
            req.user = user
            next()
            return
          }
        }

        // If user exists but has wrong _sub (e.g., from temp user), update it
        if (u._sub !== payload.sub) {
          u._sub = payload.sub
          // Remove inviteCode if present - this user is now fully authenticated
          delete u.inviteCode
          const userObj = new User(uid)
          userObj.data = u
          await userObj.update()
        }

        // Ensure no inviteCode on authenticated user (belt and suspenders)
        delete u.inviteCode
        req.user = u
        next()
        return
      })
    } catch (error) {
      next(error)
    }
  }

  return [verifier, setUser]
}


export default auth0Middleware

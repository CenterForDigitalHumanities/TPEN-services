import { respondWithError } from "./shared.js"

export function extractToken(tokenString) {
  if (!tokenString) return null
  try {
    return tokenString.includes("Bearer ")
      ? tokenString.trim().split("Bearer ")[1].trim()
      : tokenString
  } catch (error) {
    console.log(error)
    return null
  }
}

export function isTokenExpired(token, res) {
  try {
    return (
      Date.now() >=
      JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()).exp * 1000
    )
  } catch (error) {
    respondWithError(res, 403, "invalid token")
    return true
  }
}

export function extractUser(token) {
  try {
    const payload = token.includes("Bearer")
      ? token.split(" ")[1].split(".")[1]
      : token.split(".")[1]
    return JSON.parse(Buffer.from(payload, "base64").toString())
  } catch {
    return null
  }
}

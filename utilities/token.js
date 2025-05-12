import { respondWithError } from "./shared.js"

export function extractToken(tokenString) {
  if (!tokenString) return null

  try {
    return tokenString.includes("Bearer ")
      ? tokenString.trim().split("Bearer ")[1].trim()
      : tokenString
  } catch (error) {
    console.log(error)
  }
}

export function isTokenExpired(token, res) {
  // Returns true if token is expired and false otherwise
  try {
    return (
      Date.now() >=
      JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()).exp *
        1000
    )
  } catch (error) {
    respondWithError(res, 403, "invalid token")
  }


}

export function extractUser(token) {
  let userInfo = JSON.parse(
    Buffer.from(
      token.includes("Bearer")
        ? token.split(" ")[1].split(".")[1]
        : token.split(".")[1],
      "base64"
    ).toString()
  )

  return userInfo
}

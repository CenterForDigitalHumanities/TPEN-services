const validEmail = new RegExp(
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
)

export function isValidEmail(email) {
  return validEmail.test(email)
}

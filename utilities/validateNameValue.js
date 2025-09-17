const noCode = new RegExp(
  /[<>{}()[\];'"`]|script|on\w+=|javascript:/i
)

export function isNotValidName(name) {
  return noCode.test(name)
}

export function isNotValidValue(value) {
  return noCode.test(value)
}
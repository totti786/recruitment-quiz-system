export function parseId(value) {
  const parsed = Number.parseInt(String(value), 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

export function getValidationErrorMessage(errors) {
  return errors
    .map((error) => {
      if (error.msg) {
        return error.msg
      }

      if (error.path) {
        return `${error.path} is invalid`
      }

      return 'Validation failed'
    })
    .join(', ')
}

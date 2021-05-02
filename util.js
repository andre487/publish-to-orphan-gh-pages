exports.getenv = function (name, defValue) {
  if (name in process.env) {
    return process.env[name]
  }
  return defValue
}

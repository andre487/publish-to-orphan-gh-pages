const fs = require('fs')
const tempFile = require('tempfile')

exports.getenv = function (name, defValue) {
  if (name in process.env) {
    return process.env[name]
  }
  return defValue
}

exports.prepareDeployKey = function (deployKey) {
  const keyFile = tempFile()
  fs.chmodSync(keyFile, 0o600)
  fs.writeFileSync(keyFile, deployKey)

  process.on('exit', () => {
    fs.unlinkSync(keyFile)
    console.log('Deploy key file has been removed')
  })

  return keyFile
}

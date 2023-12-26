const fs = require('fs')
const os = require('os')
const path = require('path')

exports.getenv = function (name, defValue) {
  if (name in process.env) {
    return process.env[name]
  }
  return defValue
}

exports.prepareDeployKey = function (deployPrivateKey) {
  const keyDir = fs.mkdtempSync(os.tmpdir())
  const keyFile = path.join(keyDir, 'id_rsa')

  fs.writeFileSync(keyFile, deployPrivateKey)
  fs.chmodSync(keyFile, 0o600)

  process.on('exit', () => {
    fs.rmSync(keyDir, { recursive: true })
    console.log('Deploy private key file has been removed')
  })

  return keyFile
}

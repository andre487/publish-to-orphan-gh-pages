const fs = require('fs')
const tempFile = require('tempfile')

exports.getenv = function (name, defValue) {
  if (name in process.env) {
    return process.env[name]
  }
  return defValue
}

exports.prepareDeployKey = function (deployPrivateKey, deployPublicKey) {
  const keyFileBase = tempFile()
  const privateKeyFile = keyFileBase + '_id_rsa'
  const publicKeyFile = keyFileBase + '_id_rsa.pub'

  console.log('Private key file:', privateKeyFile)
  console.log('Public key file:', publicKeyFile)

  fs.writeFileSync(privateKeyFile, deployPrivateKey)
  fs.chmodSync(privateKeyFile, 0o600)
  fs.writeFileSync(publicKeyFile, deployPublicKey)
  fs.chmodSync(publicKeyFile, 0o600)

  process.on('exit', () => {
    fs.unlinkSync(privateKeyFile)
    fs.unlinkSync(publicKeyFile)
    console.log('Deploy key files have been removed')
  })

  return {
    private: privateKeyFile,
    public: publicKeyFile
  }
}

const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')
const { promisify } = require('util')
const copyDirCb = require('copy-dir')
const tempDir = require('tempdir')
const tempFile = require('tempfile')
const thr = require('throw')
const { getenv } = require('./util')

const copyDir = promisify(copyDirCb)

const defaultImportantFiles = ['CNAME']

function exec (env, cmd, ...args) {
  console.log('+', cmd, ...args)

  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { env })
    proc.stderr.pipe(process.stderr)

    const out = []
    proc.stdout.on('data', data => {
      out.push(data)
    })

    proc.on('exit', code => {
      if (code) {
        return reject(new Error(`Command failed with status ${code}: ${cmd} ${args.join(' ')}`))
      }
      resolve(out.join(''))
    })
  })
}

function prepareEnv (keyFile) {
  return {
    ...process.env,
    GIT_SSH_COMMAND: `ssh -v -o StrictHostKeyChecking=accept-new -i ${keyFile}`
  }
}

module.exports = async function (inputs, keyFile) {
  const env = prepareEnv(keyFile)
  const { branch, srcDir, destDir, debug, authorName, authorEmail, ...rest } = inputs

  const gitSha = getenv('GITHUB_SHA', 'unknown')

  const gitHubHost = new URL(getenv('GITHUB_SERVER_URL', 'https://github.com')).host
  const repoCode = getenv('GITHUB_REPOSITORY') || thr(new Error('There is no GITHUB_REPOSITORY env var'))

  const srcDirAbs = path.resolve(srcDir)
  const destDirAbs = path.resolve(destDir)
  const backupDir = tempDir.sync()

  let importantFiles = rest.importantFiles
  if (!importantFiles || !importantFiles.length) {
    importantFiles = defaultImportantFiles
  }
  importantFiles = importantFiles.map(x => path.resolve(x))

  const importantBackups = {}

  console.log('Setup commit author')
  await exec(env, 'git', 'config', 'user.email', authorEmail)
  await exec(env, 'git', 'config', 'user.name', authorName)

  console.log('Create copy of site content')
  await copyDir(srcDirAbs, backupDir)

  console.log('Fetching GH pages branch', branch)
  await exec(env, 'git', 'fetch', 'origin', branch)

  console.log('Checking out to branch', branch)
  await exec(env, 'git', 'checkout', '-f', branch)

  console.log('Create copy of important files')
  for (const filePath of importantFiles) {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      continue
    }

    const newPath = tempFile()
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      await copyDir(filePath, newPath)
    } else {
      fs.copyFileSync(filePath, newPath)
    }

    console.log(`File ${filePath} has been copied to ${newPath}`)
    importantBackups[filePath] = newPath
  }

  if (debug) {
    console.log('Important file copies map:', JSON.stringify(importantBackups))
  }

  console.log('Removing previous release content', branch)
  await exec(env, 'git', 'rm', '-rf', '*')

  console.log('Copy new release to working dir')
  await copyDir(backupDir, destDirAbs)

  console.log('Copy important files to working dir')
  for (const [filePath, backupPath] of Object.entries(importantBackups)) {
    const stat = fs.statSync(backupPath)
    if (stat.isDirectory()) {
      await copyDir(backupPath, filePath)
    } else {
      fs.copyFileSync(backupPath, filePath)
    }
  }

  console.log('Commit new release files')
  await exec(env, 'git', 'add', '--all')

  console.log('Commit new release files')
  await exec(
    env,
    'git', 'commit',
    '--all', '--no-verify',
    '--message', `New GitHub pages version\n\nSource commit: ${gitSha}`
  )

  console.log('Add push remote')
  const remoteUrl = `git@${gitHubHost}:${repoCode}.git`
  await exec(env, 'git', 'remote', 'add', 'dest-push-remote', remoteUrl)

  console.log('Pushing new version to branch', branch)
  await exec(env, 'git', 'push', 'dest-push-remote', branch)

  console.log('Success!', '🏅')
}

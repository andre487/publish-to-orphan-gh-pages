const fs = require('fs')
const { spawn } = require('child_process')
const crypro = require('crypto')
const path = require('path')
const { promisify } = require('util')
const copyDirCb = require('copy-dir')
const thr = require('throw')
const { getenv } = require('./util')
const os = require('os')

const copyDir = promisify(copyDirCb)

const defaultImportantFiles = ['CNAME']

module.exports = async function (inputs, keyFile) {
  const ctx = prepareCtx(inputs, keyFile)

  await prepareToPublish(ctx)
  await eraseOldRelease(ctx)
  await publishNewRelease(ctx)

  console.log('Success!', '🏅')
}

function prepareCtx (inputs, keyFile) {
  const ctx = Object.assign(Object.create(null), inputs)

  ctx.env = prepareEnv(keyFile, inputs.debug)
  ctx.gitSha = getenv('GITHUB_SHA', 'unknown')

  ctx.gitHubHost = new URL(getenv('GITHUB_SERVER_URL', 'https://github.com')).host
  ctx.repoCode = getenv('GITHUB_REPOSITORY') || thr(new Error('There is no GITHUB_REPOSITORY env var'))

  ctx.srcDirAbs = path.resolve(ctx.srcDir)
  ctx.destDirAbs = path.resolve(ctx.destDir)
  ctx.backupDir = fs.mkdtempSync(os.tmpdir())

  /** @type string[] | undefined */
  let importantFiles = ctx.importantFiles
  if (!importantFiles || !importantFiles.length) {
    importantFiles = defaultImportantFiles
  }
  ctx.importantFiles = importantFiles.map(x => path.resolve(x))

  const executor = new Executor(process.cwd(), ctx.env, ctx.debug)
  ctx.exec = executor.exec.bind(executor)

  return ctx
}

function prepareEnv (keyFile, debug) {
  const vArg = debug ? '-v' : ''
  return {
    ...process.env,
    GIT_SSH_COMMAND: `ssh ${vArg} -o StrictHostKeyChecking=accept-new -i ${keyFile}`
  }
}

async function prepareToPublish (ctx) {
  console.log('Setup commit author')
  await ctx.exec('git', 'config', 'user.email', ctx.authorEmail)
  await ctx.exec('git', 'config', 'user.name', ctx.authorName)

  console.log('Create copy of site content')
  // noinspection JSCheckFunctionSignatures
  await copyDir(ctx.srcDirAbs, ctx.backupDir)

  console.log('Fetching GH pages branch', ctx.branch)
  await ctx.exec('git', 'fetch', 'origin', ctx.branch)

  console.log('Checking out to branch', ctx.branch)
  await ctx.exec('git', 'checkout', '--force', ctx.branch)

  ctx.importantBackups = await backupTree(ctx.importantFiles, ctx.debug)
}

async function eraseOldRelease (ctx) {
  const gitFiles = await ctx.exec('git', 'ls-files')

  if (gitFiles.trim()) {
    console.log('Removing previous release content on branch', ctx.branch)
    await ctx.exec('git', 'rm', '-rf', '*')
    await ctx.exec('git', 'clean', '-fdx')
  } else {
    console.log('Work copy is clean on branch', ctx.branch)
  }
}

async function publishNewRelease (ctx) {
  console.log('Copy new release to working dir')
  // noinspection JSCheckFunctionSignatures
  await copyDir(ctx.backupDir, ctx.destDirAbs)

  console.log('Copy important files to working dir')
  for (const [filePath, backupPath] of Object.entries(ctx.importantBackups)) {
    await copyFsItem(backupPath, filePath)
  }

  console.log('Commit new release files')
  await ctx.exec('git', 'add', '--all')

  console.log('Commit new release files')
  const msg = `New GitHub pages version\n\nSource commit: ${ctx.gitSha}`
  await ctx.exec('git', 'commit', '--all', '--allow-empty', '--message', msg)

  console.log('Add push remote')
  const remoteUrl = `git@${ctx.gitHubHost}:${ctx.repoCode}.git`
  await ctx.exec('git', 'remote', 'add', 'dest-push-remote', remoteUrl)

  console.log('Pushing new version to branch', ctx.branch)
  await ctx.exec('git', 'push', 'dest-push-remote', ctx.branch)
}

async function backupTree (importantFiles, debug) {
  console.log('Create copy of important files')

  const importantBackups = {}
  const tmpDir = fs.mkdtempSync(os.tmpdir())
  for (const filePath of importantFiles) {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      continue
    }

    const newPath = path.join(tmpDir, crypro.randomUUID() + path.extname(filePath))
    await copyFsItem(filePath, newPath)
    importantBackups[filePath] = newPath
  }

  if (debug) {
    console.log('Important file copies map:', JSON.stringify(importantBackups))
  }

  return importantBackups
}

async function copyFsItem (fromPath, toPath) {
  const stat = fs.statSync(fromPath)
  if (stat.isDirectory()) {
    // noinspection JSCheckFunctionSignatures
    await copyDir(fromPath, toPath)
  } else {
    fs.copyFileSync(fromPath, toPath)
  }
  console.log(`File ${fromPath} has been copied to ${toPath}`)
}

class Executor {
  constructor (cwd, env, debug) {
    this.cwd = cwd
    this.env = env
    this.debug = debug
  }

  exec (cmd, ...args) {
    return new Promise((resolve, reject) => {
      console.log('+', cmd, ...args)
      const proc = spawn(cmd, args, {
        cwd: this.cwd,
        env: this.env
      })
      proc.stderr.pipe(process.stderr)

      const out = []
      proc.stdout.on('data', data => {
        out.push(data)
      })

      proc.on('exit', code => {
        if (code) {
          return reject(new Error(`Command failed with status ${code}: ${cmd} ${args.join(' ')}`))
        }

        const cmdResult = out.join('')
        if (this.debug) {
          let cmdLogLine = cmdResult.trim()
          if (cmdLogLine) {
            if (cmdLogLine > 1024) {
              cmdLogLine = cmdLogLine.substring(0, 1024) + '…'
            }
            console.log('Command result:\n', cmdLogLine)
          }
        }

        resolve(cmdResult)
      })
    })
  }
}

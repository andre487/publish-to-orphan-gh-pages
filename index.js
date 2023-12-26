const core = require('@actions/core')
const thr = require('throw')
const action = require('./action')
const { getenv, prepareDeployKey } = require('./util')

main().catch(e => {
  console.error(e)
  core.setFailed(e.message)
  process.exit(1)
})

async function main () {
  if (process.env.RUNNER_TEMP) {
    process.env.TMPDIR = process.env.RUNNER_TEMP
  }

  const inputs = getInputs()
  if (inputs.debug) {
    console.log('Process argv:', JSON.stringify(process.argv))
    console.log('Inputs:', JSON.stringify(inputs))
  }
  const keyFile = prepareDeployKey(inputs.deployPrivateKey)
  await action(inputs, keyFile)
}

function getInputs () {
  const githubActor = getenv('GITHUB_ACTOR') || thr(new Error('No GITHUB_ACTOR env var'))
  const debugVal = core.getInput('debug')

  // noinspection SpellCheckingInspection
  const inputs = {
    srcDir: core.getInput('src_dir') || './build',
    destDir: core.getInput('dest_dir') || '.',
    branch: core.getInput('branch') || 'gh-pages',
    deployPrivateKey: core.getInput('deploy_private_key') || thr(new Error('No "deploy_private_key" input')),
    authorName: core.getInput('author_name') || githubActor,
    authorEmail: core.getInput('author_email') || `${githubActor}@users.noreply.github.com`,
    importantFiles: JSON.parse(core.getInput('important_files') || '[]'),
    debug: Boolean(debugVal) && debugVal !== 'false'
  }

  const { authorEmail } = inputs
  if (!/^.+@.+$/.test(authorEmail)) {
    throw new Error(`Email "${authorEmail}" has an incorrect format`)
  }

  return inputs
}

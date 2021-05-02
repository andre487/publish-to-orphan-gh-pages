const core = require('@actions/core')
const thr = require('throw')
const action = require('./action')
const { getenv, prepareDeployKey } = require('./util')

const githubActor = getenv('GITHUB_ACTOR')

main().catch(e => {
  console.error(e)
  core.setFailed(e.message)
  process.exit(1)
})

async function main () {
  const inputs = getInputs()

  if (inputs.debug) {
    console.log('Inputs:', JSON.stringify(inputs))
    console.log('Process argv:', JSON.stringify(process.argv))
    console.log('Process env:', JSON.stringify(process.env))
  }

  const keyFile = prepareDeployKey(inputs.deployKey)
  await action(inputs, keyFile)
}

function getInputs () {
  const debugVal = core.getInput('debug')
  const inputs = {
    srcDir: core.getInput('src_dir') || './build',
    destDir: core.getInput('dest_dir') || '.',
    branch: core.getInput('branch') || 'gh-pages',
    deployKey: core.getInput('deploy_key').trim() || thr(new Error('You should pass "deploy_key" input')),
    authorName: core.getInput('author_name') || githubActor,
    authorEmail: core.getInput('author_email') || `${githubActor}@users.noreply.github.com`,
    importantFiles: JSON.parse(core.getInput('important_files') || '[]'),
    debug: Boolean(debugVal) && debugVal !== 'false'
  }

  // TODO: remove and regenerate keys
  console.log(inputs.deployKey)

  const { authorEmail } = inputs
  if (!/^.+@.+$/.test(authorEmail)) {
    throw new Error(`Email ${authorEmail} has an incorrect format`)
  }

  return inputs
}

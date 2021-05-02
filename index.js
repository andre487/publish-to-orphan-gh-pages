const core = require('@actions/core')
const github = require('@actions/github')
const thr = require('throw')
const { getenv } = require('./util')

const githubActor = getenv('GITHUB_ACTOR')

main()

function main () {
  try {
    const inputs = getInputs()
    console.log('Inputs:', inputs)
    console.log('Ctx payload:', github.context.payload)
  } catch (error) {
    core.setFailed(error.message)
  }
}

function getInputs () {
  const inputs = {
    srcDir: core.getInput('src_dir') || './build',
    destDir: core.getInput('dest_dir') || '.',
    branch: core.getInput('branch') || 'gh-pages',
    deployKey: core.getInput('deploy_key') || thr(new Error('You should pass "deploy_key" input')),
    authorName: core.getInput('author_name') || githubActor,
    authorEmail: core.getInput('author_email') || `${githubActor}@users.noreply.github.com`
  }

  const { authorEmail } = inputs
  if (/^.+@.+$/.test(authorEmail)) {
    throw new Error(`Email ${authorEmail} has an incorrect format`)
  }

  return inputs
}

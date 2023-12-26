const { assert } = require('chai')
const {
  before,
  describe,
  it
} = require('mocha')
const fs = require('fs')
const thr = require('throw')
const path = require('path')

const userName = process.env.USER

describe('Action test', () => {
  const ctx = {}

  function getRequiredEnv (name) {
    return process.env[name] || thr(`There is no env var ${name}`)
  }

  function readDestFile (fileName) {
    const filePath = fileName.startsWith('/')
      ? fileName
      : path.join(ctx.inputDestDir, fileName)
    return fs.readFileSync(filePath).toString()
  }

  before(() => {
    ctx.projectDir = getRequiredEnv('PROJECT_DIR')

    ctx.mockGitLogFile = getRequiredEnv('MOCK_GIT_LOG_FILE')
    ctx.githubServerUrl = getRequiredEnv('GITHUB_SERVER_URL')
    ctx.githubActor = getRequiredEnv('GITHUB_ACTOR')
    ctx.githubRepository = getRequiredEnv('GITHUB_REPOSITORY')

    ctx.inputBranch = getRequiredEnv('INPUT_BRANCH')
    ctx.inputDeployPrivateKey = getRequiredEnv('INPUT_DEPLOY_PRIVATE_KEY')
    ctx.inputSrcDir = getRequiredEnv('INPUT_SRC_DIR')
    ctx.inputDestDir = getRequiredEnv('INPUT_DEST_DIR')
    ctx.inputImportantFiles = getRequiredEnv('INPUT_IMPORTANT_FILES')

    ctx.inputImportantFilesParsed = JSON.parse(ctx.inputImportantFiles)
    ctx.actualSrcFiles = fs.readdirSync(ctx.inputSrcDir)
    ctx.actualDestFiles = fs.readdirSync(ctx.inputDestDir)

    ctx.githubHost = new URL(ctx.githubServerUrl).host
    ctx.imortantFilesDir = path.join('test', 'important_files')
    /** @type {Record<string, string | undefined>} */
    ctx.importantFilesContent = {}
    for (const fileName of fs.readdirSync(ctx.imortantFilesDir)) {
      ctx.importantFilesContent[fileName] = fs.readFileSync(path.join(ctx.imortantFilesDir, fileName))
        .toString()
    }
  })

  it('should have consistent important files', () => {
    const repoImportantFiles = fs.readdirSync(ctx.imortantFilesDir)

    assert.deepEqual(repoImportantFiles, ctx.inputImportantFilesParsed)
  })

  describe('Copy files', () => {
    it('should copy build files', () => {
      assert.includeMembers(ctx.actualDestFiles, ctx.actualSrcFiles)
    })

    it('should copy important files', () => {
      assert.includeMembers(ctx.actualDestFiles, ctx.inputImportantFilesParsed)
    })

    it('should copy correct CNAME file', () => {
      const actualCname = readDestFile('CNAME')

      assert.equal(actualCname, ctx.importantFilesContent.CNAME)
    })

    it('should copy correct robots.txt file', () => {
      const actualRobots = readDestFile('robots.txt')

      assert.equal(actualRobots, ctx.importantFilesContent['robots.txt'])
    })
  })

  describe('Git commands', () => {
    let logContent
    let logRecords

    before(() => {
      logContent = readDestFile(ctx.mockGitLogFile)
      logRecords = logContent.split('\n')
        .filter(x => x.startsWith('['))
        .map(x => {
          const matches = /^\[(.+?)]:\s*\[(.+?)]:\s*(.+)$/.exec(x)
          if (!matches) {
            return {}
          }

          return {
            dt: matches[1],
            pwd: matches[2],
            args: matches[3].trim().split(/\s+/)
          }
        })
    })

    it('should be ran in project directory', () => {
      assert.ok(
        logRecords.every(x => x.pwd === ctx.projectDir),
        `Not all the commands were executed in project dir: ${logContent}`
      )
    })

    it('should configure a user', () => {
      assert.include(logContent, `config user.name ${userName}`)
      assert.include(logContent, `config user.email ${userName}@users.noreply.github.com`)
    })

    it('should fetch original branch', () => {
      assert.include(logContent, `fetch origin ${ctx.inputBranch}`)
    })

    it('should fetch and checkout to original branch', () => {
      assert.include(logContent, `fetch origin ${ctx.inputBranch}`)
      assert.include(logContent, `checkout --force ${ctx.inputBranch}`)
    })

    it('should remove old content', () => {
      assert.include(logContent, 'rm -rf *')
      assert.include(logContent, 'clean -fdx')
    })

    it('should add all new files', () => {
      assert.include(logContent, 'add --all')
    })

    it('should commit all new files', () => {
      assert.include(logContent, 'commit --all --allow-empty --message')
    })

    it('should push to special remote', () => {
      assert.include(logContent, `remote add dest-push-remote git@${ctx.githubHost}:${ctx.githubRepository}.git`)
      assert.include(logContent, `push dest-push-remote ${ctx.inputBranch}`)
    })
  })
})

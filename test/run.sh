#!/usr/bin/env bash
set -eufo pipefail
cd "$(dirname "$0")/.."

#
# PARAMS
#
export PROJECT_DIR="$PWD"
if [[ -n "${RUNNER_TEMP:-}" ]]; then
  export TMPDIR="$RUNNER_TEMP"
fi

get_engine_version() {
  grep -Eo "\"$1\"\s*:\s*\".+\"" package.json | grep -Eo '[0-9]+' | head -n1
}

node_version="$(get_engine_version node)"
npm_version="$(get_engine_version npm)"

if [[ "${FORCE_USE_SYSTEM_NODE:-}" == 1 ]]; then
  echo -n "Force using system Node " >/dev/stderr
  node --version &>/dev/stderr
else
  if which nvm >/dev/null; then
    nvm install "$node_version" &>/dev/null
    nvm use "$node_version"
  elif which fnm >/dev/null; then
    fnm install "$node_version" &>/dev/null
    fnm use "$node_version"
  else
    echo -n "Using system Node " >/dev/stderr
    node --version &>/dev/stderr
  fi
fi

if [[ -z "${NO_INSTALL_NPM:-}" ]]; then
  npm install -g "npm@^$npm_version"
fi

dest_dir="$(mktemp -d)"
set +f
cp ./test/important_files/* "$dest_dir"
set -f

export PATH="$PWD/test/bin-mock:$PATH"
export MOCK_GIT_LOG_FILE="$dest_dir/git-commands.log"

export GITHUB_SERVER_URL='https://github.example.com'
export GITHUB_ACTOR="$USER"
export GITHUB_REPOSITORY="foo/bar"

export INPUT_BRANCH='gh-pages-custom'
export INPUT_DEPLOY_PRIVATE_KEY='FOO'
export INPUT_SRC_DIR="$PWD/test/mock-build"
export INPUT_DEST_DIR="$dest_dir"
export INPUT_IMPORTANT_FILES='["CNAME","robots.txt"]'

#
# BUILD
#
npm run build

#
# RUN
#
node dist/index.js

#
# CHECK
#
npx mocha test/check.js

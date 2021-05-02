# Publish to orphan GitHub pages branch

GitHub action for publish generated static content to orphan gh-pages branch

## Usage

Inputs:

  * `src_dir` – The relative to the repository root path directory path with generated site content. **Required**
  * `dest_dir` – The directory to put content in GitHub pages branch. **Default:** `.`
  * `branch` – The GitHub pages branch. **Default:** `gh-pages`
  * `deploy_key` – Secret with deploy SSH private key for the repository. **Required**
  * `author_name` – Name of commit author. **Default:** `$GITHUB_ACTOR`
  * `author_email` – Email of commit author. **Default:** `$GITHUB_ACTOR@users.noreply.github.com`
  * `important_files` – Files outside the build that should be in the result. JSON array string. **Default:** `["CNAME"]`
  * `debug` – Log debug messages. **Default:** `false`

```yaml
name: Publish static site to GitHub Pages
on:
  push:
    branches:
      - main
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Check out
        uses: actions/checkout@v1
      - name: Build site (replace this step to your own build logic)
        run: npm run build -- --dest-dir ./build
      - name: Publish content to GitHub Pages
        uses: andre487/publish-to-orphan-gh-pages@v1.0.0
        with:
          src_dir: ./build
          dest_dir: .
          branch: gh-pages
          deploy_key: ${{ secrets.REPO_DEPLOY_KEY }}
          important_files: '["CNAME", "custom-file.html"]'
          debug: false
```

## Deploy key

It's an SSH key that authorize committer to make a commit to this current repository. This type of authorization is
chosen because it grants access only for one repository and only for push, not other actions than can be performed by
API

Generate SSH key pair:

```shell
  $ cd secret-dir
  $ ssh-keygen -f repo_deploy_id_rsa
```

Do not set passphrase for this key type. After this step there will be two files in the `secret-dir`:

  * `repo_deploy_id_rsa` – private key
  * `repo_deploy_id_rsa.pub` – public key

Then add public key file's content to repository deploy keys
by [manual](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys). Grant write access for
this key

Add private key file's content to repository secrets
by [manual](https://docs.github.com/en/actions/reference/encrypted-secrets)


## Development

Prepare for development:

```shell
  $ npm install
  $ npm run prepare
```

Before commit:

```shell
  $ npm run fix
```

**Important.** This action runs not from sources but from `dist/index.js` so need to build before merge:

```shell
  $ npm run build
  $ git commit dist
```

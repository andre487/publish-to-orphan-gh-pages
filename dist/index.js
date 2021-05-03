/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 582:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(747)
const { spawn } = __nccwpck_require__(129)
const path = __nccwpck_require__(622)
const { promisify } = __nccwpck_require__(669)
const copyDirCb = __nccwpck_require__(908)
const tempDir = __nccwpck_require__(225)
const tempFile = __nccwpck_require__(580)
const thr = __nccwpck_require__(673)
const { getenv } = __nccwpck_require__(962)

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
  const ctx = Object.assign({}, inputs)

  ctx.env = prepareEnv(keyFile, inputs.debug)
  ctx.gitSha = getenv('GITHUB_SHA', 'unknown')

  ctx.gitHubHost = new URL(getenv('GITHUB_SERVER_URL', 'https://github.com')).host
  ctx.repoCode = getenv('GITHUB_REPOSITORY') || thr(new Error('There is no GITHUB_REPOSITORY env var'))

  ctx.srcDirAbs = path.resolve(ctx.srcDir)
  ctx.destDirAbs = path.resolve(ctx.destDir)
  ctx.backupDir = tempDir.sync()

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
  console.log('Removing previous release content', ctx.branch)
  await ctx.exec('git', 'rm', '-rf', '*')
  await ctx.exec('git', 'clean', '-fdx')
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
  await ctx.exec('git', 'commit', '--all', '--message', msg)

  console.log('Add push remote')
  const remoteUrl = `git@${ctx.gitHubHost}:${ctx.repoCode}.git`
  await ctx.exec('git', 'remote', 'add', 'dest-push-remote', remoteUrl)

  console.log('Pushing new version to branch', ctx.branch)
  await ctx.exec('git', 'push', 'dest-push-remote', ctx.branch)
}

async function backupTree (importantFiles, debug) {
  console.log('Create copy of important files')

  const importantBackups = {}
  for (const filePath of importantFiles) {
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`)
      continue
    }

    const newPath = tempFile()
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
    console.log('+', cmd, ...args)
    return new Promise((resolve, reject) => {
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


/***/ }),

/***/ 351:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 186:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const command_1 = __nccwpck_require__(351);
const file_command_1 = __nccwpck_require__(717);
const utils_1 = __nccwpck_require__(278);
const os = __importStar(__nccwpck_require__(87));
const path = __importStar(__nccwpck_require__(622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    process.stdout.write(os.EOL);
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 */
function error(message) {
    command_1.issue('error', message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 */
function warning(message) {
    command_1.issue('warning', message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __nccwpck_require__) {

"use strict";

// For internal use, subject to change.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__nccwpck_require__(747));
const os = __importStar(__nccwpck_require__(87));
const utils_1 = __nccwpck_require__(278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 908:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var copydir = __nccwpck_require__(809);
var copydirSync = __nccwpck_require__(501);

copydir.sync = copydirSync;

module.exports = copydir;


/***/ }),

/***/ 809:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var fs = __nccwpck_require__(747);
var path = __nccwpck_require__(622);
/*
  options: {
    utimes: false,  // Boolean | Object, keep utimes if true
    mode: false,    // Boolean | Number, keep file mode if true
    cover: true,    // Boolean, cover if file exists
    filter: true,   // Boolean | Function, file filter
  }
*/
function copydir(from, to, options, callback) {
  if (typeof options === 'function') {
    if(!callback) {
      callback = options;
      options = {
        filter: function() { return true; }
      };
    } else {
      options = {
        filter: options
      };
    }
  }
  if(typeof callback !== 'function') {
    callback = function() {};
  }
  if(typeof options.cover === 'undefined') {
    options.cover = true;
  }
  options.filter = typeof options.filter === 'function' ? options.filter : function(state, filepath, filename) {
    return options.filter;
  };
  fs.lstat(from, function(err, stats) {
    if (err) {
      callback(err);
    } else {
      var statsname = stats.isDirectory() ? 'directory' :
        stats.isFile() ? 'file' :
        stats.isSymbolicLink() ? 'symbolicLink' :
        '';
      var valid = options.filter(statsname, from, path.basename(from));
      if (statsname === 'directory' || statsname === 'symbolicLink') {
        // Directory or SymbolicLink
        if(valid) {
          fs.stat(to, function(err) {
            if(err) {
              if(err.code === 'ENOENT') {
                fs.mkdir(to, function(err) {
                  if(err) {
                    callback(err);
                  } else {
                    options.debug && console.log('>> ' + to);
                    rewrite(to, options, stats, function(err) {
                      if(err) {
                        callback(err);
                      } else {
                        listDirectory(from, to, options, callback);
                      }
                    });
                  }
                });
              } else {
                callback(err);
              }
            } else {
              rewrite(to, options, stats, function(err) {
                if(err) {
                  callback(err);
                } else {
                  listDirectory(from, to, options, callback);
                }
              });
            }
          });
        } else {
          callback();
        }
      } else if(stats.isFile()) {
        // File
        if(valid) {
          if(options.cover) {
            writeFile(from, to, options, stats, callback);
          } else {
            fs.stat(to, function(err) {
              if(err) {
                if(err.code === 'ENOENT') {
                  writeFile(from, to, options, stats, callback);
                } else {
                  callback(err);
                }
              } else {
                callback();
              }
            });
          }
        } else {
          callback();
        }
      } else {
        callback(new Error('stats invalid: '+ from));
      }
    }
  });
}

function listDirectory(from, to, options, callback) {
  fs.readdir(from, function(err, files) {
    if(err) {
      callback(err);
    } else {
      copyFromArray(files, from, to, options, callback);
    }
  });
}

function copyFromArray(files, from, to, options, callback) {
  if(files.length === 0) {
    callback(null);
  } else {
    var f = files.shift();
    copydir(path.join(from, f), path.join(to, f), options, function(err) {
      if(err) {
        callback(err);
      } else {
        copyFromArray(files, from, to, options, callback);
      }
    });
  }
}

function chmod(f, mode, callback) {
  if(mode) {
    fs.chmod(f, mode, callback);
  } else {
    callback();
  }
}

function utimes(f, mode, callback) {
  if(mode) {
    fs.utimes(f, mode.atime, mode.mtime, callback);
  } else {
    callback();
  }
}

function writeFile(from, to, options, stats, callback) {
  fs.readFile(from, 'binary', function(err, data) {
    if(err) {
      callback(err);
    } else {
      fs.writeFile(to, data, 'binary', function(err) {
        if(err) {
          callback(err);
        } else {
          options.debug && console.log('>> ' + to);
          rewrite(to, options, stats, callback);
        }
      });
    }
  });
}

function rewrite(f, options, stats, callback) {
  if(options.cover) {
    chmod(f, options.mode === true ? stats.mode : options.mode, function(err) {
      if(err) {
        callback(err);
      } else {
        utimes(f, options.utimes === true ? {
          atime: stats.atime,
          mtime: stats.mtime
        } : options.utimes, callback);
      }
    });
  } else {
    callback();
  }
}

module.exports = copydir;

/***/ }),

/***/ 501:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var fs = __nccwpck_require__(747);
var path = __nccwpck_require__(622);
/*
  options: {
    utimes: false,  // Boolean | Object, keep utimes if true
    mode: false,    // Boolean | Number, keep file mode if true
    cover: true,    // Boolean, cover if file exists
    filter: true,   // Boolean | Function, file filter
  }
*/
function copydirSync(from, to, options) {
  if (typeof options === 'function') {
    options = {
      filter: options
    };
  }
  if(typeof options === 'undefined') options = {};
  if(typeof options.cover === 'undefined') {
    options.cover = true;
  }
  options.filter = typeof options.filter === 'function' ? options.filter : function(state, filepath, filename) {
    return options.filter;
  };
  var stats = fs.lstatSync(from);
  var statsname = stats.isDirectory() ? 'directory' :
    stats.isFile() ? 'file' :
    stats.isSymbolicLink() ? 'symbolicLink' :
    '';
  var valid = options.filter(statsname, from, path.basename(from));
  if (statsname === 'directory' || statsname === 'symbolicLink') {
    // Directory or SymbolicLink
    if(valid) {
      try {
        fs.statSync(to);
      } catch(err) {
        if(err.code === 'ENOENT') {
          fs.mkdirSync(to);
          options.debug && console.log('>> ' + to);
        } else {
          throw err;
        }
      }
      rewriteSync(to, options, stats);
      listDirectorySync(from, to, options);
    }
  } else if(stats.isFile()) {
    // File
    if(valid) {
      if(options.cover) {
        writeFileSync(from, to, options, stats);
      } else {
        try {
          fs.statSync(to);
        } catch(err) {
          if(err.code === 'ENOENT') {
            writeFileSync(from, to, options, stats);
          } else {
            throw err;
          }
        }
      }
    }
  } else {
    throw new Error('stats invalid: '+ from);
  }
};

function listDirectorySync(from, to, options) {
  var files = fs.readdirSync(from);
  copyFromArraySync(files, from, to, options);
}

function copyFromArraySync(files, from, to, options) {
  if(files.length === 0) return true;
  var f = files.shift();
  copydirSync(path.join(from, f), path.join(to, f), options);
  copyFromArraySync(files, from, to, options);
}

function writeFileSync(from, to, options, stats) {
  fs.writeFileSync(to, fs.readFileSync(from, 'binary'), 'binary');
  options.debug && console.log('>> ' + to);
  rewriteSync(to, options, stats);
}

function rewriteSync(f, options, stats, callback) {
  if(options.cover) {
    var mode = options.mode === true ? stats.mode : options.mode;
    var utimes = options.utimes === true ? {
      atime: stats.atime,
      mtime: stats.mtime
    } : options.utimes;
    mode && fs.chmodSync(f, mode);
    utimes && fs.utimesSync(f, utimes.atime, utimes.mtime);
  }
  return true;
}

module.exports = copydirSync;


/***/ }),

/***/ 284:
/***/ ((module) => {

"use strict";

var isWindows = process.platform === 'win32';
var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;

// https://github.com/nodejs/node/blob/3e7a14381497a3b73dda68d05b5130563cdab420/lib/os.js#L25-L43
module.exports = function () {
	var path;

	if (isWindows) {
		path = process.env.TEMP ||
			process.env.TMP ||
			(process.env.SystemRoot || process.env.windir) + '\\temp';
	} else {
		path = process.env.TMPDIR ||
			process.env.TMP ||
			process.env.TEMP ||
			'/tmp';
	}

	if (trailingSlashRe.test(path)) {
		path = path.slice(0, -1);
	}

	return path;
};


/***/ }),

/***/ 810:
/***/ ((module) => {

"use strict";


var processFn = function (fn, P, opts) {
	return function () {
		var that = this;
		var args = new Array(arguments.length);

		for (var i = 0; i < arguments.length; i++) {
			args[i] = arguments[i];
		}

		return new P(function (resolve, reject) {
			args.push(function (err, result) {
				if (err) {
					reject(err);
				} else if (opts.multiArgs) {
					var results = new Array(arguments.length - 1);

					for (var i = 1; i < arguments.length; i++) {
						results[i - 1] = arguments[i];
					}

					resolve(results);
				} else {
					resolve(result);
				}
			});

			fn.apply(that, args);
		});
	};
};

var pify = module.exports = function (obj, P, opts) {
	if (typeof P !== 'function') {
		opts = P;
		P = Promise;
	}

	opts = opts || {};
	opts.exclude = opts.exclude || [/.+Sync$/];

	var filter = function (key) {
		var match = function (pattern) {
			return typeof pattern === 'string' ? key === pattern : pattern.test(key);
		};

		return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
	};

	var ret = typeof obj === 'function' ? function () {
		if (opts.excludeMain) {
			return obj.apply(this, arguments);
		}

		return processFn(obj, P, opts).apply(this, arguments);
	} : {};

	return Object.keys(obj).reduce(function (ret, key) {
		var x = obj[key];

		ret[key] = typeof x === 'function' && filter(key) ? processFn(x, P, opts) : x;

		return ret;
	}, ret);
};

pify.all = pify;


/***/ }),

/***/ 770:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const fs = __nccwpck_require__(747);
const os = __nccwpck_require__(87);

const tempDirectorySymbol = Symbol.for('__RESOLVED_TEMP_DIRECTORY__');

if (!global[tempDirectorySymbol]) {
	Object.defineProperty(global, tempDirectorySymbol, {
		value: fs.realpathSync(os.tmpdir())
	});
}

module.exports = global[tempDirectorySymbol];


/***/ }),

/***/ 225:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";


const fs = __nccwpck_require__(747);
const tempfile = __nccwpck_require__(918);
const pify = __nccwpck_require__(810);

const mkdir = pify(fs.mkdir);

module.exports = () => {
	const path = tempfile();

	return mkdir(path).then(() => path);
};

module.exports.sync = () => {
	const path = tempfile();
	fs.mkdirSync(path);

	return path;
};


/***/ }),

/***/ 918:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

var path = __nccwpck_require__(622);
var osTmpdir = __nccwpck_require__(284);
var uuid = __nccwpck_require__(28);
var TMP_DIR = osTmpdir();

module.exports = function (ext) {
	return path.join(TMP_DIR, uuid.v4() + (ext || ''));
};


/***/ }),

/***/ 67:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var rb = __nccwpck_require__(417).randomBytes;
module.exports = function() {
  return rb(16);
};


/***/ }),

/***/ 28:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

//     uuid.js
//
//     Copyright (c) 2010-2012 Robert Kieffer
//     MIT License - http://opensource.org/licenses/mit-license.php

// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var _rng = __nccwpck_require__(67);

// Maps for number <-> hex string conversion
var _byteToHex = [];
var _hexToByte = {};
for (var i = 0; i < 256; i++) {
  _byteToHex[i] = (i + 0x100).toString(16).substr(1);
  _hexToByte[_byteToHex[i]] = i;
}

// **`parse()` - Parse a UUID into it's component bytes**
function parse(s, buf, offset) {
  var i = (buf && offset) || 0, ii = 0;

  buf = buf || [];
  s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
    if (ii < 16) { // Don't overflow!
      buf[i + ii++] = _hexToByte[oct];
    }
  });

  // Zero out remaining bytes if string was short
  while (ii < 16) {
    buf[i + ii++] = 0;
  }

  return buf;
}

// **`unparse()` - Convert UUID byte array (ala parse()) into a string**
function unparse(buf, offset) {
  var i = offset || 0, bth = _byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = _rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; n++) {
    b[i + n] = node[n];
  }

  return buf ? buf : unparse(b);
}

// **`v4()` - Generate random UUID**

// See https://github.com/broofa/node-uuid for API details
function v4(options, buf, offset) {
  // Deprecated - 'format' argument, as supported in v1.2
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || _rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ii++) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || unparse(rnds);
}

// Export public API
var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;
uuid.parse = parse;
uuid.unparse = unparse;

module.exports = uuid;


/***/ }),

/***/ 580:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

"use strict";

const path = __nccwpck_require__(622);
const uuid = __nccwpck_require__(155);
const tempDirectory = __nccwpck_require__(770);

module.exports = (extension = '') => path.join(tempDirectory, uuid.v4() + extension);


/***/ }),

/***/ 673:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var format = __nccwpck_require__(669).format;

/**
 * Function wrapper for throw statement.
 * Throw an error with formatted message.
 * @param {Error|Function|String} error — instance of error, error class or error message.
 * @throws
 */
module.exports = function(error) {
    if (error instanceof Error) {
        throw error;
    }

    if (typeof error === 'function') {
            // get arguments except the first
        var args = Array.prototype.slice.call(arguments, 1),
            // create instance of specified error class with specified arguments
            err = new (Function.prototype.bind.apply(error, [null].concat(args)))();

        throw err;
    }

    throw new Error(format.apply(null, arguments));
};


/***/ }),

/***/ 155:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var v1 = __nccwpck_require__(749);
var v4 = __nccwpck_require__(824);

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;


/***/ }),

/***/ 707:
/***/ ((module) => {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4
  return ([
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]], '-',
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]],
    bth[buf[i++]], bth[buf[i++]]
  ]).join('');
}

module.exports = bytesToUuid;


/***/ }),

/***/ 859:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

// Unique ID creation requires a high quality random # generator.  In node.js
// this is pretty straight-forward - we use the crypto API.

var crypto = __nccwpck_require__(417);

module.exports = function nodeRNG() {
  return crypto.randomBytes(16);
};


/***/ }),

/***/ 749:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var rng = __nccwpck_require__(859);
var bytesToUuid = __nccwpck_require__(707);

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

var _nodeId;
var _clockseq;

// Previous uuid creation time
var _lastMSecs = 0;
var _lastNSecs = 0;

// See https://github.com/uuidjs/uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};
  var node = options.node || _nodeId;
  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // node and clockseq need to be initialized to random values if they're not
  // specified.  We do this lazily to minimize issues related to insufficient
  // system entropy.  See #189
  if (node == null || clockseq == null) {
    var seedBytes = rng();
    if (node == null) {
      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
      node = _nodeId = [
        seedBytes[0] | 0x01,
        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
      ];
    }
    if (clockseq == null) {
      // Per 4.2.2, randomize (14 bit) clockseq
      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
    }
  }

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;


/***/ }),

/***/ 824:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

var rng = __nccwpck_require__(859);
var bytesToUuid = __nccwpck_require__(707);

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ }),

/***/ 962:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(747)
const tempFile = __nccwpck_require__(580)

exports.getenv = function (name, defValue) {
  if (name in process.env) {
    return process.env[name]
  }
  return defValue
}

exports.prepareDeployKey = function (deployPrivateKey) {
  const keyFile = tempFile() + '_id_rsa'
  fs.writeFileSync(keyFile, deployPrivateKey)
  fs.chmodSync(keyFile, 0o600)

  process.on('exit', () => {
    fs.unlinkSync(keyFile)
    console.log('Deploy private key file has been removed')
  })

  return keyFile
}


/***/ }),

/***/ 129:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");;

/***/ }),

/***/ 417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");;

/***/ }),

/***/ 747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");;

/***/ }),

/***/ 87:
/***/ ((module) => {

"use strict";
module.exports = require("os");;

/***/ }),

/***/ 622:
/***/ ((module) => {

"use strict";
module.exports = require("path");;

/***/ }),

/***/ 669:
/***/ ((module) => {

"use strict";
module.exports = require("util");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(186)
const thr = __nccwpck_require__(673)
const action = __nccwpck_require__(582)
const { getenv, prepareDeployKey } = __nccwpck_require__(962)

main().catch(e => {
  console.error(e)
  core.setFailed(e.message)
  process.exit(1)
})

async function main () {
  const inputs = getInputs()
  if (inputs.debug) {
    console.log('Process argv:', JSON.stringify(process.argv))
    console.log('Inputs:', JSON.stringify(inputs))
  }
  const keyFile = prepareDeployKey(inputs.deployPrivateKey)
  await action(inputs, keyFile)
}

function getInputs () {
  const githubActor = getenv('GITHUB_ACTOR', getenv('USER', 'nobody'))
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
    throw new Error(`Email ${authorEmail} has an incorrect format`)
  }

  return inputs
}

})();

module.exports = __webpack_exports__;
/******/ })()
;
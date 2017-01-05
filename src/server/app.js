const _ = require('lodash')
const path = require('path')
const EventEmitter = require('events').EventEmitter
const errorApp = require('./error')
const server = require('./server')

const ROOT_PATH = process.cwd()

// Initialize nconf with proper config
require('./nconf')(ROOT_PATH)

module.exports = (options = {}, cb) => {
  // Set project dir to process.cwd(). In future we may want to allow to
  // allow the customization of this parameter.
  options.dirname = ROOT_PATH

  _.defaults(options, {
    appRoutes: {},
    publicPath: './public',
    loginUrl: '/login',
    websockets: true,
    bodyParserLimit: '10mb',
    error: errorApp
  })

  // Transform public path to be absolute
  options.publicPath = path.resolve(options.dirname, options.publicPath)

  // Run cb to setup additional options that require initialized nconf
  // and do event handling
  options.ee = new EventEmitter()
  cb && cb(options.ee, options)

  // Run app
  server(options)
}

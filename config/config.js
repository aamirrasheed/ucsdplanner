var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'ucsdplanner'
    },
    port: process.env.PORT || 80,
  },

  test: {
    root: rootPath,
    app: {
      name: 'ucsdplanner'
    },
    port: process.env.PORT || 80,
  },

  production: {
    root: rootPath,
    app: {
      name: 'ucsdplanner'
    },
    port: process.env.port,
  }
};

module.exports = config[env];

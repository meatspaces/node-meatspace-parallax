'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var Parallax = require('../main');

var p = new Parallax({
  db: './test/db'
});

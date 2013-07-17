'use strict';

var level = require('level');
var through = require('through');
var Sublevel = require('level-sublevel');

var Parallax = function (options) {
  var self = this;

  if (!options) {
    options = {};
  }

  this.dbPath = options.db || './db';
  this.limit = 10;
  this.db = Sublevel(level(this.dbPath, {
    createIfMissing: true,
    keyEncoding: 'binary',
    valueEncoding: 'json'
  }));

  console.log(this.db);
};

module.exports = Parallax;

'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var Parallax = require('../main');

var p = new Parallax('jen@email.com', {
  db: './test/db'
});

p.flush('./test/db');

describe('parallax', function () {
  after(function () {
    child.exec('rm -rf ./test/db');
  });

  describe('.getOrAddFriend',  function () {
    it('should not add a new friend', function (done) {
      p.getOrAddFriend(' ', function (err, u) {
        should.exist(err);
        err.toString().should.equal('Error: Invalid user id');
        done();
      });
    });

    it('should add a new friend', function (done) {
      p.getOrAddFriend('friend@email.com', function (err, u) {
        console.log('new friend: ', u.user);
        should.exist(u);
        u.user.should.equal('friend@email.com');
        u.chats.should.eql([]);
        done();
      });
    });

    it('should get an existing friend', function (done) {
      p.getOrAddFriend('friend@email.com', function (err, u) {
        console.log('existing friend: ', u.user);
        should.exist(u);
        u.user.should.equal('friend@email.com');
        u.chats.should.eql([]);
        done();
      });
    });
  });

  describe('.addChat', function () {
    it('should add a new chat', function (done) {
      p.addChat('friend@email.com', 'test message', function (err, c) {
        console.log('chat message: ', c);
        should.exist(c);
        c.should.eql('test message');
        done();
      });
    });
  });

  describe('.getChats', function () {
    it('should get chats', function (done) {
      p.getChats('friend@email.com', function (err, c) {
        console.log('chats received: ', c);
        should.exist(c);
        done();
      });
    });
  });
});

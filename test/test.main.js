'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var Parallax = require('../main');

var p = new Parallax('sender@email.com', {
  db: './test/db',
  frequency: 1
});

var chatKey = '';

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
      p.getOrAddFriend('receiver@email.com', function (err, u) {
        should.exist(u);
        u.user.should.equal('receiver@email.com');
        u.chats.should.eql([]);
        done();
      });
    });

    it('should get an existing friend', function (done) {
      p.getOrAddFriend('receiver@email.com', function (err, u) {
        should.exist(u);
        u.user.should.equal('receiver@email.com');
        u.chats.should.eql([]);
        done();
      });
    });
  });

  describe('.addChat', function () {
    it('should add a new chat to recipients', function (done) {
      var recipients = ['receiver@email.com'];

      p.addChat('receiver@email.com', 'test message', {
        media: 'http://someimage.jpg',
        recipients: recipients
      }, function (err, c) {
        console.log('chat message: ', c);
        should.exist(c);
        chatKey = c.senderKey;
        c.message.should.eql('test message');
        c.recipients.should.eql(recipients);
        done();
      });
    });
  });

  describe('.getFriends', function () {
    it('should get existing friends', function (done) {
      p.getFriends(function (err, f) {
        f.friends.length.should.equal(1);
        done();
      });
    });
  });

  describe('.getChats', function () {
    it('should get chats', function (done) {
      p.getChats('sender@email.com', false, false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(1);
        done();
      });
    });

    it('should get chats in reverse', function (done) {
      p.getChats('sender@email.com', false, false, function (err, c) {
        c.chats.length.should.equal(1);
        done();
      });
    });

    it('should get chats to receiver from sender', function (done) {
      p.friendsLevel = p.db.sublevel('receiver@email.com!friends');
      p.friendList = p.db.sublevel('receiver@email.com!friendlist');

      p.getChats('receiver@email.com', false, false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(1);
        done();
      });
    });
  });

  describe('.removeChat', function () {
    it('should delete a chat', function (done) {
      p.removeChat('receiver@email.com', chatKey, function (err, status) {
        should.not.exist(err);
        p.getChat('receiver@email.com', chatKey, function (err, c) {
          should.not.exist(c);
          done();
        });
      });
    });
  });

  describe('.blockUser', function () {
    it('should error on blocking a user', function (done) {
      p.blockUser('', function (err, s) {
        should.exist(err);
        done();
      });
    });

    it('should block a user', function (done) {
      p.blockUser('receiver2@email.com', function (err, s) {
        should.exist(s);
        done();
      });
    });
  });

  describe('.getBlockedUsers', function () {
    it('should return a list of blocked users', function (done) {
      p.getBlockedUsers(function (err, u) {
        should.exist(u);
        u.blocked.length.should.equal(1);
        done();
      });
    });
  });

  describe('.unblockUser', function (done) {
    it('should error on unblocking a user', function (done) {
      p.unblockUser('', function (err, s) {
        should.exist(err);
        done();
      });
    });

    it('should unblock a user', function (done) {
      p.unblockUser('receiver2@email.com', function (err, s) {
        should.exist(s);
        done();
      });
    });
  });

  describe('.removeUser', function () {
    it('should unfriend', function (done) {
      p.removeUser('receiver@email.com', function (err, s) {
        should.not.exist(err);
        should.exist(s);

        p.getFriends(function (err, f) {
          f.friends.length.should.equal(0);
          done();
        });
      });
    });
  });
});

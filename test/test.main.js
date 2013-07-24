'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var Parallax = require('../main');

var p = new Parallax('sender@email.com', {
  db: './test/db'
});

var p2;

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
        console.log('new friend: ', u.user);
        should.exist(u);
        u.user.should.equal('receiver@email.com');
        u.chats.should.eql([]);
        done();
      });
    });

    it('should get an existing friend', function (done) {
      p.getOrAddFriend('receiver@email.com', function (err, u) {
        console.log('existing friend: ', u.user);
        should.exist(u);
        u.user.should.equal('receiver@email.com');
        u.chats.should.eql([]);
        done();
      });
    });
  });

  describe('.addChat', function () {
    it('should add a new chat', function (done) {
      p.addChat('receiver@email.com', 'test message', function (err, c) {
        console.log('chat message: ', c);
        should.exist(c);
        c.should.eql('test message');
        done();
      });
    });

    it('should mock a conversation between two users', function (done) {
      p2 = p;

      p2.user = 'receiver2@email.com';
      p2.friendsLevel = p2.db.sublevel(p2.user + '!friends');

      p2.getOrAddFriend('sender@email.com', function (err, u) {
        p2.addChat('sender@email.com', 'hola', function (err, c) {
          console.log(c);

          p.user = 'sender@email.com';
          p.friendsLevel = p.db.sublevel(p.user + '!friends');

          setTimeout(function () {
            p.addChat('receiver2@email.com', 'how are you?', function (err, c) {
              console.log(c);

              p2.user = 'receiver2@email.com';
              p2.friendsLevel = p2.db.sublevel(p2.user + '!friends');

              setTimeout(function () {
                p2.addChat('sender@email.com', 'muy bien, gracias!', function (err, c) {
                  console.log(c);
                  done();
                });
              }, 1);
            });
          }, 1);
        });
      });
    });
  });

  describe('.getChats', function () {
    it('should get chats to sender', function (done) {
      p2.getChats('sender@email.com', function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(3);
        console.log('full chat ', c.chats)
        done();
      });
    });

    it('should get chats to receiver2', function (done) {
      p.user = 'sender@email.com';
      p.friendsLevel = p.db.sublevel(p.user + '!friends');

      p.getChats('receiver2@email.com', function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(4);
        console.log('full chat ', c.chats)
        done();
      });
    });
  });
});

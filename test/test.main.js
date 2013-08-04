'use strict';

process.env.NODE_ENV = 'test';

var should = require('should');
var child = require('child_process');
var Parallax = require('../main');

var p = new Parallax('sender@email.com', {
  db: './test/db',
  frequency: 1
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
        //console.log('new friend: ', u.user);
        should.exist(u);
        u.user.should.equal('receiver@email.com');
        u.chats.should.eql([]);
        done();
      });
    });

    it('should get an existing friend', function (done) {
      p.getOrAddFriend('receiver@email.com', function (err, u) {
        //console.log('existing friend: ', u.user);
        should.exist(u);
        u.user.should.equal('receiver@email.com');
        u.chats.should.eql([]);
        done();
      });
    });
  });

  describe('.addChat', function () {
    it('should add a new chat', function (done) {
      p.addChat('receiver@email.com', 'test message', false, function (err, c) {
        console.log('chat message: ', c);
        should.exist(c);
        c.message.should.eql('test message');

        p.getChats('receiver@email.com', false, false, function (err, c) {
          c.chats.length.should.equal(1);
          done();
        });
      });
    });

    it('should add a new chat that is destroyed after 1 second from retrieval', function (done) {
      p2 = p;

      p2.user = 'receiver2@email.com';
      p2.friendsLevel = p2.db.sublevel(p2.user + '!friends');
      p2.friendList = p2.db.sublevel(p2.user + '!friendlist');

      p2.addChat('sender@email.com', 'test message with ttl', { ttl: 1000 }, function (err, c) {
        p.getChat(c.key, 'receiver2@email.com', function (err, c1) {
          setTimeout(function () {
            p2.getChat(c.key, 'sender@email.com', function (err, c2) {
              should.not.exist(c1);
              should.exist(c2);
              done();
            });
          }, 2500);
        });
      });
    });

    it('should mock a conversation between two users', function (done) {
      p2.getOrAddFriend('sender@email.com', function (err, u) {
        p2.addChat('sender@email.com', 'hola', false, function (err, c) {
          console.log(c);
          p.user = 'sender@email.com';
          p.friendsLevel = p.db.sublevel(p.user + '!friends');
          p.friendList = p.db.sublevel(p.user + '!friendlist');

          setTimeout(function () {
            p.addChat('receiver2@email.com', 'how are you?', false, function (err, c) {
              console.log(c);

              p2.user = 'receiver2@email.com';
              p2.friendsLevel = p2.db.sublevel(p2.user + '!friends');

              setTimeout(function () {
                p2.addChat('sender@email.com', 'muy bien, gracias!', false, function (err, c) {
                  console.log(c);
                  done();
                });
              }, 300);
            });
          }, 300);
        });
      });
    });
  });

  describe('.getFriends', function () {
    it('should get existing friends', function (done) {
      p.getFriends(function (err, f) {
        f.friends.length.should.equal(2);
        done();
      });
    });
  });

  describe('.getChats', function () {
    it('should get chats to sender from receiver2', function (done) {
      p2.user = 'receiver2@email.com';
      p2.friendsLevel = p2.db.sublevel('sender@email.com!friends');
      p2.friendList = p2.db.sublevel('sender@email.com!friendlist');

      p2.getChats('sender@email.com', false, false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(4);
        console.log('full chat of receiver2 -> sender ', c.chats)
        done();
      });
    });

    it('should get chats to receiver2 from sender', function (done) {
      p.user = 'sender@email.com';
      p.friendsLevel = p.db.sublevel('receiver2@email.com!friends');
      p.friendList = p.db.sublevel('receiver@email.com!friendlist');

      p.getChats('receiver2@email.com', false, false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(4);
        console.log('full chat of sender -> receiver2 ', c.chats)
        done();
      });
    });

    it('should get chats to receiver2 from sender since key in reverse', function (done) {
      p.limit = 2;
      p.getChats('receiver2@email.com', false, false, function (err, c) {
        p.getChats('receiver2@email.com', c.chats[c.chats.length - 1].key, true, function (err, c) {
          c.chats.length.should.equal(2);
          done();
        });
      });
    });

    it('should get chats to receiver from sender', function (done) {
      p.friendsLevel = p.db.sublevel('receiver@email.com!friends');
      p.friendList = p.db.sublevel('receiver@email.com!friendlist');

      p.getChats('receiver@email.com', false, false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(1);
        console.log('full chat of sender -> receiver ', c.chats)
        done();
      });
    });

    it('should get chats to sender from receiver', function (done) {
      p2.user = 'receiver@email.com';
      p2.friendsLevel = p2.db.sublevel('receiver@email.com!friends');
      p2.friendList = p2.db.sublevel('receiver@email.com!friendlist');

      p2.getChats('sender@email.com', false, false, function (err, c) {
        should.exist(c);
        c.chats.length.should.equal(1);
        console.log('full chat of reciever -> sender ', c.chats)
        done();
      });
    });
  });
});

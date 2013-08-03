'use strict';

var level = require('level');
var ttl = require('level-ttl');
var Sublevel = require('level-sublevel');

var Parallax = function (user, options) {
  var self = this;

  var setTime = function () {
    return Date.now();
  };

  if (!options) {
    options = {};
  }

  this.user = user;
  this.dbPath = options.db || './db';
  this.limit = options.limit || 20;
  this.db = Sublevel(level(this.dbPath, {
    createIfMissing: true,
    valueEncoding: 'json'
  }));
  this.friendsLevel = this.db.sublevel(this.user + '!friends');
  this.db = ttl(this.db, { checkFrequency: options.frequency || 10000 });
  this.friendList = this.db.sublevel(this.user + '!friendlist');
  this.friendLevel;

  var addFriend = function (user, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user);

    self.friendList.put(user, true, function (err) {
      if (err) {
        callback(err);
      } else {
        self.friendLevel.put('chats', true, function (err) {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              user: user,
              chats: []
            });
          }
        });
      }
    });
  };

  var switchUser = function (fromUser, toUser) {
    self.user = fromUser;
    self.friendsLevel = self.db.sublevel(self.user + '!friends');
    self.friendList = self.db.sublevel(self.user + '!friendlist');
    self.friendLevel = self.friendsLevel.sublevel(toUser + '!chats');
  };

  var sendChat = function (user, chat, options, callback) {
    switchUser(user, self.user);

    self.friendList.put(user, true, function (err) {
      if (err) {
        callback(err);
      } else {
        var ttl = false;

        if (options.ttl) {
          ttl = parseInt(options.ttl, 10);

          if (isNaN(ttl)) {
            ttl = false;
          }
        }

        self.friendLevel.put(setTime() + '!' + self.user,
                             { message: chat, ttl: ttl },
                             { ttl: ttl }, function (err) {
          if (err) {
            callback(err);
          } else {
            self.user = self.currUser;
            console.log('******************* ', chat)
            callback(null, chat);
          }
        });
      }
    });
  };

  this.getFriends = function (callback) {
    var friends = [];

    self.friendList.createReadStream()
      .on('data', function (data) {

      friends.push(data);
    }).on('error', function (err) {

      callback(err);
    }).on('end', function () {

      callback(null, {
        friends: friends
      });
    });
  };

  this.getChats = function (user, key, reverse, callback) {
    switchUser(self.user, user);
    var chats = [];

    self.friendLevel.createReadStream({
      key: key,
      limit: self.limit,
      reverse: reverse

    }).on('data', function (data) {

      chats.push(data);
    }).on('error', function (err) {

      callback(err);
    }).on('end', function () {

      callback(null, {
        user: user,
        chats: chats
      });
    });
  };

  this.getOrAddFriend = function (user, callback) {
    if (!user) {
      user = '';
    }

    user = user.toString().replace(/\s+/gi, '');

    if (user.length < 1) {
      callback(new Error('Invalid user id'));
    } else {
      switchUser(self.user, self.user);

      self.friendLevel.get('chats', function (err, chats) {
        if (err || !chats) {
          addFriend(user, callback);
        } else {
          self.getChats(user, callback);
        }
      });
    }
  };

  this.addChat = function (user, chat, options, callback) {
    self.currUser = self.user;
    switchUser(self.currUser, user);

    var ttl = false;

    if (!options) {
      options = {};
    }

    if (options.ttl) {
      ttl = parseInt(options.ttl, 10);

      if (isNaN(ttl)) {
        ttl = false;
      }
    }

    self.friendLevel.put(setTime() + '!' + user,
                         { message: chat, ttl: ttl },
                         { ttl: ttl }, function (err) {
      if (err) {
        callback(err);
      } else {
        sendChat(user, chat, options, callback);
      }
    });
  };
};

module.exports = Parallax;

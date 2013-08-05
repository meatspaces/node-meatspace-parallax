'use strict';

var level = require('level');
var ttl = require('level-ttl');
var Sublevel = require('level-sublevel');

var Parallax = function (user, options) {
  var self = this;

  var DEFAULT_TTL = 10000; // 10 seconds
  var CHAT_TTL_LONG = 259200000; // 3 days

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
  this.currUser = this.user;

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

  var sendChat = function (user, chat, senderKey, created, options, callback) {
    switchUser(user, self.user);

    self.friendList.put(self.currUser, true, function (err) {
      if (err) {
        callback(err);
      } else {
        var ttl = DEFAULT_TTL;

        if (options.ttl) {
          ttl = parseInt(options.ttl, 10);

          if (isNaN(ttl)) {
            ttl = DEFAULT_TTL;
          }
        }

        var key = setTime() + '!' + self.user;

        self.friendLevel.put(key, {
          message: chat,
          media: options.media || false,
          ttl: ttl, senderKey: key,
          created: created
        }, function (err) {
          if (err) {
            callback(err);
          } else {
            self.user = self.currUser;

            callback(null, {
              message: chat,
              media: options.media || false,
              ttl: ttl,
              key: key,
              senderKey: senderKey,
              created: created
            });
          }
        });
      }
    });
  };

  this.getChat = function (key, user, callback) {
    switchUser(user, self.user);

    self.friendLevel.get(key, function (err, chat) {
      if (err || !chat) {
        callback(new Error('Chat not found'));
      } else {
        self.friendLevel.put(key, chat, { ttl: chat.ttl }, function (err) {
          if (err) {
            callback(err);
          } else {
            switchUser(self.currUser, user);

            self.friendLevel.put(key, {
              message: 'opened',
              media: chat.media,
              ttl: CHAT_TTL_LONG,
              senderKey: chat.senderKey,
              created: chat.created
            }, { ttl: CHAT_TTL_LONG }, function (err) {
              if (err) {
                callback(err);
              } else {
                self.user = self.currUser;

                callback(null, chat);
              }
            });
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

    var ttl = DEFAULT_TTL;

    if (!options) {
      options = {};
    }

    if (options.ttl) {
      ttl = parseInt(options.ttl, 10);

      if (isNaN(ttl)) {
        ttl = DEFAULT_TTL;
      }
    }

    var senderKey = setTime() + '!' + user;
    var created = setTime();

    self.friendLevel.put(senderKey, {
      message: chat,
      media: options.media || false,
      ttl: ttl,
      senderKey: senderKey,
      created: created
    }, function (err) {
      if (err) {
        callback(err);
      } else {
        sendChat(user, chat, senderKey, created, options, callback);
      }
    });
  };
};

module.exports = Parallax;

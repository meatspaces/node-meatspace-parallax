'use strict';

var level = require('level');
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
  this.friendLevel;

  var addFriend = function (user, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user);

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
  };

  var switchUser = function (fromUser, toUser) {
    self.user = fromUser;
    self.friendsLevel = self.db.sublevel(self.user + '!friends');
    self.friendLevel = self.friendsLevel.sublevel(toUser + '!chats');
  };

  var sendChat = function (user, chat, callback) {
    switchUser(user, self.user);

    self.friendLevel.put(setTime() + '!' + self.user, chat, function (err) {
      if (err) {
        callback(err);
      } else {
        self.user = self.currUser;
        callback(null, chat);
      }
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

  this.addChat = function (user, chat, callback) {
    self.currUser = self.user;
    switchUser(self.currUser, user);

    self.friendLevel.put(setTime() + '!' + user, chat, function (err) {
      if (err) {
        callback(err);
      } else {
        sendChat(user, chat, callback);
      }
    });
  };
};

module.exports = Parallax;

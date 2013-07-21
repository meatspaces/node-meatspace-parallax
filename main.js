'use strict';

var level = require('level');
var Sublevel = require('level-sublevel');

var Parallax = function (user, options) {
  var self = this;

  var setTime = function () {
    return Math.floor(new Date() / 1000);
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

  this.getChats = function (user, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user + '!chats');
    var chats = [];

    self.friendLevel.createReadStream()
      .on('data', function (data) {

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
    user = user.replace(/\s+/gi, '');

    if (user.length < 1) {
      callback(new Error('Invalid user id'));
    } else {
      self.friendLevel = self.friendsLevel.sublevel(user);

      self.friendLevel.get('chats', function (err, chats) {
        if (err || !chats) {
          addFriend(user, callback);
        } else {
          self.getChats(user, callback);
        }
      });
    }
  };

  this.sendChat = function (user, chat, callback) {
    if (user === self.user) {
      callback(new Error("You can't send a chat to yourself"));
    } else {
      var currUser = self.user;
      self.user = user;
      self.friendLevel = self.friendsLevel.sublevel(user + '!chats');

      self.friendLevel.put(currUser + '!' + setTime(), chat, function (err) {
        if (err) {
          callback(err);
        } else {
          self.user = currUser;
          callback(null, chat);
        }
      });
    }
  };

  this.addChat = function (user, chat, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user + '!chats');

    self.friendLevel.put(user + '!' + setTime(), chat, function (err) {
      if (err) {
        callback(err);
      } else {
        self.sendChat(user, chat, callback);
      }
    });
  };
};

module.exports = Parallax;

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

  var addFriend = function (user, callback) {
    self.friendsLevel.put(user + '!chats', [], function (err) {
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

  this.getOrAddFriend = function (user, callback) {
    if (user.replace(/\s+/gi, '').length < 1) {
      callback(new Error('Invalid user id'));
    } else {
      self.friendsLevel.get(user + '!chats', function (err, chats) {
        if (err || !chats) {
          addFriend(user, callback);
        } else {
          callback(null, {
            user: user,
            chats: chats
          });
        }
      });
    }
  };

  this.addChat = function (user, chat, callback) {
    var friendChatLevel = self.friendsLevel.sublevel('chats');
    friendChatLevel.put(setTime(), chat, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, chat);
      }
    });
  };

  this.getChats = function (user, callback) {
    var friendChatLevel = self.friendsLevel.sublevel('chats');
    var chats = [];

    friendChatLevel.createReadStream()
      .on('data', function (data) {

      chats.push(data);
    }).on('error', function (err) {

      callback(err);
    }).on('end', function () {

      callback(null, chats);
    });
  };

  this.flush = function (dbPath) {
    level.destroy(dbPath || self.dbPath, function (err) {
      console.log('Deleted database');
    });
  };
};

module.exports = Parallax;

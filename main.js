'use strict';

var level = require('level');
var Sublevel = require('level-sublevel');
var concat = require('concat-stream');

var Parallax = function (user, options) {
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
  this.friendList = this.db.sublevel(this.user + '!friendlist');
  this.blockList = this.db.sublevel(this.user + '!blocklist');
  this.friendLevel;
  this.currUser = this.user;

  var self = this;

  var addFriend = function (user, callback) {
    self.blockList.get(user, function (err, u) {
      if (!u) {
        self.friendList.put(user, true, function (err) {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              user: user,
              chats: []
            });
          }
        });
      } else {
        callback(new Error('cannot add this user'));
      }
    });
  };

  this.getChat = function (user, key, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user);

    self.friendLevel.get(key, function (err, chat) {
      if (err || !chat) {
        callback(new Error('Chat not found'));
      } else {
        self.friendLevel.put(key, {
          message: chat.message,
          media: chat.media,
          senderKey: chat.senderKey,
          created: chat.created,
          recipients: chat.recipients
        }, function (err) {
          if (err) {
            callback(err);
          } else {
            callback(null, chat);
          }
        });
      }
    });
  };

  this.removeUser = function (user, callback) {
    if (user.length < 1) {
      callback(new Error('Invalid user id'));
    } else {
      self.friendList.del(user, function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null, 'Deleted user');
        }
      });
    }
  };

  this.blockUser = function (user, callback) {
    if (user.length < 1) {
      callback(new Error('Invalid user id'));
    } else {

      self.removeUser(user, function (err, data) {
        if (err) {
          callback(err);
        } else {
          self.blockList.put(user, true, function (err) {
            if (err) {
              callback(new Error('Could not block user'));
            } else {
              callback(null, true);
            }
          });
        }
      });
    }
  };

  this.unblockUser = function (user, callback) {
    if (user.length < 1) {
      callback(new Error('Invalid user id'));
    } else {

      self.blockList.del(user, function (err) {
        if (err) {
          callback(new Error('Could not unblock user'));
        } else {
          callback(null, true);
        }
      });
    }
  };

  this.getBlockedUsers = function (callback) {
    var rs = self.blockList.createReadStream();

    rs.pipe(concat(function (blocked) {
      callback(null, {
        blocked: blocked || []
      });
    }));

    rs.on('error', function (err) {
      callback(err);
    });
  };

  this.getFriends = function (callback) {
    var rs = self.friendList.createReadStream();

    rs.pipe(concat(function (friends) {
      callback(null, {
        friends: friends || []
      });
    }));

    rs.on('error', function (err) {
      callback(err);
    });
  };

  this.hasFriend = function (user, callback) {
    self.friendList.get(user, function (err, friend) {
      if (err) {
        callback(err);
      } else if (!friend) {
        callback(new Error('friend not found'));
      } else {
        callback(null, friend);
      }
    });
  };

  this.getChats = function (user, key, reverse, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user);

    var rs = self.friendLevel.createReadStream({
      start: key,
      limit: self.limit,
      reverse: reverse
    });

    rs.pipe(concat(function (chats) {
      callback(null, {
        user: user,
        chats: chats || []
      });
    }));

    rs.on('error', function (err) {
      callback(err);
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

  this.removeChat = function (user, key, callback) {
    self.friendLevel = self.friendsLevel.sublevel(user);

    self.friendLevel.del(key, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, 'Deleted!');
      }
    });
  };

  this.addChat = function (user, chat, options, callback) {
    if (!options) {
      options = {};
    }

    self.blockList.get(user, function (err, u) {
      if (!u) {
        var senderKey = setTime() + '!' + user;
        var created = setTime();
        var newChat = {
          message: chat,
          media: options.media || false,
          senderKey: senderKey,
          created: created,
          status: 'unread',
          recipients: options.recipients || []
        };

        self.friendLevel = self.friendsLevel.sublevel(user);

        self.friendLevel.put(senderKey, newChat, function (err) {
          if (err) {
            callback(err);
          } else {
            callback(null, newChat);
          }
        });
      } else {
        callback(new Error('cannot send message to this user'));
      }
    });
  };
};

module.exports = Parallax;

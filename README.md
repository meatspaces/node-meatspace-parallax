# meatspace-parallax

Chat using LevelDB. Currently under development.

## Chat Structure

    user
      |
      friends
            |
            friendA   ,   friendB
                  |             |
                  chats         chats

## Installation

[Install leveldb](http://code.google.com/p/leveldb/downloads/list)

    > npm install

## Usage

    var parallax = new Parallax('you@email.com');

### Add a friend

    parallax.getOrAddFriend('friend@email.com', function (err, u) {
      if (!err) {
        console.log(u);
      }
    });

### Add a chat message

    parallax.addChat('friend@email.com', 'hola!', function (err, c) {
      if (!err) {
        console.log(c);
      }
    });

### Get all chats

    parallax.getChats('you@email.com', function (err, c) {
      if (!err) {
        console.log(c);
      }
    });

## Tests

    > make test

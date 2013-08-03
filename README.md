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

    > npm install

## Usage

    var parallax = new Parallax('you@email.com');

### Add a friend

    parallax.getOrAddFriend('friend@email.com', function (err, u) {
      if (!err) {
        console.log(u);
      }
    });

## Get all friends

    parallax.getFriends(function (err, f) {
      if (!err) {
        console.log(f);
      }
    });

### Add a chat message

    parallax.addChat('friend@email.com', 'hola!', { ttl: 10000 }, function (err, c) {
      if (!err) {
        console.log(c);
      }
    });

If you do not set a ttl (e.g. passing {} or { ttl: false }), it will fall back to 10 seconds

### Get all chats

    parallax.getChats('you@email.com', <key>, <reverse>, function (err, c) {
      if (!err) {
        console.log(c);
      }
    });

`key` is an optional point in which you want to start a chat stream from - set to false if you want it to default to the beginning.

`reverse` is an optional boolean to reverse the chat history from latest -> earliest. Defaults at earliest -> latest.

## Tests

    > make test

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

```sh
$ npm install
```

## Usage

```js
var parallax = new Parallax('you@email.com');
```

### Add a friend

```js
parallax.getOrAddFriend('friend@email.com', function (err, u) {
    if (!err) {
        console.log(u);
    }
});
```

### Remove a friend

```js
parallax.removeFriend('friend@gmail.com', function (err, u) {
    if (!err) {
        console.log(u);
    }
});
```

### Get all friends

```js
parallax.getFriends(function (err, f) {
    if (!err) {
        console.log(f);
    }
});
```

### Add a chat message

```js
var chat = {
    media: 'http://someimage.jpg',
    recipients: ['user1', 'user2']
};

chat.recipients.forEach(function (user) {
    parallax.addChat(user, 'hola!', chat, function (err, c) {
        if (!err) {
            console.log(c);
        }
    });
});
```

If you want to also store a some url or base64 string, pass it under media - otherwise, you can leave this out.

Recipients are optional, but if you want to keep superficial track of who you sent the message to, add it here. You will still have to broadcast the message across manually.

### Remove a chat message from a friend

```js
parallax.removeChat('friend@email.com', chatKey, function (err, c) {
    if (!err) {
        console.log(c);
    }
});
```

### Get chat

```js
parallax.getChat(<key>, 'friend@email.com', function (err, c) {
    if (!err) {
        console.log(c);
    }
});
```

### Get all chats

```js
parallax.getChats('you@email.com', <key>, <reverse>, function (err, c) {
    if (!err) {
        console.log(c);
    }
});
```

`key` is an optional point in which you want to start a chat stream from - set to false if you want it to default to the beginning.

`reverse` is an optional boolean to reverse the chat history from latest -> earliest. Defaults at earliest -> latest.

## Block a user

```js
parallax.blockUser('user@email.com', function (err, c) {
    if (!err) {
        console.log(c);
    }
});
```

## Unblock a user

```js
parallax.unblockUser('user@email.com', function (err, c) {
    if (!err) {
        console.log(c);
    }
});
```

## Get a list of blocked users

```js
parallax.getBlockedUsers(function (err, c) {
    if (!err) {
        console.log(c);
    }
});
```


## Tests

```sh
$ make test
```

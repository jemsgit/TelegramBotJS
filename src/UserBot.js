var request = require('request'),
    events = require('./events'),
    voteService = require('./voteService');;

var adminId = '123',
    timer,
    updateId = 0,
    handlers = {
        echo: function(host, chat_id, text) {
            text = text || 'hello';
            request.post({
                    url: host + 'sendMessage',
                    form: {
                        chat_id: chat_id,
                        text: text
                    }
                },
                function(err, response, body) {
                    console.log(err);
                })
        },
        hello: function(host, chat_id, text) {
            events.raise('hello', {
                chat_id: chat_id,
                host: host,
                text: text
            });
            let keyboard = {
                keyboard: [
                    [{
                            text: '123'
                        },
                        {
                            text: '456'
                        }
                    ]
                ],
                one_time_keyboard: true
            }
            request.post({
                    url: host + 'sendMessage',
                    form: {
                        chat_id: chat_id,
                        text: 'hello test',
                        reply_markup: JSON.stringify(keyboard)
                    }
                },
                function(err, response, body) {
                    console.log(body);
                })
        },
        test: function(host, chat_id, text) {
            events.raise('hello', {
                chat_id: chat_id,
                host: host,
                text: text
            });
            var shareButtonsClean = [{
                    text: '📢Vk',
                    url: 'https://goo.gl/4k1Sf2'
                },
                {
                    text: '📢Fb',
                    url: 'https://goo.gl/4k1Sf2'
                }
            ]
            shareButtons = setShareButtons(shareButtonsClean);
            console.log(shareButtons)
            var like = {
                val: 'like',
                t: 'vote',
                sb: shareButtons
            };
            var dislike = {
                val: 'dislike',
                t: 'vote',
                sb: shareButtons
            }

            let keyboard = {
                inline_keyboard: [
                    [
                        {
                            text: "👍 0",
                            callback_data: JSON.stringify(like)
                        }, {
                            text: "😕 0",
                            callback_data: JSON.stringify(dislike)
                        },
                        shareButtonsClean[1], shareButtonsClean[0]
                    ]
                ],
                one_time_keyboard: true
            }

            request.post({
                    url: host + 'sendMessage',
                    form: {
                        chat_id: chat_id,
                        text: '123',
                        reply_markup: JSON.stringify(keyboard)
                    }
                },
                function(err, response, body) {
                    console.log(body);
                })
        },
        removeLast: function(host, chat_id, channelId) {
            events.raise('removeLast', {
                channelId: channelId,
                chat_id: chat_id,
                host: host
            });
        },
        forcepost: function(host, chat_id, channelId) {
            events.raise('forcePost', {
                channelId: channelId
            });
        },
        getchannelstimes: function(host, chat_id, channelId) {
            events.raise('getChannelsTimes', {
                channelId: channelId,
                chat_id: chat_id,
                host: host
            });
        },
        fakeVote: function(host, chat_id, textParams, queryId){
            if(!textParams){
                return;
            }
            textParams = textParams.trim().split(' ');
            console.log(textParams)
            if(textParams.length < 4){
                return;
            }
            var channelName = textParams[0],
                postId = textParams[1],
                userId = textParams[2],
                data = textParams[3];
                //@test_channel 1022 % like
            var result = voteService.voteUser(userId, channelName, postId, data, true);
            if(result){
                request.post({
                    url: host + 'sendMessage',
                    form: {
                        chat_id: chat_id,
                        text: 'success vote',
                        reply_markup: JSON.stringify(keyboard)
                    }
                },
                function(err, response, body) {
                    console.log(body);
                })
            }
        },
        voteHandler: function(queryId, userId, channelId, channelName, postId, text, data, sb, host) {
            console.log('----Bot Vote params-----')
            console.log(userId, channelId, channelName, postId, data);
            console.log('---------')
            var result = voteService.voteUser(userId, channelName, postId, data);
            if (result) {
                if(result.message && !result.status){
                    request.post({
                            url: host + 'answerCallbackQuery',
                            form:{
                                callback_query_id: queryId,
                                text: result.message
                            }
                },function(err, response, body) {
                    if(err){
                        console.log(err)
                    }
                })
            } else if(result.status){
                    var buttons = getShareButtons(sb);
                    var like = {
                        val: 'like',
                        t: 'vote',
                        sb: sb
                    };
                    var dislike = {
                        val: 'dislike',
                        t: 'vote',
                        sb: sb
                    }

                    var inline_keyboard = [{
                            text: "👌 " + (result.counts.like || 0),
                            callback_data: JSON.stringify(like)
                        },
                        {
                            text: "😕" + (result.counts.dislike || 0),
                            callback_data: JSON.stringify(dislike)
                        }
                    ];
                    if (buttons && buttons.length) {
                        inline_keyboard = inline_keyboard.concat(buttons);
                    }
                    let keyboard = {
                        inline_keyboard: [
                            inline_keyboard
                        ],
                        one_time_keyboard: true
                    }
                    request.post({
                            url: host + 'answerCallbackQuery',
                            form:{
                                callback_query_id: queryId,
                                text: result.message
                            }
                    }, function(err, response, body) {
                        if(!err){

                        }
                    });
                    request.post({
                        url: host + 'editMessageReplyMarkup',
                        form: {
                            chat_id: channelId,
                            message_id: postId,
                            reply_markup: JSON.stringify(keyboard)
                        }
                    },
                    function(err, response, body) {

                    })
                }
            }
        },
        shareHandler: function(queryId, url, postId, channelId, host) {
            console.log(queryId)
        }
    }

function getShareButtons(text) {
    var buttons = [];
    if (!text) {
        return buttons;
    }
    var items = text.split('!');
    if (items) {
        items.forEach(function(item) {
            var link = item.split(':');
            var button = {
                text: link[0],
                url: 'goo.gl/' + link[1]
            }
            buttons.push(button);
        })
    }
    return buttons;
}

function setShareButtons(buttons) {
    var shareBut = ''
    if (buttons && buttons.length) {
        buttons.forEach(function(item, i) {
            var url = item.url.split('goo.gl/');
            shareBut += item.text + ':' + url[1];
            if (i < (buttons.length - 1)) {
                shareBut += '!'
            }
        })
    }
    return shareBut;
}

function processResponse(data, host) {
    if (!data) {
        return;
    }
    try {
        data = JSON.parse(data);
    } catch (error) {
        console.log(error);
        return;
    }

    data = data.result;
    if (!data) {
        return;
    }

    var lastCommand = data[data.length - 1];
    if (lastCommand && lastCommand.update_id) {
        updateId = lastCommand.update_id + 1;
    }

    if (lastCommand &&
        lastCommand.message &&
        lastCommand.message.from &&
        lastCommand.message.from.username === adminId) {

        var text = lastCommand.message.text.trim();
        var chat_id = lastCommand.message.chat.id;
        if (text.charAt(0) === '/') {
            var commandParams = getCommandParams(text);
            console.log('----Bot message params-----');
            console.log(commandParams);
            console.log('---------');
            var handler = getHandlerByCommand(commandParams.command);
            handler(host, chat_id, commandParams.text);
        }
    } else if (lastCommand && lastCommand.callback_query) {
        var query = lastCommand.callback_query,
            queryData = JSON.parse(lastCommand.callback_query.data);
        if (query.data &&
            queryData.t) {
            if (queryData.t === 'vote') {
                var userId = query.from.username || query.from.id,
                    postId = query.message.message_id,
                    channelId = query.message.chat.id,
                    channelName = query.message.chat.username,
                    data = queryData.val,
                    sb = queryData.sb,
                    text = query.message.text;
                handlers.voteHandler(query.id, userId, channelId, channelName, postId, text, data, sb, host);
            } else if (queryData.type === 'share') {
                var url = queryData.url,
                    queryId = query.id,
                    postId = query.message.message_id,
                    channelId = query.message.chat.username;
                handlers.shareHandler(queryId, url, postId, channelId, host);
            }
        }
    }

}

function getCommandParams(text) {
    var commandEnd = text.indexOf(' ');
    var command,
        text;
    if (commandEnd < 0) {
        command = text.substr(1);
        text = ''
    } else {
        command = text.substr(1, commandEnd - 1);
        text = text.substr(commandEnd);
    }
    return {
        command: command,
        text: text
    };
}

function getHandlerByCommand(command) {
    var handler = handlers[command];
    return handler || function() {};
}

function getMessageChecker(host) {
    var url = host + 'getUpdates'
    return function() {
        request.get(url + '?offset=' + updateId)
            .on('response', function(response, data) {
                response.on("data", function(data) {
                    processResponse(data, host)
                });
            })
    }
}

function UserBot(settings, votes) {
    if (settings && settings.token) {
        this.token = settings.token;
        this.time = 1500;
        this.host = "https://api.telegram.org/bot" + this.token + "/";
        voteService.setVotes(votes);
    }

}

UserBot.prototype.startBot = function() {
    var checkFunc = getMessageChecker(this.host);
    timer = setInterval(checkFunc, this.time);
}

UserBot.prototype.stopBot = function() {
    if (timer) {
        clearInterval(timer);
    }
}

module.exports = UserBot;

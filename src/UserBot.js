var request = require('request'),
    events = require('./events'),
    constants = require('./constants'),
    voteService = require('./voteService');

function UserBot(settings, mediator) {
    if (settings && settings.token) {
        this.token = settings.token;
        this.time = 1500;
        this.host = "https://api.telegram.org/bot" + this.token + "/";
        this.adminId = settings.adminId;
        this.mediator = mediator;
        this.setHandlers();
        this.updateUserVotes();
    }

}

UserBot.prototype.updateId = 0;

UserBot.prototype.timer = null;

UserBot.prototype.newPost = null;

UserBot.prototype.interceptorHandler = null;

UserBot.prototype.updateUserVotes = function(){
    var votes = this.mediator.getUserVotes();
    voteService.setVotes(votes);
}

UserBot.prototype.startBot = function() {
    var checkFunc = this.getMessageChecker(this.host, this.adminId);
    this.timer = setInterval(checkFunc, this.time);
}

UserBot.prototype.stopBot = function() {
    if (this.timer) {
        clearInterval(this.timer);
    }
}

UserBot.prototype.handlers = null;

UserBot.prototype.setHandlers = function(){
    var that = this;

    this.handlers = {
        hel: function(){
            console.log(that.token);
        },
        test: function(host, chat_id, text) {
            text = text || '123';
            that.mediator.telegramBotReply(host, chat_id, text);
        },
        removeLast: function(host, chat_id, channelId) {
            that.mediator.removeLastPost({
                channelId: channelId,
                chat_id: chat_id,
                host: host,
                type: constants.telegram
            });
        },
        forcepost: function(host, chat_id, channelId) {
            that.mediator.forcePost({
                channelId: channelId
            });
        },
        getchannelstimes: function(host, chat_id, channelId) {
            that.mediator.getChannelsTimes({
                channelId: channelId,
                chat_id: chat_id,
                host: host
            });
        },
        addpost: function(host, chat_id, textParams){
            var params = textParams.trim().split(' ');
            if(params.length > 1){
                that.newPost = {
                    channelId: params[0],
                    time: params[1]
                }

                that.mediator.telegramBotReply(host, chat_id, 'Add ur text');
                that.interceptorHandler = getPost;
            }
            
        },
        viewcontent: function(host, chat_id, textParams){
            if(textParams){
                console.log()
                var params = textParams.trim().split(' '),
                    channelId = params[0],
                    count = params[1],
                    offset = params[2] || 0,
                    callback = function(result){
                        that.mediator.telegramBotReply(host, chat_id, result);
                    }
                that.mediator.viewContent({
                    channelId: channelId,
                    count: count,
                    offset: offset,
                    callback: callback
                });  
            }
        },
        deletecontent: function(host, chat_id, textParams){
             if(textParams){
                textParams = textParams.trim();
                var params = textParams.split(' '),
                    channelId = params[0],
                    content = params.slice(1)
                    callback = function(result){
                        that.mediator.telegramBotReply(host, chat_id, result);
                    };
                that.mediator.deleteContent({
                    channelId: channelId,
                    content: content,
                    callback: callback
                });  
            }
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
                data = textParams[3],
                count = textParams[4]
                //@test_channel 1022 % like
            var result = voteService.voteUser(userId, channelName, postId, data, true, count);
            if(result){
                that.mediator.telegramBotReply(host, chat_id, 'success vote');
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
                    that.mediator.answerCallbackQuery(host, queryId, result.message);
                    that.mediator.editMessageReplyMarkup(host, channelId, postId, keyboard);
                }
            }
        },
        shareHandler: function(queryId, url, postId, channelId, host) {
            console.log(queryId)
        }
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

UserBot.prototype.getPost = function(host, data) {
    if(data && data.text){
        console.log(data.text)
        var chat_id = data.chat.id;
        data = data.text
        if(data === 'cancel'){
            this.newPost = null
        } else {
            this.newPost.post = data
            this.mediator.addPost(ths.newPost)
            this.mediator.telegramBotReply(host, chat_id, 'success add post')
            }
        }

    this.newPost = null;
    this.interceptorHandler = null;
}

UserBot.prototype.setShareButtons = function(buttons) {
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

UserBot.prototype.processResponse = function(data, host) {
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
        this.updateId = lastCommand.update_id + 1;
    }
    
    if (lastCommand &&
        lastCommand.message &&
        lastCommand.message.from &&
        lastCommand.message.from.username === this.adminId) {

        if(this.interceptorHandler){
            this.interceptorHandler(host, lastCommand.message);
            return;
        }
        var text = lastCommand.message.text.trim();
        var chat_id = lastCommand.message.chat.id;
        if (text.charAt(0) === '/') {
            var commandParams = this.getCommandParams(text);
            var handler = this.getHandlerByCommand(commandParams.command);
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
                this.handlers.voteHandler(query.id, userId, channelId, channelName, postId, text, data, sb, host);
            } else if (queryData.type === 'share') {
                var url = queryData.url,
                    queryId = query.id,
                    postId = query.message.message_id,
                    channelId = query.message.chat.username;
                this.handlers.shareHandler(queryId, url, postId, channelId, host);
            }
        }
    }
}

UserBot.prototype.getCommandParams = function(text) {
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

UserBot.prototype.getHandlerByCommand = function(command) {
    var handler = this.handlers[command];
    return handler || function() {};
}

UserBot.prototype.getMessageChecker = function(host) {
    var url = host + 'getUpdates',
        that = this;
    return function() {
        request.get(url + '?offset=' + that.updateId)
            .on('response', function(response, data) {
                response.on("data", function(data) {
                    that.processResponse(data, host);
                });
            })
    }
}

module.exports = UserBot;

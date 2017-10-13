var inherit = require('./inherit'),
    request = require('request'),
    constants = require('./constants'),
    GoogleURL = require('google-url'),
    BaseRequestManager = require('./BaseRequestManager');


function TelegramRequestManager(settings) {
    this.token = settings.token;
    this.disable_web_page_preview = 'false';
    this.host = "https://api.telegram.org/bot" + this.token + "/";
    this.headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30"
    }
    this.youtube_check_url = 'https://www.youtube.com/oembed';
    this.googleUrl = new GoogleURL({
        key: settings.googleApiKey
    });
}

inherit(BaseRequestManager, TelegramRequestManager)

TelegramRequestManager.prototype.botReply = function(host, chat_id, message) {
    request.post({
            url: host + 'sendMessage',
            form: {
                chat_id: chat_id,
                text: message
            }
        },
        function(err, response, body) {
            console.log(err);
        })
}

TelegramRequestManager.prototype.updateMessage = function(prop) {
    var url = this.host + 'editMessageText';

    request.post({
        url: url,
        form: prop
    }, function(err, response, body) {
        console.log(body)
    });
}

TelegramRequestManager.prototype.postData = function(channel_id, data, type) {
    var that = this;
    switch (type) {
        case constants.links:
            var that = this;
            var message = data.message + ' ' + data.link;
            var url = this.host + "sendMessage";
            var propertiesObject = {
                chat_id: channel_id,
                text: message,
                disable_web_page_preview: this.disable_web_page_preview,
                disable_notification: this.isWeekend()
            }

            request.post({
                    url: url,
                    form: propertiesObject
                },
                function(err, response, body) {
                    console.log(response.statusCode + ' - ' + data.link);

                    var body = JSON.parse(body);
                    if (!body || !body.result) {
                        return;
                    }
                    var shareLink = 'https://t.me/' + body.result.chat.username + '/' + body.result.message_id
                    var shareVkLink = 'http://vk.com/share.php?url=' + shareLink + '&title=' + data.message;
                    var shareFbLink = 'https://www.facebook.com/sharer/sharer.php?u=' + shareLink;
                    that.googleUrl.shorten(shareVkLink, function(err1, shortUrlVk) {
                        that.googleUrl.shorten(shareFbLink, function(err2, shortUrlFb) {
                            var shareButtons = [{
                                    text: 'Vk',
                                    url: shortUrlVk
                                },
                                {
                                    text: 'Fb',
                                    url: shortUrlFb
                                }
                            ]
                            var sb = setShareButtons(shareButtons);
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

                            var prop = {
                                chat_id: body.result.chat.id,
                                message_id: body.result.message_id,
                                text: message,
                                disable_web_page_preview: that.disable_web_page_preview,
                                disable_notification: that.isWeekend(),
                                reply_markup: JSON.stringify({
                                    inline_keyboard: [
                                        [{
                                                text: "👍 0",
                                                callback_data: JSON.stringify(like)
                                            },
                                            {
                                                text: "😕 0",
                                                callback_data: JSON.stringify(dislike)
                                            },
                                            {
                                                text: "Share Vk",
                                                url: shortUrlVk
                                            },
                                            {
                                                text: "Share Fb",
                                                url: shortUrlFb
                                            }
                                        ]
                                    ]
                                })
                            }
                            console.log(body.result)

                            that.updateMessage(prop);
                        })
                    })


                });
            break;
    }

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

module.exports = TelegramRequestManager;

var request = require('request'),
    events = require('./events');

var adminId = 'name',
    timer,
    updateId = 0,
    handlers = {
      echo: function(host, chat_id, text){
          text = text || 'hello';
          console.log('HEREEEE1')
          request.post({url: host + 'sendMessage', form: {chat_id: chat_id, text: text}},
          function(err, response, body) {
              console.log(err);
          })
      },
      hello: function(host, chat_id, text){
          events.raise('hello', {chat_id: chat_id, host: host, text: text});
          let keyboard = {
              keyboard: [
                [{text: '123'},
                {text: '456'}]
              ],
              one_time_keyboard: true
          }
          request.post({url: host + 'sendMessage', form: {chat_id: chat_id, text: '123', reply_markup: JSON.stringify(keyboard)}},
          function(err, response, body) {
              console.log(err);
          })
      },
      line: function(host, chat_id, text){
          events.raise('hello', {chat_id: chat_id, host: host, text: text});
          let keyboard = {
              inline_keyboard: [
                [{text: "👍", callback_data: '+'}, {text: "😕", callback_data: '-'}]
              ],
              one_time_keyboard: true
          }
          request.post({url: host + 'sendMessage', form: {chat_id: chat_id, text: '123', reply_markup: JSON.stringify(keyboard)}},
          function(err, response, body) {
              console.log(err);
          })
      },
      removeLast: function(host, chat_id, channelId){
          events.raise('removeLast', {channelId: channelId, chat_id: chat_id, host: host});
      },
      getchannelstimes: function(host, chat_id, channelId){
          events.raise('getChannelsTimes', {channelId: channelId, chat_id: chat_id, host: host});
      }
    }

function processResponse(data, host){
  if(!data){
    return;
  }
  try{
    data = JSON.parse(data);
  } catch(error){
    console.log(error);
    return;
  }
  console.log(data)
  data = data.result;
  if(!data){
    return;
  }
  var lastCommand = data[data.length-1];
  if(lastCommand && lastCommand.update_id){
      updateId = lastCommand.update_id + 1;
  }
  if(lastCommand
    && lastCommand.message
    && lastCommand.message.from
    && lastCommand.message.from.username === adminId){
      console.log(lastCommand.message)
      var text = lastCommand.message.text.trim();
      var chat_id = lastCommand.message.chat.id;
      if(text.charAt(0) === '/'){
          var commandParams = getCommandParams(text);
          var handler = getHandlerByCommand(commandParams.command);
          handler(host, chat_id, commandParams.text);
      }
  }

}

function getCommandParams(text){
   var commandEnd = text.indexOf(' ');
   var command,
        text;
   if(commandEnd < 0){
     command = text.substr(1);
     text = ''
   } else {
     command = text.substr(1, commandEnd-1);
     text = text.substr(commandEnd);
   }
   return {
     command: command,
     text: text
   };
}

function getHandlerByCommand(command){
    var handler = handlers[command];
    return handler || function(){};
}

function getMessageChecker(host){
    var url = host + 'getUpdates'
    return function(){
        console.log(url + '?offset=' + updateId)
        request.get(url + '?offset=' + updateId)
          .on('response', function(response, data) {
            response.on("data", function(data) {
                processResponse(data, host)
              });
          })
    }
}

function UserBot(settings){
    if(settings && settings.token){
      this.token = settings.token;
      this.time = 1500;
      this.host = "https://api.telegram.org/bot" + this.token + "/";
    }

}

UserBot.prototype.startBot = function(){
    var checkFunc = getMessageChecker(this.host);
    timer = setInterval(checkFunc, this.time);
}

UserBot.prototype.stopBot = function(){
    if(timer){
        clearInterval(timer);
    }
}

module.exports = UserBot;

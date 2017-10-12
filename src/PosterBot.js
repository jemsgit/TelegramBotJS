var Scheduler = require('./scheduler'),
    events = require('./events');

function PosterBot(commonSettings){
  if(commonSettings.settings){
    this.scheduler = new Scheduler(commonSettings.settings);
  }
    if(commonSettings.publicsList){
        this.publicsList = commonSettings.publicsList;
        console.log(this.publicsList);
    }
    if(commonSettings.channelsList){
        this.channelsList = commonSettings.channelsList;
        console.log(this.channelsList);
    }
    if(commonSettings.stealerSettings){
      this.stealerSettings = commonSettings.stealerSettings;
  	}
  	this.scheduler.listJobsCount();
}


PosterBot.prototype.attachEvents = function(){
  var that = this;
  events.on('removeLast', function(params){
      console.log('REMOOOVE')
      that.scheduler.removeLastPostTelegram(params.channelId, params.chat_id, params.host)
  });
  events.on('getChannelsTimes', function(params){
      console.log('getChannelsTimes')
      that.scheduler.getChannelsTimes('@testChannelJem', params.chat_id, params.host)
  })
}


PosterBot.prototype.startBot = function(){
  if(this.publicsList){
      console.log('START BOT');
      console.log(this.publicsList);
      this.scheduler.setPublicsPostTimer(this.publicsList);
  }
  if(this.channelsList){
      this.scheduler.setTelegramPostTimer(this.channelsList);
  }
  if(this.stealerSettings){
    for(prop in this.stealerSettings){
         this.scheduler.setContentStealerTimer(this.stealerSettings[prop]);
    }
  }
  this.scheduler.listJobsCount();
  this.attachEvents();
}

PosterBot.prototype.stopBot = function(){
  this.scheduler.cancelJobs()
}

module.exports = PosterBot;

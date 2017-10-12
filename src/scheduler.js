var schedule = require('node-schedule'),
	TelegramRequstManager = require('./TelegramRequestManager'),
	VkRequestManager = require('./VkRequestManager'),
	fileManager = require('./fileManager'),
	dataParser = require('./dataParser');

function Scheduler(settings) {

	if(settings.vkSettings){
		this.vkReuqestManager = new VkRequestManager(settings.vkSettings);
	}
    if(settings.telegramSettings){
        this.telegramRequestManager = new TelegramRequstManager(settings.telegramSettings);
    }
		this.jobs = {};
}

Scheduler.prototype.vkReuqestManager = null;

Scheduler.prototype.telegramRequestManager = null;

Scheduler.prototype.jobs = null;

Scheduler.prototype.parseTimeToCron = function(timeString, periodic){
    var time = timeString.split(':');
    return '12 ' + time[1] + ' ' + time[0] + ' * * ' + periodic
}

Scheduler.prototype.setPublicsPostTimer = function(publicsSettings){
	var that = this;
    for(var publicItem in publicsSettings){
        var settings = publicsSettings[publicItem];
				this.jobs[settings.publicId] = {}
        console.log(settings.publicId);
        for(var i = 0; i < settings.times.length; i++){
            var time = this.parseTimeToCron(settings.times[i], '0-6');
            console.log('---', settings.times[i])
            var task = schedule.scheduleJob(time, function(){
                var postData = fileManager.readStringFromFile(settings.filePath),
                    requestData;
                if(postData){
                    requestData = dataParser.parsePostString(postData, settings.type);
                    if(requestData){
                        that.vkReuqestManager.postData(requestData, settings.publicId);
                    }
                }

            })
            this.jobs[settings.publicId][settings.times[i]] = task
        }

    }
};

Scheduler.prototype.setContentStealerTimer = function(settings){
    var that = this;
    if(settings.times && settings.link){

        var process = function(){
            var request = that.vkReuqestManager.getTitleLinks(settings.link);

            request.then(function(data){
							console.log('REQUEST')
                    var oldTitles = fileManager.getOldTitlesFromFile(settings.resultFile);
                    var newPosts = dataParser.parseTitles(data, oldTitles, settings.link.q);
                    fileManager.addNewArrayDataFile(newPosts, settings.resultFile);

                    if(newPosts.length){
                        var contetnRequest = that.vkReuqestManager.getNewContent(newPosts);
                        console.log(contetnRequest)
                        contetnRequest.then(function(data){
                            var resultData = [];
                            console.log('new Data')
                            for(var i = 0; i < data.length; i++){
                                var result = dataParser.parseNewContent(data[i], settings.link.targetSelector, settings.link.lastElement, settings.link.saveLastPoint);
                                resultData = resultData.concat(result);
                            }
                            if(!Array.isArray(settings.filePath)){
                                settings.filePath = [settings.filePath];
                            }
                            for(var i = 0; i < settings.filePath.length; i++){
                                if(i > 0){
                                    resultData = dataParser.shuffleArray(resultData);
                                }
                                fileManager.addNewArrayDataFile(resultData, settings.filePath[i])
                            }

                        }, function(error){
                            console.error(error);
                        })
                    }
                }, function(error){
                    console.error(error);
                }
            )
        }
        var task = schedule.scheduleJob(settings.times, process);
				this.jobs['contentStealer'] = [task];
    }

};

Scheduler.prototype.getPostFunction = function(key, settings){
	var that = this;
    return function(){
        var data = fileManager.readStringFromFile(settings.filePath);
        console.log(data);

        if (data){
            var newData = dataParser.parsePostString(data, settings.type);
            var request = that.telegramRequestManager.postData(key, newData, settings.type)
        }

    }
}

Scheduler.prototype.setTelegramPostTimer = function(channelsList){
    for (var key in channelsList){
				console.log(key);
        var settings = channelsList[key],
            times = settings.times;
				this.jobs[key]={};
        var post = this.getPostFunction(key, settings);
        for(var i = 0; i < times.length; i++){
            var time = this.parseTimeToCron(settings.times[i], '0-6');
            console.log('---', settings.times[i])
            var task = schedule.scheduleJob(time, post);
						this.jobs[key][settings.times[i]] = task;
        }
    }

};

Scheduler.prototype.removeLastPostTelegram = function(channelId, chat_id, host){
		var tasks = this.jobs[channelId];
		var keys = Object.keys(tasks);
		var lastKey = keys[keys.length-1];
		var task = keys[lastKey];
		var result = 'Не успешно'
		if(task && task.cancelNext){
			task.cancelNext(true);
			result = 'Успешно';
		}
		this.telegramRequestManager.botReply(host, chat_id, result)
}

Scheduler.prototype.getChannelsTimes = function(channelId, chat_id, host){
		var tasks = this.jobs[channelId];
		console.log(tasks);
		this.telegramRequestManager.botReply(host, chat_id, JSON.stringify(tasks))
}

Scheduler.prototype.listJobsCount = function(){
		var count = 0;
		for(var key in this.jobs){
				count += Object.keys(this.jobs[key]).length;
		}
    console.log('Tasks count: ', count)
}

Scheduler.prototype.cancelJobs = function(){
		if(this.jobs.length){
			for(var key in this.jobs){
				this.jobs[key].forEach(function(item){
						item.cancelJob();
				})
			}

		}
}

module.exports = Scheduler;

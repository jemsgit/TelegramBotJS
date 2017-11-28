var schedule = require('node-schedule'),
    fileManager = require('./fileManager'),
    dataParser = require('./dataParser'),
    constants = require('./constants');

function Scheduler(settings, mediator) {
    if(!mediator){
        throw new Error('No mediator was provided!')
    }

    this.mediator = mediator;
    this.jobs = {};
    this.customJobs = {};
}

Scheduler.prototype.jobs = null;

Scheduler.prototype.parseTimeToCron = function(timeString, periodic) {
    var time = timeString.split(':');
    return '12 ' + time[1] + ' ' + time[0] + ' * * ' + periodic
}

Scheduler.prototype.addPost = function(params){
    if(!params){
        return;
    }
    var posts = this.customJobs[params.channelId],
        timeParts = params.time.trim().split(':'),
        time,
        newData = dataParser.parsePostString(params.post, 'links');
        that = this;
    console.log(timeParts);
    if(!posts){
        this.customJobs[params.channelId] = {};
        posts = this.customJobs[params.channelId];
    }
    var month = timeParts[1] - 1;
    if(month !== month || month < 0){
        return;
    }
    time = new Date(timeParts[0], month, timeParts[2], timeParts[3], timeParts[4], 0);
    console.log(time);
    var task = schedule.scheduleJob(time, function() {
        var request = that.mediator.postTelegramData(params.channelId, newData, 'links')
    })
    posts[time] = task;
}

Scheduler.prototype.setPostTimer = function(type, params){
    if(type === constants.vk){
        this.setPublicsPostTimer(params);
    } else {
        this.setTelegramPostTimer(params);
    }
}

Scheduler.prototype.setPublicsPostTimer = function(publicsSettings) {
    var that = this;
    for (var publicItem in publicsSettings) {
        var settings = publicsSettings[publicItem];
        this.jobs[settings.publicId] = {}
        console.log(settings.publicId);
        for (var i = 0; i < settings.times.length; i++) {
            var time = this.parseTimeToCron(settings.times[i], '0-6');
            console.log('---', settings.times[i])
            var task = schedule.scheduleJob(time, function() {
                var postData = that.mediator.getDataFromDB(settings.filePath),
                    requestData;
                if (postData) {
                    requestData = dataParser.parsePostString(postData, settings.type);
                    if (requestData) {
                        that.mediator.postVkData(requestData, settings.publicId);
                        
                    }
                }

            })
            this.jobs[settings.publicId][settings.times[i]] = task
        }

    }
};

Scheduler.prototype.setContentStealerTimer = function(settings) {
    var that = this;
    if (settings.times && settings.modulePath) {
        var graberModule = require('../' + settings.modulePath)(settings, that.mediator);
        console.log(graberModule);
        
        var process = function() {
            console.log('prosc')
            graberModule.getContent();
        }

        var task = schedule.scheduleJob(settings.times, process);
        this.jobs['contentStealer'] = [task];
    }

};

Scheduler.prototype.getPostFunction = function(key, settings) {
    var that = this;
    return function() {
        var data = that.mediator.getDataFromDB(settings.filePath);
        if (data) {
            var newData = dataParser.parsePostString(data, settings.type);
            var request = that.mediator.postTelegramData(key, newData, settings.type)
        }

    }
}

Scheduler.prototype.setTelegramPostTimer = function(channelsList) {
    for (var key in channelsList) {
        console.log(key);
        var settings = channelsList[key],
            times = settings.times;
        this.jobs[key] = {};
        var post = this.getPostFunction(key, settings);
        for (var i = 0; i < times.length; i++) {
            var time = this.parseTimeToCron(settings.times[i], '0-6');
            console.log('---', settings.times[i])
            var task = schedule.scheduleJob(time, post);
            this.jobs[key][settings.times[i]] = task;
        }
    }

};

Scheduler.prototype.removeLastPost = function(params) {
    if(params && params.type === constants.telegram){
        var tasks = this.jobs[params.channelId];
        var keys = Object.keys(tasks);
        var lastKey = keys[keys.length - 1];
        var task = keys[lastKey];
        var result = 'Не успешно'
        if (task && task.cancelNext) {
            task.cancelNext(true);
            result = 'Успешно';
        }
        this.mediator.telegramBotReply(params.host, params.chat_id, result);
    }
    
}

Scheduler.prototype.getChannelsTimes = function(channelId, chat_id, host) {
    var tasks = this.jobs[channelId];
    console.log(tasks);
    this.mediator.telegramBotReply(host, chat_id, JSON.stringify(tasks));
}

Scheduler.prototype.getChannelsCutoms = function(channelId, chat_id, host) {
    var tasks = this.customJobs[channelId];
    console.log(tasks);
    this.mediator.telegramBotReply(host, chat_id, JSON.stringify(tasks))
}

Scheduler.prototype.listJobsCount = function() {
    var count = 0;
    for (var key in this.jobs) {
        count += Object.keys(this.jobs[key]).length;
    }
    console.log('Tasks count: ', count)
}

Scheduler.prototype.cancelJobs = function() {
    if (this.jobs.length) {
        for (var key in this.jobs) {
            this.jobs[key].forEach(function(item) {
                item.cancelJob();
            })
        }

    }
}

module.exports = Scheduler;

var fileManager = require('./fileManager'),
    dataBaseManager = require('./dataBaseManager'),
    events = require('./events');

function DataManager(params){
    if(!params){
        console.error('U should pass params to dataManager. Can\'t initialize');
        return;
    }
    if(params.dbType === 'files'){
        this.db = fileManager;
    }
    if(params.dbType === 'db'){
        console.log('db')
    }
    this.settings = params.settings;
	this.publics = params.publics;
	this.contentStealer = params.contentStealer;
	this.channels = params.channels;

    this.attachEvents();
}

DataManager.prototype.getCommonSettings = function(){
    var settings = fileManager.getSettings(this.settings),
        publics = fileManager.getSettings(this.publics),
        contentStealer = fileManager.getSettings(this.contentStealer),
        channels = fileManager.getSettings(this.channels);

    return {
		settings: settings,
		publicsList: publics,
		stealerSettings: contentStealer,
		channelsList: channels
    }
}

DataManager.prototype.db = null;

DataManager.prototype.attachEvents = function() {
    var that = this,
        settings = this.getCommonSettings()
    events.on('vote', function(params) {
        that.vote(params)
    });
    events.on('viewContent', function(params) {
        var currentSettings = settings.channelsList[params.channelId],
            result = that.viewContent(currentSettings.filePath, params.count, params.offset);
        if(params.callback){
            params.callback(result);
        }
    });
    events.on('deleteContent', function(params) {
        var currentSettings = settings.channelsList[params.channelId],
            result = that.deleteContentItems(currentSettings.filePath, params.content);
        if(params.callback){
            params.callback(result);
        }
    });
}

DataManager.prototype.getVotes = function(params) {
    return this.db.getVoteResults(params)
}

DataManager.prototype.vote = function(params) {
    return this.db.vote(params)
}

DataManager.prototype.viewContent = function(filePath, count, offset) {
    return this.db.viewContent(filePath, count, offset)
}

DataManager.prototype.deleteContentItems = function(filePath, content) {
    return this.db.deleteContentItems(filePath, content)
}

module.exports = DataManager;

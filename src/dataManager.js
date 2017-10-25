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
    this.attachEvents();
}

DataManager.prototype.getCommonSettings = function(params){
    if(!params){
        return null;
    }

    var settings = fileManager.getSettings(params.settingFile),
        publics = fileManager.getSettings(params.publicsFile),
        contentStealer = fileManager.getSettings(params.contentStealerFile),
        channels = fileManager.getSettings(params.channelsFile);

    return {
		settings: settings,
		publicsList: publics,
		stealerSettings: contentStealer,
		channelsList: channels
    }
}

DataManager.prototype.db = null;

DataManager.prototype.attachEvents = function() {
    var that = this;
    events.on('vote', function(params) {
        console.log(params)
        that.db.vote(params)
    });
}

DataManager.prototype.getVotes = function(params) {
    return this.db.getVoteResults(params)
}

module.exports = DataManager;

var app,
	dataManager = require('./dataManager'),
	events = require('./events'),
	PosterBot = require('./PosterBot')
	UserBot = require('./UserBot'),
	Scheduler = require('./scheduler'),
    TelegramRequstManager = require('./TelegramRequestManager'),
    VkRequestManager = require('./VkRequestManager');

app = {
	bots: {},

	requestManagers: {},

	attachEvents: function(){
		var that = this;
		events.on('vote', function(params) {
        	that.db.vote(params)
    	});
	},

	setup: function(){
		this.db = new dataManager({
			dbType: 'files',
			settings : './settings/settings.json',
			publics: './settings/vkpublic.json',
			contentStealer : './settings/contentStealer.json',
			channels : './settings/telegramchannel.json'
		})
		

		if(!this.db){
			return;
		}

		var commonSettings = app.db.getCommonSettings();

		if(!commonSettings || !commonSettings.settings){
			return;
		}

		this.requestManagers.vk = new VkRequestManager(commonSettings.settings.vkSettings);
		this.requestManagers.telegram = new TelegramRequstManager(commonSettings.settings.telegramSettings);

		this.scheduler = new Scheduler(commonSettings.settings, app);
		if(!this.scheduler){
			return;
		}
		this.bots.posterBot = new PosterBot(commonSettings, app);
		this.bots.posterBot.startBot();
		if(commonSettings.settings && commonSettings.settings.telegramSettings){
			this.bots.userBot = new UserBot(commonSettings.settings.telegramSettings, app);
			this.bots.userBot.startBot();
		}

		this.attachEvents();
	},

	getDataFromDB: function(path){
		var result;
		try{
			result = db.getDataItem(path);
		} catch(err){
			console.log(error);
		} finally{
			console.log(result)
			return result;
		}
	},

	getUserVotes: function(){
		return this.db.getVotes('./channels/votes.json');
	},

	telegramBotReply: function(host, chat_id, message){
		this.requestManagers.telegram.botReply(host, chat_id, message);
	},

	answerCallbackQuery: function(host, query_id, message){
		this.requestManagers.telegram.answerCallbackQuery(host, query_id, message);
	},

	editMessageReplyMarkup: function(host, chat_id, postId, keyboard){
		this.requestManagers.telegram.editMessageReplyMarkup(host, chat_id, postId, keyboard);
	},
	
	telegramBotPosData: function(channelId, data, type){
		this.requestManagers.telegram.postData(channelId, data, type);
	},

	getOldContentTitles: function(path){
		return this.db.getOldContentTitles(path);
	},

	addNewArrayData: function(data,path){
		return this.db.addNewArrayData(data,path);
	},

	postTelegramData: function(channel_id, data, type){
		this.requestManagers.telegram.postData(channel_id, data, type);
	},

	postVkData: function(post, publicId){
		this.requestManagers.vk.postData(post, publicId);
	},

	getChannelsTimes: function(channelId, chat_id, host){
		return this.scheduler.getChannelsTimes(channelId, chat_id, host);
	},

	getPostFunction: function(channelId, settings){
		return this.scheduler.getPostFunction(channelId, settings);
	},

	addPost: function(params){
		this.scheduler.addPost(params);
	},

	setPostTimer: function(type, params){
		this.scheduler.setPostTimer(type, params);
	},

	forcePost: function(params){
		this.bots.posterBot.forcePost(params);
	},

	viewContent: function(params){
		this.db.getContent(params);
	},

	removeLastPost: function(params){
		this.scheduler.removeLastPost(params);
	},

	setContentStealerTimer: function(params){
		this.scheduler.setContentStealerTimer(params);
	},

	listJobsCount: function(){
		this.scheduler.listJobsCount();
	},

	cancelScheduledJobs: function(){
		this.scheduler.cancelJobs();
	}

}

app.setup();


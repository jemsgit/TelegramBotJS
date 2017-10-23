var dataManager = require('./dataManager'),
		PosterBot = require('./PosterBot')
		UserBot = require('./UserBot');


var db = new dataManager({
			dbType: 'files'
		})

if(db){
	var commonSettings = db.getCommonSettings({
			settingFile : './settings/settings.json',
			publicsFile : './settings/vkpublic.json',
			contentStealerFile : './settings/contentStealer.json',
			channelsFile : './settings/telegramchannel.json'
		});

	
	if(!commonSettings){
		return;
	}
	console.log(commonSettings)
	var posterBot = new PosterBot(commonSettings);
	posterBot.startBot();

	if(commonSettings.settings.telegramSettings){
		var votes = db.getVotes('./channels/votes.json');
		var userBot = new UserBot(commonSettings.settings.telegramSettings, votes);
		userBot.startBot();
	}
}
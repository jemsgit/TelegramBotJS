var dataManager = require('./dataManager'),
		PosterBot = require('./PosterBot')
		UserBot = require('./UserBot');


var db = new dataManager({
			dbType: 'files',
			settings : './settings/settings.json',
			publics: './settings/vkpublic.json',
			contentStealer : './settings/contentStealer.json',
			channels : './settings/telegramchannel.json'
		})

if(db){
	var commonSettings = db.getCommonSettings();

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
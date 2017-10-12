var fileManager = require('./fileManager'),
		PosterBot = require('./PosterBot')
		UserBot = require('./UserBot');


var settingFile = './settings/settings.json',
		publicsFile = './settings/vkpublic.json',
		contentStealerFile = './settings/contentStealer.json',
		channelsFile = './settings/telegramchannel.json'
		settings = fileManager.readDataFromJson(settingFile),
		publicsList = fileManager.readDataFromJson(publicsFile),
		stealerSettings = fileManager.readDataFromJson(contentStealerFile),
		channelsList = fileManager.readDataFromJson(channelsFile);

if(settings){
	var commonSettings = {
		settings: settings,
		publicsList: publicsList,
		stealerSettings: stealerSettings,
		channelsList: channelsList
	}

	var posterBot = new PosterBot(commonSettings);
	posterBot.startBot();

	if(settings.telegramSettings){
		var userBot = new UserBot(settings.telegramSettings);
		userBot.startBot();
	}
}

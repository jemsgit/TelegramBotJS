var fileManager = require('./fileManager');

var service = {}

var posts = {};

function getChannelPostResults(channel_id, post_id){
    var channelVotes = posts[channel_id],
        posts
    if(!channelVotes){
        channelVotes = {};
        posts[channel_id] = channelVotes;
        channelVotes[post_id] = {};
    }
    posts = channelVotes[post_id];
    if(!posts){
        posts = {}
    }
    return posts;
}

function deleteVoiceFromOtherGroup(voices, user_Id){
    var results,
        index;
    for(var key in voices){
        results = voices[key];
        if(results){
            index = results.indexOf(user_Id);
            if(index > -1){
                results.splice(index, 1);
                break;
            }
        }
    }
}

function addUserVoice(voices, user_Id){
    voices.push(user_Id);
}

function voteUser(user_Id, channel_id, post_id, voice){
    var votes = getChannelPostResults(channel_id, post_id);
    var voices = votes[voice];
    if(!voices){
        voices = []
        votes[voice] = voices;
    }
    if(voices.indexOf(user_Id) > -1){
        return 'Вы уже голосовали';
    } else {
        deleteVoiceFromOtherGroup(votes, user_Id);
        addUserVoice(voices, user_Id);
        return 'Ваш голос учтен';
    }
}

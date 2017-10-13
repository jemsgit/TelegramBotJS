var fileManager = require('./fileManager');

var service = {}
var posts = {};

function getChannelPostResults(channel_id, post_id) {
    var channelVotes = posts[channel_id],
        currentPosts;
    if (!channelVotes) {
        channelVotes = {};
        posts[channel_id] = channelVotes;
        channelVotes[post_id] = {};
    }
    currentPosts = channelVotes[post_id];
    if (!currentPosts) {
        currentPosts = {}
    }
    return currentPosts;
}

function deleteVoiceFromOtherGroup(votes, user_Id) {
    var results,
        index;
    for (var key in votes) {
        results = votes[key];
        if (results) {
            index = results.indexOf(user_Id);
            if (index > -1) {
                results.splice(index, 1);
                break;
            }
        }
    }
}

function addUserVoice(voices, user_Id) {
    voices.push(user_Id);
}

function getVotesCounts(votes) {
    var results = {}
    for (var key in votes) {
        results[key] = votes[key].length;
    }
    return results;
}

function voteUser(user_Id, channel_id, post_id, voice) {
    var votes = getChannelPostResults(channel_id, post_id),
        voices = votes[voice],
        message,
        counts,
        result;
    if (!voices) {
        voices = []
        votes[voice] = voices;
    }
    if (voices.indexOf(user_Id) > -1) {
        message = 'Вы уже голосовали';
        result = false;
    } else {
        deleteVoiceFromOtherGroup(votes, user_Id);
        addUserVoice(voices, user_Id);
        message = 'Ваш голос учтен';
        counts = getVotesCounts(votes);
        result = true;
    }
    return {
        message: message,
        counts: counts,
        status: result
    }
}

service.voteUser = voteUser;
module.exports = service;

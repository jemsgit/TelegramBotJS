var constants = require('./constants'),
	_ = require('lodash'),
	shuffle = require('lodash.shuffle'),
    jsdom = require('jsdom').jsdom,
	myWindow = jsdom().defaultView, 
	$ = require('jquery')(myWindow);

module.exports = {
	parsePostString: function(postData, postType){
		var dataList,
			result;
		switch(postType){
			case constants.links:
				dataList = postData.split(' ');
				result = {
					link: dataList.splice(0,1)[0],
					message: dataList.join(' ')
				};
				break;
			default:
				result = {
				    message: postData
                };
		}
		return result;
	},
	parseTitles: function(body, titles, q){
		var items = $(body).find('.post__title_link');
		items = _.map(items,function(el){
			el = $(el); 
			if(el.text().indexOf(q) > -1 ){
				return $(el).attr('href');
			}else {
				return null;
			}
		});
		items = _.filter(items, function(el){return el !== null});
		var newPosts = _.difference(items,titles);
		return newPosts;
	},
	parseNewContent: function(body, targetSelector, lastElement, saveLastPointText){
		var $body = $(body),
			items = $body.find(":not(iframe)").contents().filter(function() {
				return this.nodeType == 3 && this.wholeText.indexOf("•") > -1 ;
			}),
			arr = [],
			resultArr = [];

		items.each(function(index, item){
			var result = {};
			result.text = ''
			var next = item.nextSibling
			var i = 0;
			while((next && next.nodeName !== 'BR') && i < 7){ //i is for safety
				if(next.nodeName === "A"){
					result.link = next.href;
					result.text += ' ' + next.textContent;
				} else if(next.nodeName === '#text'){
					result.text += ' ' + next.textContent;
				}
				next = next.nextSibling;
				i++;
			}
			result.text = result.text.trim();
			arr.push(result);
		})


        for (var i = 0; i < arr.length; i++) {
            resultArr.push(arr[i].link + ' ' + arr[i].text)
        }
        resultArr = this.shuffleArray(resultArr);
        console.log('Get New Content --- ', resultArr.length);

	    return resultArr;
	},

	shuffleArray: function(data){
		return shuffle(data);
	}
}
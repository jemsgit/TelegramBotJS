 var fs = require("fs"),
	_ = require('lodash');

function FileManager(){
	console.log('FileManager created')
}

FileManager.prototype.readDataFromFile = function(path){
    var content = null;

    try{
        var content = fs.readFileSync(path, 'utf8');
    } catch (error){
        console.error(error);
    }
    return content;
}

 FileManager.prototype.readDataFromJson = function(path){
     var content = this.readDataFromFile(path);

     try{
         content = JSON.parse(content);
     } catch (error){
         console.error(error);
     }
     return content;
 }

 FileManager.prototype.readStringFromFile = function(filePath){
     var result = this.readDataFromFile(filePath);
     if(result){
         var lines = result.split('\r\n'),
             result = lines.splice(0,1)[0];
         fs.writeFileSync(filePath, lines.join('\r\n'));
     }

     return result;

 }

 FileManager.prototype.getOldTitlesFromFile = function(filePath){
     var result = this.readDataFromFile(filePath),
         lines = [];
     if(result){
         lines = result.split('\r\n');
     }
     return lines;
 }

 FileManager.prototype.addNewArrayDataFile = function(newData, filePath){
     var result = this.readDataFromFile(filePath);
     if(result){
         var lines = result.split('\r\n');
         lines = newData.concat(lines);
         fs.writeFileSync(filePath, lines.join('\r\n'));
     }
 }

var fileManager = new FileManager();

module.exports = fileManager;

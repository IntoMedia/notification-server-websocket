#!/usr/bin/env nodejs
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var OneSignal = require('onesignal-node');

require('dotenv').config();


var activeUsers = {};


function createPush(type,title,msg,url,to){
	
	var filter = [];
	
	if(to.method=='personal'){
		filter = [
			{"field": "tag", "key": "user", "relation": "=", "value": to.user}
		];
	}else if(to.method=='group'){
		filter = [
			{"field": "tag", "key": "group_"+to.type+"_"+to.name, "relation": "=", "value": true}
		];
		for (var i=0;i<to.notSend.length;i++){
			filter.push({"field": "tag", "key": "user", "relation": "!=", "value": to.notSend[i]});
		}
	}
	
	
	var PushNotification = new OneSignal.Notification({ 
		contents: {    
			en: msg
		},
		headings: {
			en: title
		},
		data:{
			"type":type
		},
		web_url: url,
		filters: filter
	});
	
	oneSignalClient.sendNotification(PushNotification, function (err, httpResponse,data) {    
		if(err){ 
			console.log('Something went wrong...');    
		}else{
			console.log(data, httpResponse.statusCode);    
		}
	});
}


var oneSignalClient = new OneSignal.Client({
	userAuthKey: process.env.ONE_SIGNAL_USERAUTHKEY,    
	app: { appAuthKey: process.env.ONE_SIGNAL_APPAUTHKEY, appId: process.env.ONE_SIGNAL_APPID }    
});

app.get('/', function(req, res){
	res.send('<h1>Hello world</h1>');
});


app.get('/send/:method/:type', function(req, res){
	
	var resdata = {};
	
	if(process.env.ACCESS_CODE != req.query.code){
		resdata.error = true;
		resdata.message = 'ACCESS FORBIDDEN';
	}else{
		
		if(req.params.method=='personal'){
			var ok = false;
			var user = req.query.user;
			for (var u in activeUsers){
				if(activeUsers[u].user==user){
					if(activeUsers[u].active){
						ok = true;
					}
					
					io.sockets.connected[u].emit(req.params.type, {msg:req.query.msg,title:req.query.title,url:req.query.url});
				}
			}
			if(!ok){
				createPush(req.params.type,req.query.title,req.query.msg,req.query.url,{method:'personal',user:user});
			}
			
			resdata.success = true;
		}else if(req.params.method=='group'){
			var notSend = [];
			
			var group_type = req.query.type;
			var group_name = req.query.name;
			
			for (var u in activeUsers){
				if(activeUsers[u].groups[group_type][group_name] != undefined){
					if(activeUsers[u].active){
						notSend.push(activeUsers[u].user);
					}
					
					io.sockets.connected[u].emit(req.params.type, {msg:req.query.msg,title:req.query.title,url:req.query.url});
				}
			}
			
			createPush(req.params.type,req.query.title,req.query.msg,req.query.url,{method:'group',type:group_type,name:group_name,notSend:notSend});
			
			resdata.success = true;
		}else{
			resdata.error = true;
			resdata.message = 'WRONG METHOD';
		}
		
		//io.emit(req.params.type, req.query.msg);
	}
	
	res.send(JSON.stringify(resdata));
});


io.on('connection', function(socket){
	console.log('a user connected');
	console.log(socket.request._query['user']);
	console.log(socket.id);
	
	var data = {
		user:socket.request._query['user'],
		active:true
	};
	
	activeUsers[socket.id] = data;
	
	socket.on('disconnect', function(){
		console.log('user disconnected');
		delete activeUsers[socket.id];
		
		console.log(activeUsers);
	});
	
});

http.listen(process.env.SETPORT, function(){
	console.log('listening on *:'+process.env.SETPORT);
});
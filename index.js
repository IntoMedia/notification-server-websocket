#!/usr/bin/env nodejs
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var OneSignal = require('onesignal-node');
var Users = require('./lib/Users');
var Notifications = require('./lib/Notifications');

require('dotenv').config();

app.use(express.json());


const users = new Users(io);
const notifications = new Notifications(io,OneSignal);




app.get('/', function(req, res){
	res.send('Working.. https://github.com/IntoMedia/notification-server-websocket');
});

app.get('/addgroups', function(req, res){
	var resdata = {};
	
	resdata.error = true;
	resdata.message = 'WRONG HTTP METHOD!';
	
	res.send(JSON.stringify(resdata));
});

app.post('/addgroups', function(req, res){
	var resdata = {success:false};
	
	if(process.env.ACCESS_CODE != req.body.code){
		resdata.error = true;
		resdata.message = 'ACCESS FORBIDDEN';
	}else{
		resdata.success = true; 
		
		users.addUserGroups(req.body.user,req.body.groups);
	}
	
	res.send(JSON.stringify(resdata));
});


app.get('/send/:method/:type', function(req, res){
	
	var resdata = {};
	
	if(process.env.ACCESS_CODE != req.query.code){
		resdata.error = true;
		resdata.message = 'ACCESS FORBIDDEN';
	}else{
		
		var ok = false;
		
		if(req.params.type=='notification'){
			var message = {
				type:req.params.type,
				msg:req.query.msg,
				title:req.query.title,
				url:req.query.url,
				image:req.query.image
			};
			
			ok = true;
		}else if(req.params.type=='event'){
			
			delete req.query.code;
			var event = req.query.event;
			delete req.query.event;
			
			var message = {
				type:req.params.type,
				event:event,
				data:req.query
			};
			
			ok = true;
		}
		
		if(ok){
		
			if(req.params.method=='personal'){
				var user = req.query.user;
				var status = users.getUserStatus(user);


				notifications.personal(user,status,message);


				resdata.success = true;
			}else if(req.params.method=='group'){
				var group_type = req.query.type;
				var group_name = req.query.name;

				var data = users.getUsersByGroup(group_type,group_name);

				notifications.group(group_type,group_name,data,message);

				resdata.success = true;
			}else{
				resdata.error = true;
				resdata.message = 'WRONG METHOD';
			}
		}else{
			resdata.error = true;
			resdata.message = 'WRONG TYPE';
		}
		//io.emit(req.params.type, req.query.msg);
	}
	
	res.send(JSON.stringify(resdata));
});


io.on('connection', function(socket){
	var data = users.addSession(socket.id,socket.request._query['user']);
	
	if(data.requireInformations){
		socket.emit('requireInformations',true);
	}
	
	socket.on('disconnect', function(){
		users.removeSession(socket.id);
	});
	
});

http.listen(process.env.PORT, function(){
	console.log('listening on *:'+process.env.PORT);
});
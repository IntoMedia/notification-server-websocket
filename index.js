#!/usr/bin/env nodejs
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var OneSignal = require('onesignal-node');
var Users = require('./lib/Users');
var Notifications = require('./lib/Notifications');

require('dotenv').config();


const users = new Users();


var activeUsers = {};


const notifications = new Notifications(io,OneSignal);




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
			var user = req.query.user;
			var status = users.getUserStatus(user);
			
			var message = {
				type:req.params.type,
				msg:req.query.msg,
				title:req.query.title,
				url:req.query.url
			};
			notifications.personal(user,status,message);
			
			
			resdata.success = true;
		}else if(req.params.method=='group'){
			var group_type = req.query.type;
			var group_name = req.query.name;
			
			var data = users.getUsersByGroup(group_type,group_name);
			
			
			var message = {
				type:req.params.type,
				msg:req.query.msg,
				title:req.query.title,
				url:req.query.url
			};
			
			notifications.group(group_type,group_name,data,message);
			
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
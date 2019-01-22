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

function sendMethod(req,data){
	var resdata = {};
	if(process.env.ACCESS_CODE != data.code){
		resdata.error = true;
		resdata.message = 'ACCESS FORBIDDEN';
	}else{
		
		var ok = false;
		
		if(req.params.type=='notification'){
			var message = {
				msg:data.msg,
				title:data.title,
				url:data.url,
				image:data.image
			};
            
            var type = req.params.type;
			
			ok = true;
		}else if(req.params.type=='event'){
			
			delete data.code;
			var event = data.event;
			delete data.event;
					
			var type = req.params.type;
			
			var message = {
				event:event,
				data:data
			};
			
			ok = true;
		}
		
		if(ok){
		
			if(req.params.method=='personal'){
				if(Array.isArray(data.user)){
					for (var i=0;i<data.user.length;i++){
						var user = data.user[i];
						var status = users.getUserStatus(user);
						var a = notifications.personal(user,status,message,type);
					}
				}else{
					var user = data.user;
					var status = users.getUserStatus(user);


					notifications.personal(user,status,message,type);
				}

				resdata.success = true;
			}else if(req.params.method=='group'){
				var group_type = data.type;
				var group_name = data.name;

				var data = users.getUsersByGroup(group_type,group_name);

				notifications.group(group_type,group_name,data,message,type);

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
	
	return resdata;
}

app.post('/send/:method/:type', function(req, res){
	var resdata = sendMethod(req,req.body);
	res.send(JSON.stringify(resdata));
});

app.get('/send/:method/:type', function(req, res){
	var resdata = sendMethod(req,req.query);
	res.send(JSON.stringify(resdata));
});


io.on('connection', function(socket){
	var data = users.addSession(socket.id,socket.request._query['user'],socket.request._query['status']);
	
	if(data.requireInformations){
		socket.emit('requireInformations',true);
	}
	
	socket.on('status', function(status){
		users.setStatus(socket.id,status);
	});
	
	socket.on('disconnect', function(){
		users.removeSession(socket.id);
	});
	
	socket.on('event', function(data){
		var user = data.user;
		var status = users.getUserStatus(user);
		data.type = 'clientevent';
		notifications.personal(user,status,data);
	});
	
});

http.listen(process.env.PORT, function(){
	console.log('listening on *:'+process.env.PORT);
});

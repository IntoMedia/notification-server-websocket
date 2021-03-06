module.exports = class Notifications {
	
	constructor(io,OneSignal){
		this.io = io;
		this.OneSignal = OneSignal;
		
		this.createOneSignalClient();
	}
	
	createOneSignalClient(){
		this.oneSignalClient = new this.OneSignal.Client({
			userAuthKey: process.env.ONE_SIGNAL_USERAUTHKEY,    
			app: { appAuthKey: process.env.ONE_SIGNAL_APPAUTHKEY, appId: process.env.ONE_SIGNAL_APPID }    
		});
	}
	
	
	
	personal(user,status,message,type){
		
		for (var s in status.sessions){
			this.io.sockets.connected[s].emit(type,message);
             console.log('sended to '+s+' - '+type);
		}
        console.log('sended to '+user);
		
		if(!status.active){
			this.createPush(type,message.title,message.msg,message.url,{method:'personal',user:user});
		}
		
		return true;
	}
	
	
	group(g_type,g_name,data,message,type){
		
		/*
		for (var s in data.sessions){
			this.io.sockets.connected[s].emit(type,message);
		}
		*/
		this.io.sockets.in(g_type+'_'+g_name).emit(type,message);
		
		this.createPush(type,message.title,message.msg,message.url,{method:'group',type:g_type,name:g_name,notSend:data.activeUsers});
		
	}
	
	
	
	
	
	
	
	createPush(type,title,msg,url,to){
	
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


		var PushNotification = new this.OneSignal.Notification({
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

		this.oneSignalClient.sendNotification(PushNotification, function (err, httpResponse,data) {    
			if(err){ 
				console.log('Something went wrong...');    
			}else{
				console.log(data, httpResponse.statusCode);    
			}
		});
	}
};

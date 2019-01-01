module.exports = class Users {
	
	constructor(io){
		this.io = io;
		
		this.activeUsers = {};
		this.activeSessions = {};
		this.groups = [];
	}
	
	addSession(id,user){
		var newUser = false;
		if(this.activeUsers[user] == undefined){
			this.activeUsers[user] = {
				sessions: {},
				groups:[]
			};
			
			newUser = true;
		}
		this.activeUsers[user].sessions[id] = {active:true};
		
		this.activeSessions[id] = user;
		
		if(!newUser){
			for(var g_type in this.activeUsers[user].groups){
				for(var i=0;i<this.activeUsers[user].groups[g_type].length;i++){
						this.io.sockets.connected[id].join(g_type+'_'+this.activeUsers[user].groups[g_type][i]);
				}
			}
		}
		
		return {success:true,requireInformations:newUser};
	}
	
	
	removeSession(id){
		delete this.activeUsers[this.activeSessions[id]].sessions[id];
		
	
		if(Object.keys(this.activeUsers[this.activeSessions[id]].sessions).length==0){
		   delete this.activeUsers[this.activeSessions[id]];
		}
		
		delete this.activeSessions[id];
	}
	
	addUserGroups(user,groups){
		for (var i in groups){
			var g = groups[i];
			if(this.groups[g.type] == undefined){
			   this.groups[g.type] = [];
			}
			if(this.groups[g.type][g.name] == undefined){
			   this.groups[g.type][g.name] = [];
			}
			this.groups[g.type][g.name].push(user);
			
			if(this.activeUsers[user].groups[g.type] == undefined){
				this.activeUsers[user].groups[g.type] = [];
			}
			
			this.activeUsers[user].groups[g.type].push(g.name);
			
			for(var s in this.activeUsers[user].sessions){
				this.io.sockets.connected[s].join(g.type+'_'+g.name);
			}
		}
	}
	
	
	getUserStatus(user){
		if(this.activeUsers[user] == undefined){
			return {active:false,sessions:{}};
		}
		
		for (var s in this.activeUsers[user].sessions){
			if(this.activeUsers[user].sessions[s].active){
			   return {active:true,sessions:this.activeUsers[user].sessions,activeSession:s};
			   break;
			}
		}
		
		return {active:false,sessions:this.activeUsers[user].sessions};
	}
	
	
	getUsersByGroup(type,name){
		if(this.groups.length==0 || this.groups[type] == undefined || this.groups[type][name] == undefined){
		   return {inactiveUsers:[],activeUsers:[]};
		}
		
		var inactiveUsers = [];
		var activeUsers = [];
		
		for(var i=0;i<this.groups[type][name].length;i++){
			var u = this.groups[type][name][i];
			var status = this.getUserStatus(u);
			if(status.active){
			   activeUsers.push(u);
			}else{
				inactiveUsers.push(u);
			}
		}
		
		return {inactiveUsers:inactiveUsers,activeUsers:activeUsers};
	}
	
};
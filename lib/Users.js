module.exports = class Users {
	
	constructor(){
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
		for (var g in groups){
			if(this.groups[g.type] == undefined){
			   this.groups[g.type] = [];
			}
			if(this.groups[g.type][g.name] == undefined){
			   this.groups[g.type][g.name] = [];
			}
			this.groups[g.type][g.name].push(user);
			
			if(his.activeUsers[user].groups[g.type] == undefined){
				this.activeUsers[user].groups[g.type] = [];
			}
			
			this.activeUsers[user].groups[g.type].push(g.name);
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
		if(this.groups.length==0){
		   return {inactiveUsers:{},activeUsers:{},sessions:{}};
		}
	}
	
};
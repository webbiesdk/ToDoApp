/// <reference path="jquery.d.ts" />

interface ServerCallObject {
    callback(data: any): Function;
    errorCallback? (data: String): Function;
}
// Any call that requires the user to login. 
interface ServerLoginObject {
    invalidLoginData?(): Function;
}

interface CreateUserObject extends ServerCallObject {
    username: String;
    password: String;
    remember?: bool;
    usernameInUserCallback(): Function;
}
interface LoginObject extends ServerCallObject, ServerLoginObject {
    username: String;
    password: String;
    remember?: bool;
}

interface LogoutObject extends ServerCallObject { }

interface DeleteNoteObject extends ServerCallObject, ServerLoginObject {
    id: string;
}

interface AddNoteObject extends ServerCallObject, ServerLoginObject {}

interface SaveNoteObject extends ServerCallObject, ServerLoginObject { 
    id: string; 
    content: String;
}

interface CheckLoginObject extends ServerCallObject, ServerLoginObject {

}

interface GetNotesObject extends ServerCallObject, ServerLoginObject {

}

class Server {
    constructor (private serverPath: string) { };
    private post(data: any, callback: Function, errorCallback: Function) {
        $.post(this.serverPath, data, callback).error(function () { 
            errorCallback();
        });
    }
    public createUser(obj: CreateUserObject) {
        this.post({ createUser: obj.username, password: obj.password, remember: obj.remember }, function (data) {
            if (data == 1) {
                if ($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            }
            else if (data == 2) {
                if ($.isFunction(obj.usernameInUserCallback)) {
                    obj.usernameInUserCallback();
                }
            }
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to create user: " + data);
                }
            }
        }, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public login(obj: LoginObject) {
        this.post({ login: obj.username, password: obj.password, remember: obj.remember }, function (data) {
            if (data == 1) {
                if ($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            }
            else if (data == 3) {
                if ($.isFunction(obj.invalidLoginData)) {
                    obj.invalidLoginData();
                }
            }
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to login: " + data);
                }
            }
        }, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public logOut(obj: LogoutObject) {
        this.post({ logout: "ehhhh, here goes nothing" },
		function(data) {
			if (data == 1)
			{
				if ($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
			}
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to logut: " + data);
                }
            }
		}, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public deleteNote(obj: DeleteNoteObject) {
        this.post({ deleteNote: obj.id }, function (data) {
            if (data == 1) {
                if ($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            }
            else if (data == 3) {
                if ($.isFunction(obj.invalidLoginData)) {
                    obj.invalidLoginData();
                }
            }
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to delete note(" + obj.id + "): " + data);
                }
            }
        }, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public addNote(obj: AddNoteObject) {
        this.post({ newNote: "Nothing here"}, function (data) {

            if (data.slice(0,1) == 1) {
                if ($.isFunction(obj.callback)) {
                    obj.callback(data.slice(1, data.length));
                }
            }
            else if (data == 3) {
                if ($.isFunction(obj.invalidLoginData)) {
                    obj.invalidLoginData();
                }
            }
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to add note: " + data);
                }
            }
        }, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public saveNote(obj: SaveNoteObject) {
        this.post({ save: obj.id, content : obj.content }, function (data) {
            if (data == 1) {
                if ($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            }
            else if (data == 3) {
                if ($.isFunction(obj.invalidLoginData)) {
                    obj.invalidLoginData();
                }
            }
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to save note(" + obj.id + "): " + data);
                }
            }
        }, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public checkLogin(obj: CheckLoginObject) {
        this.post({ Checklogin: "ehhhh, here goes nothing" },
		function(data) {
			if (data != 3)
			{
				if ($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
			}
            else {
                if ($.isFunction(obj.errorCallback)) {
                    obj.invalidLoginData();
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to checklogin: " + data);
                }
            }
		}, function (data) {
            if ($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    }
    public getNotes(obj: GetNotesObject) {
        // Cannot just use post on this one, got to handle JSON
        $.ajax({
			type: 'POST',
			url: this.serverPath,
			data: { get: 'content'},
			dataType: 'json',
			error: function(data) {
				if ($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                }
                else {
                    console.log("Unhandled error/unknown data from server when trying to get notes: " + data);
                }
			},
			success: function(data) {
				if (data != '3')
				{
					if ($.isFunction(obj.callback)) {
                        obj.callback(data);
                    }
				}
				else
				{
					if ($.isFunction(obj.invalidLoginData)) {
                        obj.invalidLoginData();
                    }
				}
			}
		});
    }
}
var Server = (function () {
    function Server(serverPath) {
        this.serverPath = serverPath;
    }
    Server.prototype.post = function (data, callback, errorCallback) {
        $.post(this.serverPath, data, callback).error(function () {
            errorCallback();
        });
    };
    Server.prototype.createUser = function (obj) {
        this.post({
            createUser: obj.username,
            password: obj.password,
            remember: obj.remember
        }, function (data) {
            if(data == 1) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            } else {
                if(data == 2) {
                    if($.isFunction(obj.usernameInUserCallback)) {
                        obj.usernameInUserCallback();
                    }
                } else {
                    if($.isFunction(obj.errorCallback)) {
                        obj.errorCallback(data);
                    } else {
                        console.log("Unhandled error/unknown data from server when trying to create user: " + data);
                    }
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.login = function (obj) {
        this.post({
            login: obj.username,
            password: obj.password,
            remember: obj.remember
        }, function (data) {
            if(data == 1) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            } else {
                if(data == 3) {
                    if($.isFunction(obj.invalidLoginData)) {
                        obj.invalidLoginData();
                    }
                } else {
                    if($.isFunction(obj.errorCallback)) {
                        obj.errorCallback(data);
                    } else {
                        console.log("Unhandled error/unknown data from server when trying to login: " + data);
                    }
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.logOut = function (obj) {
        this.post({
            logout: "ehhhh, here goes nothing"
        }, function (data) {
            if(data == 1) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            } else {
                if($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                } else {
                    console.log("Unhandled error/unknown data from server when trying to logut: " + data);
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.deleteNote = function (obj) {
        this.post({
            deleteNote: obj.id
        }, function (data) {
            if(data == 1) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            } else {
                if(data == 3) {
                    if($.isFunction(obj.invalidLoginData)) {
                        obj.invalidLoginData();
                    }
                } else {
                    if($.isFunction(obj.errorCallback)) {
                        obj.errorCallback(data);
                    } else {
                        console.log("Unhandled error/unknown data from server when trying to delete note(" + obj.id + "): " + data);
                    }
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.addNote = function (obj) {
        this.post({
            newNote: "Nothing here"
        }, function (data) {
            if(data.slice(0, 1) == 1) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data.slice(1, data.length));
                }
            } else {
                if(data == 3) {
                    if($.isFunction(obj.invalidLoginData)) {
                        obj.invalidLoginData();
                    }
                } else {
                    if($.isFunction(obj.errorCallback)) {
                        obj.errorCallback(data);
                    } else {
                        console.log("Unhandled error/unknown data from server when trying to add note: " + data);
                    }
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.saveNote = function (obj) {
        this.post({
            save: obj.id,
            content: obj.content
        }, function (data) {
            if(data == 1) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            } else {
                if(data == 3) {
                    if($.isFunction(obj.invalidLoginData)) {
                        obj.invalidLoginData();
                    }
                } else {
                    if($.isFunction(obj.errorCallback)) {
                        obj.errorCallback(data);
                    } else {
                        console.log("Unhandled error/unknown data from server when trying to save note(" + obj.id + "): " + data);
                    }
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.checkLogin = function (obj) {
        this.post({
            Checklogin: "ehhhh, here goes nothing"
        }, function (data) {
            if(data != 3) {
                if($.isFunction(obj.callback)) {
                    obj.callback(data);
                }
            } else {
                if($.isFunction(obj.errorCallback)) {
                    obj.invalidLoginData();
                } else {
                    console.log("Unhandled error/unknown data from server when trying to checklogin: " + data);
                }
            }
        }, function (data) {
            if($.isFunction(obj.errorCallback)) {
                obj.errorCallback(data);
            }
        });
    };
    Server.prototype.getNotes = function (obj) {
        // Cannot just use post on this one, got to handle JSON
        $.ajax({
            type: 'POST',
            url: this.serverPath,
            data: {
                get: 'content'
            },
            dataType: 'json',
            error: function (data) {
                if($.isFunction(obj.errorCallback)) {
                    obj.errorCallback(data);
                } else {
                    console.log("Unhandled error/unknown data from server when trying to get notes: " + data);
                }
            },
            success: function (data) {
                if(data != '3') {
                    if($.isFunction(obj.callback)) {
                        obj.callback(data);
                    }
                } else {
                    if($.isFunction(obj.invalidLoginData)) {
                        obj.invalidLoginData();
                    }
                }
            }
        });
    };
    return Server;
})();

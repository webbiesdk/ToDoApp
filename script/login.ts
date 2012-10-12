/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
/// <reference path="savehandler.ts" />
/// <reference path="keyboard.ts" />
class LoginHandler {
    private logInButton: JQuery;
    private logOutButton: JQuery;
    private createUserButton: JQuery;
    private goOnlineButton: JQuery;
    private status = 2; // 1 == logged in, 2 == logged out, 3 == offline. 
    private username;
    private loggedInCallback: Function; 
    private aniTime: number = 300;
    constructor (private savehandler: SaveHandler, private server : Server) {
        var that = this;
        // The buttons. 
        this.logInButton = $("#LogInButton");
        this.logInButton.click(function () {
            setTimeout(function () { that.logInButton.removeClass("ui-btn-active"); }, 100);
        });
        this.logOutButton = $("#LogOutButton");
        this.logOutButton.click(function () {
            server.logOut({
                callback: function (data) {
                    console.log("Logged out: " + data);
                    that.checkLogIn();
                }, 
                errorCallback: function () {
                    that.isOffline();
                }
            });
        });
        this.createUserButton = $("#CreateUserButton");
        this.createUserButton.click(function () {
            setTimeout(function () { that.createUserButton.removeClass("ui-btn-active"); }, 100);
        });
        this.goOnlineButton = $("#GoOnlineButton");
        this.goOnlineButton.click(function () {
            that.checkLogIn();
        });

        // The login form. 
        $("#loginSubmitButton").click(function () {
            var form = $("#logInForm");
            var loader = $("<p style='text-align:center'>Loading...</p>");
            form.children().append(loader);
            loader.trigger("create");
            var username = form.find(".username").val();
            var password = form.find(".password").val();
            var remember = !!form.find(".remember").attr("checked");
            server.login({
                username: username,
                password: password,
                remember: remember,
                callback: function (data) {
                    that.username = username;
                    loader.remove();
                    $("#LoginPopup").popup("close");
                    that.setStatus(1);
                },
                invalidLoginData: function () {
                    that.setStatus(2);
                    loader.text("Invalid login data");
                    form.find(".password").val("");
                    setTimeout(function () { 
                        loader.slideUp(400, function () {
                            loader.remove();
                        });
                    }, 5000);
                }, 
                errorCallback: function (data) {
                    loader.text("Server error: " + data);
                    setTimeout(function () { 
                        loader.slideUp(400, function () {
                            loader.remove();
                        });
                        $("#LoginPopup").popup("close");
                        that.isOffline();
                    }, 5000);
                }
            });
            return false;
        });
        $("#createUserSubmitButton").click(function () {
            var form = $("#createUserForm");
            var loader = $("<p style='text-align:center'>Loading...</p>");
            form.children().append(loader);
            loader.trigger("create");
            var username = form.find(".username").val();
            var password = form.find(".password").val();
            var password2 = form.find(".password2").val();
            var remember = !!form.find(".remember").attr("checked");
            if (password == password2) {
                server.createUser({
                    username: username,
                    password: password,
                    remember: remember, 
                    callback: function () {
                        that.username = username;
                        loader.remove();
                        $("#CreateUserPopup").popup("close");
                        that.setStatus(1);
                    }, 
                    usernameInUserCallback: function () {
                        that.setStatus(2);
                        loader.text("Username already used");
                        form.find(".username").val("");
                        setTimeout(function () { 
                            loader.slideUp(400, function () {
                                loader.remove();
                            });
                        }, 5000);
                    }, 
                    errorCallback: function (data) {
                        loader.text("Server error: " + data);
                        setTimeout(function () { 
                            loader.slideUp(400, function () {
                                loader.remove();
                            });
                            $("#CreateUserPopup").popup("close");
                            that.isOffline();
                        }, 5000);
                    }
                });
            }
            else {
                loader.text("The passwords doesn't match");
                form.find(".password").val("");
                form.find(".password2").val("");
                setTimeout(function () { 
                    loader.slideUp(400, function () {
                        loader.remove();
                    });
                }, 1000);
            }
            return false;
        });
        // TODO: createuserform. 

        
        this.setStatus(2);
        this.checkLogIn();
    }
    public getUsername() {
        if (this.status != 1) {
            throw "Invalid call, we are not logged in!";
        }
        return this.username;
    }
    public callWhenLoggedIn(callback : Function) {
        this.loggedInCallback = callback;
    }
    public isOffline() {
        this.setStatus(3);
    }
    private setStatus(status: number) {
        this.status = status;
        if (status == 1) {
            if ($.isFunction(this.loggedInCallback)) {
                this.loggedInCallback();
            }
            this.logInButton.slideUp(this.aniTime);
            this.logOutButton.slideDown(this.aniTime);
            this.createUserButton.slideUp(this.aniTime);
            this.goOnlineButton.slideUp(this.aniTime);
        } else if (status == 2) {
            this.logInButton.slideDown(this.aniTime);
            this.logOutButton.slideUp(this.aniTime);
            this.createUserButton.slideDown(this.aniTime);
            this.goOnlineButton.slideUp(this.aniTime);
        } else if (status == 3) {
            this.logInButton.slideUp(this.aniTime);
            this.logOutButton.slideUp(this.aniTime);
            this.createUserButton.slideUp(this.aniTime);
            this.goOnlineButton.slideDown(this.aniTime);
        }
    }
    public checkLogIn() {
        var that = this;
        this.server.checkLogin({
            callback: function (data) {
                console.log("Great, logged in: " + data);
                that.username = data;
                that.setStatus(1);
            }, 
            invalidLoginData: function () {
                console.log("Invalid login data");
                that.setStatus(2);
            },
            errorCallback: function (data) {
                console.log("Error: " + data);
                that.setStatus(3);
            }
        });
    }
}
var SaveHandler = (function () {
    function SaveHandler(login, server, notes) {
        this.login = login;
        this.server = server;
        this.notes = notes;
        var _this = this;
        this.usePushSync = true;
        this.serverQueue = new ServerQueue(this, login);
        this.login.callWhenLoggedIn(function () {
            return _this.loggedIn();
        });
        this.initiate();
    }
    SaveHandler.prototype.loggedIn = function () {
        var that = this;
        this.server.getNotes({
            callback: function (data) {
                var notesMap = new HashMap();
                $.each(that.notes.getNotes(), function (index, value) {
                    notesMap.put(value.id, value);
                });
                $.each(data, function (id, value) {
                    notesMap.remove(id);
                    // First see if we are about to save that value already.
                    if(!that.serverQueue.contains(id)) {
                        var note = that.notes.getNote(id);
                        if(typeof note === "undefined") {
                            var note = new Note(that);
                            note.deSerializeIntoThis(id, value);
                            that.notes.add(note);
                        } else {
                            note.deSerializeIntoThis(id, value);
                        }
                        that.saveLocal(note);
                    } else {
                        console.log(id + " Was in internal queue, cancel inserting");
                    }
                });
                that.serverQueue.notify();
                // Everything left in notesMap is to be deleted.
                $.each(notesMap.entryArray(), function (index, value) {
                    that.deleteNote(value.key);
                });
            },
            errorCallback: function () {
                console.log("This really shouldn't happen: ");
            },
            invalidLoginData: function () {
                console.log("This really shouldn't happen: ");
            }
        });
        // Subscripe to push data.
        if(this.usePushSync) {
            var that = this;
            var pusher = new Pusher('676b265d9c19258d7336');
            var channel = pusher.subscribe(this.login.getUsername());
            channel.bind('TODO', function (data) {
                data = jQuery.parseJSON(data);
                $.each(data, function (key, val) {
                    var noteText = val;
                    if(key == 'delete') {
                        that.deleteNote(noteText, false)// In this case, noteText is the ID.
                        ;
                    } else {
                        var id = key;
                        var note = that.notes.getNote(id);
                        if(typeof note === "undefined") {
                            var note = new Note(that);
                            note.deSerializeIntoThis(id, noteText);
                            that.notes.addAfterFirst(note, true);
                            that.saveLocal(note);
                        } else {
                            if(!note.hasFocus()) {
                                note.deSerializeIntoThis(id, noteText);
                            }
                        }
                    }
                });
            });
        }
    };
    SaveHandler.prototype.add = function (id) {
        this.serverQueue.added(id);
    };
    SaveHandler.prototype.save = function (note, updateView, updateServer) {
        if (typeof updateView === "undefined") { updateView = true; }
        if (typeof updateServer === "undefined") { updateServer = true; }
        var that = this;
        // View
        if(updateView) {
            if(!this.notes.contains(note.id)) {
                console.log("Adding: " + note.id);
                console.log(this.serverQueue.contains(note.id));
                console.log(this.notes.getNotes());
                this.notes.add(note);
            }
        }
        // Sever
        this.serverQueue.saved(note.id, note.serialize());
        // Local
        this.saveLocal(note);
    };
    SaveHandler.prototype.deleteNote = function (id, pushToServer) {
        if (typeof pushToServer === "undefined") { pushToServer = true; }
        // update the view
        this.notes.remove(id);
        // update the model (local);
        this.deleteLocal(id);
        if(pushToServer) {
            // server.
            this.serverQueue.deleted(id);
        }
    };
    SaveHandler.prototype.initiate = function () {
        this.loadAllLocal();
    };
    SaveHandler.prototype.saveServerAdded = function (id, callback, complete) {
        var that = this;
        this.server.addNote({
            callback: function (newId) {
                // Set the new ID in the content.
                that.notes.changeId(id, newId);
                // And in the locally saved content.
                var content = localStorage["note_" + id];
                that.deleteLocal(id);
                var newNote = new Note(that);
                if(typeof content !== "undefined") {
                    newNote.deSerializeIntoThis(newId, content);
                }
                newNote.id = newId;
                that.saveLocalFromContent(newId, newNote.serialize());
                // And in the serverQueue.
                that.serverQueue.changeId(id, newId);
                if($.isFunction(callback)) {
                    callback();
                }
                complete();
            },
            errorCallback: function () {
                // TODO: Message?
                that.login.checkLogIn();
                complete();
            },
            invalidLoginData: function () {
                // TODO: Message?
                that.login.checkLogIn();
                complete();
            }
        });
    };
    SaveHandler.prototype.saveServerSaved = function (id, note, callback, complete) {
        var that = this;
        this.server.saveNote({
            id: id,
            content: note,
            callback: function () {
                if($.isFunction(callback)) {
                    callback();
                }
                complete();
            },
            errorCallback: function () {
                // TODO: Message?
                that.login.checkLogIn();
                complete();
            },
            invalidLoginData: function () {
                // TODO: Message?
                that.login.checkLogIn();
                complete();
            }
        });
    };
    SaveHandler.prototype.saveServerDeleted = function (id, callback, complete) {
        var that = this;
        this.server.deleteNote({
            id: id,
            callback: function () {
                if($.isFunction(callback)) {
                    callback();
                }
                complete();
            },
            errorCallback: function () {
                // TODO: Message?
                that.login.checkLogIn();
                complete();
            },
            invalidLoginData: function () {
                // TODO: Message?
                that.login.checkLogIn();
                complete();
            }
        });
    };
    SaveHandler.prototype.loadAllLocal = function () {
        var ids = this.getLocalIds();
        var that = this;
        $.each(ids, function (index, value) {
            var noteString = localStorage["note_" + value];
            if(typeof noteString !== "undefined") {
                that.insertNote(value, Note.deSerializeToNew(value, noteString, that));
            } else {
                console.log("Note not found in localstorage: " + ("note_" + value));
            }
        });
    };
    SaveHandler.prototype.saveLocal = function (note) {
        this.saveLocalFromContent(note.id, note.serialize());
    };
    SaveHandler.prototype.saveLocalFromContent = function (id, content) {
        this.addToLocalIds(id);
        localStorage["note_" + id] = content;
    };
    SaveHandler.prototype.insertNote = function (id, note, force) {
        if (typeof force === "undefined") { force = false; }
        if(this.notes.contains(id)) {
            if(force) {
                this.notes.getNote(id).deSerializeIntoThis(id, note.serialize());
            }
        } else {
            this.notes.add(note);
        }
    };
    SaveHandler.prototype.deleteLocal = function (id) {
        localStorage.removeItem("note_" + id);
        var ids = this.getLocalIds();
        var idIndex = ids.indexOf(id);
        ids.splice(idIndex, 1);
        this.saveLocalIds(ids);
    };
    SaveHandler.prototype.clearLocal = function () {
        var undefined;
        var ids = this.getLocalIds();
        var that = this;
        $.each(ids, function (index, value) {
            localStorage.removeItem("note_" + value);
        });
        localStorage["notes_idList"] = "";
    };
    SaveHandler.prototype.addToLocalIds = function (id) {
        var ids = this.getLocalIds();
        if($.inArray(id, ids) === -1) {
            ids.push(id);
            this.saveLocalIds(ids);
        }
    };
    SaveHandler.prototype.saveLocalIds = function (ids) {
        var res = "";
        $.each(ids, function (index, value) {
            res += value + ",";
        });
        localStorage["notes_idList"] = res;
    };
    SaveHandler.prototype.getLocalIds = function () {
        if(typeof localStorage["notes_idList"] === "undefined") {
            localStorage["notes_idList"] = "";
            return [];
        } else {
            var res = localStorage["notes_idList"].split(',');
            if(!res[res.length - 1]) {
                res.pop();
            }
            return res;
        }
    };
    return SaveHandler;
})();

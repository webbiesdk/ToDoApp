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
                var content = that.getLocalNote(id);
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
    SaveHandler.prototype.saveAllLocal = function (notes) {
        this.notesCache = notes;
        for(var a in notes) {
            var note = (notes[a]).note;
            note = note.replace(/&/g, '&amp;');
            note = note.replace(/\"/g, '&#34;');
            note = note.replace(/\n/g, '&newLine;');
            (notes[a]).note = note;
        }
        localStorage.setItem("notes", JSON.stringify(notes));
    };
    SaveHandler.prototype.getAllLocal = function () {
        if(typeof this.notesCache === "undefined") {
            var notes = localStorage.getItem("notes");
            if(typeof notes !== "undefined") {
                try  {
                    var res = JSON.parse(notes);
                    for(var a in res) {
                        var note = (res[a]).note;
                        // Unescaping.
                        note = note.replace(/&newLine;/g, '\n');
                        note = note.replace(/&#34;/g, '"');
                        note = note.replace(/&amp;/g, '&');
                        (res[a]).note = note;
                    }
                    if(res == null || typeof res === "undefined") {
                        return [];
                    }
                    this.notesCache = res;
                    return res;
                } catch (e) {
                    console.log("Catched: " + e);
                    // Nothing, just exiting.
                                    }
            }
            return [];
        } else {
            return this.notesCache;
        }
    };
    SaveHandler.prototype.getLocalNote = function (id) {
        var that = this;
        var res;
        $.each(this.getAllLocal(), function (index, value) {
            if(value.id == id) {
                res = value.note;
                return false;// break;
                
            }
        });
        return res;
    };
    SaveHandler.prototype.loadAllLocal = function () {
        var that = this;
        var notes = this.getAllLocal();
        $.each(notes, function (index, value) {
            var noteString = value.note;
            var id = value.id;
            if(typeof noteString !== "undefined") {
                that.insertNote(id, Note.deSerializeToNew(id, noteString, that));
            } else {
                console.log("What????: " + ("note: " + value));
            }
        });
    };
    SaveHandler.prototype.saveLocal = function (note) {
        this.saveLocalFromContent(note.id, note.serialize());
    };
    SaveHandler.prototype.saveLocalFromContent = function (id, content) {
        var notes = this.getAllLocal();
        var replaced = false;
        for(var i = 0; i < notes.length; i++) {
            var tmpNote = notes[i];
            if(tmpNote.id == id) {
                tmpNote.note = content;
                replaced = true;
                break;
            }
        }
        if(!replaced) {
            notes.push({
                id: id,
                note: content
            });
        }
        this.saveAllLocal(notes);
    };
    SaveHandler.prototype.deleteLocal = function (id) {
        console.log("Delete: " + id);
        var notes = this.getAllLocal();
        console.log(notes);
        var index = 0;
        for(var a in notes) {
            var note = notes[a];
            if(note.id == id) {
                notes.splice(index, 1);
                break;
            }
            index++;
        }
        console.log(notes);
        this.saveAllLocal(notes);
    };
    SaveHandler.prototype.clearLocal = function () {
        localStorage.removeItem("notes");
    };
    return SaveHandler;
})();

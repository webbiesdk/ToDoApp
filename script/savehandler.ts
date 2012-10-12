/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
/// <reference path="serverqueue.ts" />
/// <reference path="login.ts" />

class SaveHandler {
    private serverQueue: ServerQueue;
    constructor (private login: LoginHandler, private server: Server, private notes: Notes) {
        this.serverQueue = new ServerQueue(this, login);
        this.login.callWhenLoggedIn(() => this.loggedIn());
        this.initiate();
    }
    private loggedIn() {
        var that = this;
        this.server.getNotes({
            callback: function (data) {
                $.each(data, function (id, value) {
                    // First see if we are about to save that value already.
                    if (!that.serverQueue.contains(id)) {
                        var note = that.notes.getNote(id);
                        if (typeof note === "undefined") {
                            var note = new Note(that);
                            note.deSerializeIntoThis(value);
                            that.notes.add(note);
                        }
                        else {
                            note.deSerializeIntoThis(value);
                        }
                    }
                    else {
                        console.log(id + " Was in internal queue, cancel inserting");
                    }
                         
                });
                that.serverQueue.notify();
            },
            errorCallback: function () {
                console.log("This really shouldn't happen!");
            }, 
            invalidLoginData: function () {
                console.log("This really shouldn't happen!");
            }
        });
    }
    public add(note: Note) {
        this.serverQueue.added(note.id);
    }
    public save(note: Note, updateView? = true) {
        var that = this;
        // View
        if (updateView) {
            if (!this.notes.contains(note.id)) {
                this.notes.add(note);
            }
        }
        // Sever
        this.serverQueue.saved(note.id, note.serialize());
        // Local
        this.saveLocal(note);
    }
    public deleteNote(note: Note) {
        // update the view
        this.notes.remove(note);
        // update the model (local);
        this.deleteLocal(note.id);
        // server. 
        this.serverQueue.deleted(note.id);
    }
    public initiate() {
        this.loadAllLocal();
    }
    public saveServerAdded(id: string, callback: Function, complete: Function) {
        var that = this;
        this.server.addNote({
            callback: function (data) {
                // Set the new ID in the content. 
                that.notes.changeId(id, data);
                // And in the locally saved content. 
                var content = localStorage["note_" + id];

                that.deleteLocal(id);

                var newNote = new Note(that);
                if (typeof content !== "undefined") {
                    newNote.deSerializeIntoThis(content);
                }
                newNote.id = data;
                that.saveLocalFromContent(data, newNote.serialize());
                // And in the serverQueue. 
                that.serverQueue.changeId(id, data);
                if ($.isFunction(callback)) {
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
    }
    public saveServerSaved(id: string, note: string, callback: Function, complete: Function) {
        var that = this;
        this.server.saveNote({
            id : id, 
            content: note, 
            callback: function () {
                if ($.isFunction(callback)) {
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
    }
    public saveServerDeleted(id: string, callback: Function, complete: Function) {
        var that = this;
        this.server.deleteNote({
            id : id, 
            callback: function () {
                if ($.isFunction(callback)) {
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
    }
    private loadAllLocal() {
        var ids = this.getLocalIds();
        var that = this;
        $.each(ids, function (index, value) {
            var noteString : string = localStorage["note_" + value];
            if (typeof noteString !== "undefined") {
                that.insertNote(Note.deSerializeToNew(noteString, that));
            }
            else {
                console.log("Note not found in localstorage: " + ("note_" + value));
            }
        });
    }
    private saveLocal(note: Note) {
        this.saveLocalFromContent(note.id, note.serialize());
    }
    private saveLocalFromContent(id: string, content: string) {
        this.addToLocalIds(id);
        localStorage["note_" + id] = content;
    }
    private insertNote(note: Note, force? = false) {
        if (this.notes.contains(note.id)) {
            if (force) {
                this.notes.getNote(note.id).deSerializeIntoThis(note.serialize());
            }
        }
        else {
            this.notes.add(note);
        }
    }
    private deleteLocal(id: string) {
        localStorage.removeItem("note_" + id);
        var ids = this.getLocalIds();
        var idIndex = ids.indexOf(id);
        ids.splice(idIndex, 1);
        this.saveLocalIds(ids);
    }
    private clearLocal() {
        var undefined;
        var ids = this.getLocalIds();
        var that = this;
        $.each(ids, function (index, value) {
            localStorage.removeItem("note_" + value);
        });
        localStorage.removeItem("notes_idList");
    }
    private addToLocalIds(id: string) {
        var ids = this.getLocalIds();
        if ($.inArray(id, ids) === -1) {
            ids.push(id);
            this.saveLocalIds(ids);
        }
    }
    private saveLocalIds(ids: string[]) {
        var res = "";
        $.each(ids, function (index, value) {
            res += value + ",";
        });
        localStorage["notes_idList"] = res;
    }
    private getLocalIds() : string[]{
        if (typeof localStorage["notes_idList"] === "undefined") {
            localStorage["notes_idList"] = "";
            return [];
        }
        else {
            var res : string[] = localStorage["notes_idList"].split(',');
            if (!res[res.length - 1]) {
                res.pop();
            }
            return res;
        }
    }
}

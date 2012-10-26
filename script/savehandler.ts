/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
/// <reference path="serverqueue.ts" />
/// <reference path="login.ts" />

 interface NoteContainer {
     id: string;
     note: string;
}

declare var Pusher;
class SaveHandler {
    private serverQueue: ServerQueue;
    private usePushSync: bool = true;
    constructor (private login: LoginHandler, private server: Server, private notes: Notes) {
        this.serverQueue = new ServerQueue(this, login);
        this.login.callWhenLoggedIn(() => this.loggedIn());
        this.initiate();
    }
    private loggedIn() {
        var that = this;
        this.server.getNotes({
            callback: function (data) {
                var notesMap = new HashMap();
                $.each(that.notes.getNotes(), function (index, value: Note) {
                    notesMap.put(value.id, value);
                });
                $.each(data, function (id, value) {
                    notesMap.remove(id);
                    // First see if we are about to save that value already.
                    if (!that.serverQueue.contains(id)) {
                        var note = that.notes.getNote(id);
                        if (typeof note === "undefined") {
                            var note = new Note(that);
                            note.deSerializeIntoThis(id, value);
                            that.notes.add(note);
                        }
                        else {
                            note.deSerializeIntoThis(id, value);
                        }
                        that.saveLocal(note);
                    }
                    else {
                        console.log(id + " Was in internal queue, cancel inserting");
                    }

                });
                that.serverQueue.notify();
                // Everything left in notesMap is to be deleted. 
                $.each(notesMap.entryArray(), function (index, value: Entry) {
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
        if (this.usePushSync) {
            var that = this;
            var pusher = new Pusher('676b265d9c19258d7336');
            var channel = pusher.subscribe(this.login.getUsername());
            channel.bind('TODO', function (data) {
                data = jQuery.parseJSON(data);
                $.each(data, function (key, val) {
                    var noteText = val;
                    if (key == 'delete') {
                        that.deleteNote(noteText, false); // In this case, noteText is the ID. 
                    }
                    else {
                        var id = key;
                        var note = that.notes.getNote(id);
                        if (typeof note === "undefined") {
                            var note = new Note(that);
                            note.deSerializeIntoThis(id, noteText);
                            that.notes.addAfterFirst(note, true);
                            that.saveLocal(note);
                        }
                        else {
                            if (!note.hasFocus()) {
                                note.deSerializeIntoThis(id, noteText);
                            }
                        }
                    }
                });
            });
        }
    }
    public add(id: string) {
        this.serverQueue.added(id);
    }
    public save(note: Note, updateView? = true, updateServer? = true) {
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
    public deleteNote(id: string, pushToServer? = true) {
        // update the view
        this.notes.remove(id);
        // update the model (local);
        this.deleteLocal(id);
        if (pushToServer) {
            // server. 
            this.serverQueue.deleted(id);
        }
    }
    public initiate() {
        this.loadAllLocal();
    }
    public saveServerAdded(id: string, callback: Function, complete: Function) {
        var that = this;
        this.server.addNote({
            callback: function (newId) {
                // Set the new ID in the content. 
                that.notes.changeId(id, newId);
                // And in the locally saved content. 
                var content = that.getLocalNote(id);

                that.deleteLocal(id);

                var newNote = new Note(that);
                if (typeof content !== "undefined") {
                    newNote.deSerializeIntoThis(newId, content);
                }
                newNote.id = newId;
                that.saveLocalFromContent(newId, newNote.serialize());
                // And in the serverQueue. 
                that.serverQueue.changeId(id, newId);
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
            id: id,
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
            id: id,
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
    private insertNote(id: string, note: Note, force? = false) {
        if (this.notes.contains(id)) {
            if (force) {
                this.notes.getNote(id).deSerializeIntoThis(id, note.serialize());
            }
        }
        else {
            this.notes.add(note);
        }
    }

    private notesCache: NoteContainer[];
    private saveAllLocal(notes: NoteContainer[]) : void{
        this.notesCache = notes;
        for (var a in notes) {
            var note = (<NoteContainer>notes[a]).note;
            note = note.replace(/&/g,'&amp;');
            note = note.replace(/\"/g,'&#34;');
            note = note.replace(/\n/g,'&newLine;');
            (<NoteContainer>notes[a]).note = note;
        }
        localStorage.setItem("notes", JSON.stringify(notes));
    }
    private getAllLocal(): NoteContainer[] {
        if (typeof this.notesCache === "undefined") {
            var notes = localStorage.getItem("notes");
            if (typeof notes !== "undefined") {
                try {
                    var res: NoteContainer[] = JSON.parse(notes);
                    for (var a in res) {
                        var note = (<NoteContainer>res[a]).note;
                        // Unescaping. 
                        note = note.replace(/&newLine;/g, '\n');
                        note = note.replace(/&#34;/g, '"');
                        note = note.replace(/&amp;/g, '&');
                        (<NoteContainer>res[a]).note = note;
                    }
                    if (res == null || typeof res === "undefined") {
                        return [];
                    }
                    this.notesCache = res;
                    return res;

                }
                catch (e) {
                    console.log("Catched: " + e);
                    // Nothing, just exiting. 
                }
            }
            return [];
        }
        else {
            return this.notesCache;
        }
    }
    private getLocalNote(id : string): string {
        var that = this;
        var res; 
        $.each(this.getAllLocal(), function (index, value: NoteContainer) {
            if (value.id == id) {
                res = value.note;
                return false; // break;
            }
        });
        return res;
    }
    private loadAllLocal() {
        var that = this;
        var notes = this.getAllLocal();
        $.each(notes, function (index, value : NoteContainer) {
            var noteString = value.note;
            var id = value.id;
            if (typeof noteString !== "undefined") {
                that.insertNote(id, Note.deSerializeToNew(id, noteString, that));
            }
            else {
                console.log("What????: " + ("note: " + value));
            }
        });
    }
    private saveLocal(note: Note) {
        this.saveLocalFromContent(note.id, note.serialize());
    }
    private saveLocalFromContent(id: string, content: string) {
        var notes = this.getAllLocal();

        var replaced = false;
        for (var i = 0; i < notes.length; i++) {
            var tmpNote = <NoteContainer>notes[i];
            if (tmpNote.id == id) {
                tmpNote.note = content;
                replaced = true;
                break;
            }
        } 
        if (!replaced) {
            notes.push({
                id: id,
                note: content
            });
        }
        
        
        this.saveAllLocal(notes);
    }
    private deleteLocal(id: string) {
        console.log("Delete: " + id);
        var notes = this.getAllLocal();
        console.log(notes);
        var index = 0;
        for (var a in notes) {
            var note = <NoteContainer>notes[a];
            if (note.id == id) {
                notes.splice(index, 1);
                break;
            }
            index++;
        }
        console.log(notes);
        this.saveAllLocal(notes);
    }
    private clearLocal() {
        localStorage.removeItem("notes");
    }
}

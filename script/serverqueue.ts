/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
/// <reference path="savehandler.ts" />
/// <reference path="keyboard.ts" />

class ServerQueue {
    private addedQueue: HashMap = new HashMap();
    private savedQueue: HashMap = new HashMap();
    private deletedQueue: HashMap = new HashMap();
    private callback: Function;
    private sending: bool = false;
    constructor (private savehandler: SaveHandler, login: LoginHandler) {
        if (typeof localStorage["notes_addedQueue"] !== "undefined") {
            this.addedQueue.deserialize(localStorage["notes_addedQueue"]);
        }
        if (typeof localStorage["savedQueue"] !== "undefined") {
            this.savedQueue.deserialize(localStorage["notes_savedQueue"]);
        }
        if (typeof localStorage["notes_deletedQueue"] !== "undefined") {
            this.deletedQueue.deserialize(localStorage["notes_deletedQueue"]);
        }
    }
    public added(id: string) {
        this.addedQueue.put(id, "");
        this.saveAddedLocal();
        this.notify();
    }
    public contains(id: string) : bool {
        if (typeof this.addedQueue.get(id) !== "undefined") {
            return true;
        }
        if (typeof this.savedQueue.get(id) !== "undefined") {
            return true;
        }
        if (typeof this.deletedQueue.get(id) !== "undefined") {
            return true;
        }
        return false;
    }
    private saveAddedLocal() {
        localStorage["notes_addedQueue"] = this.addedQueue.serialize();
    }
    public saved(id: string, content: string) {
        this.savedQueue.put(id, content);
        this.saveSavedLocal();
        this.notify();
    }
    private saveSavedLocal() {
        localStorage["notes_savedQueue"] = this.savedQueue.serialize();
    }
    public deleted(id: string) {
        this.deletedQueue.put(id, "");
        this.addedQueue.remove(id);
        this.savedQueue.remove(id);
        this.saveDeletedLocal();
        this.saveAddedLocal();
        this.saveSavedLocal();
        this.notify();
    }
    private saveDeletedLocal() {
        localStorage["notes_deletedQueue"] = this.deletedQueue.serialize();
    }
    public changeId(from: string, to: string): void {
        var note = this.savedQueue.get(from);
        if (this.savedQueue.remove(from)) { 
            this.savedQueue.put(to, note);
        }
        note = this.deletedQueue.get(from);
        if (this.deletedQueue.remove(from)) { 
            this.deletedQueue.put(to, note);
        }
    }
    public notify() {
        if (!this.sending) {
            this.sendNext();
        }
    }
    private sendNext() {
        this.sending = true;
        var that = this;
        if (this.addedQueue.size() !== 0) {
            var note : Entry = this.addedQueue.getSome();
            this.savehandler.saveServerAdded(note.key, function () {
                that.addedQueue.remove(note.key);
            }, function () {
                that.sending = false;
                that.notify();
            });
        } else if (this.savedQueue.size() !== 0) {
            var note : string = this.savedQueue.getSome();
            this.savehandler.saveServerSaved(note.key, note.value, function () {
                that.savedQueue.remove(note.key);
            }, function () {
                that.sending = false;
                that.notify();
            });
        } else if (this.deletedQueue.size() !== 0) {
            var note: string = this.deletedQueue.getSome();
            this.savehandler.saveServerDeleted(note.key, function () {
                that.deletedQueue.remove(note.key);
            }, function () {
                that.sending = false;
                that.notify();
            });
        }
        else {
            this.sending = false;
        }
    }
}
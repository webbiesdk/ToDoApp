/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
/// <reference path="savehandler.ts" />
/// <reference path="keyboard.ts" />
var ServerQueue = (function () {
    function ServerQueue(savehandler, login) {
        this.savehandler = savehandler;
        this.addedQueue = new HashMap();
        this.savedQueue = new HashMap();
        this.deletedQueue = new HashMap();
        this.sending = false;
        if(typeof localStorage["notes_addedQueue"] !== "undefined") {
            this.addedQueue.deserialize(localStorage["notes_addedQueue"]);
        }
        if(typeof localStorage["savedQueue"] !== "undefined") {
            this.savedQueue.deserialize(localStorage["notes_savedQueue"]);
        }
        if(typeof localStorage["notes_deletedQueue"] !== "undefined") {
            this.deletedQueue.deserialize(localStorage["notes_deletedQueue"]);
        }
    }
    ServerQueue.prototype.added = function (id) {
        this.addedQueue.put(id, "");
        this.saveAddedLocal();
        this.notify();
    };
    ServerQueue.prototype.contains = function (id) {
        if(typeof this.addedQueue.get(id) !== "undefined") {
            return true;
        }
        if(typeof this.savedQueue.get(id) !== "undefined") {
            return true;
        }
        if(typeof this.deletedQueue.get(id) !== "undefined") {
            return true;
        }
        return false;
    };
    ServerQueue.prototype.saveAddedLocal = function () {
        localStorage["notes_addedQueue"] = this.addedQueue.serialize();
    };
    ServerQueue.prototype.saved = function (id, content) {
        this.savedQueue.put(id, content);
        this.saveSavedLocal();
        this.notify();
    };
    ServerQueue.prototype.saveSavedLocal = function () {
        localStorage["notes_savedQueue"] = this.savedQueue.serialize();
    };
    ServerQueue.prototype.deleted = function (id) {
        this.deletedQueue.put(id, "");
        this.addedQueue.remove(id);
        this.savedQueue.remove(id);
        this.saveDeletedLocal();
        this.saveAddedLocal();
        this.saveSavedLocal();
        this.notify();
    };
    ServerQueue.prototype.saveDeletedLocal = function () {
        localStorage["notes_deletedQueue"] = this.deletedQueue.serialize();
    };
    ServerQueue.prototype.changeId = function (from, to) {
        var note = this.savedQueue.get(from);
        if(this.savedQueue.remove(from)) {
            this.savedQueue.put(to, note);
        }
        note = this.deletedQueue.get(from);
        if(this.deletedQueue.remove(from)) {
            this.deletedQueue.put(to, note);
        }
    };
    ServerQueue.prototype.notify = function () {
        if(!this.sending) {
            this.sendNext();
        }
    };
    ServerQueue.prototype.sendNext = function () {
        this.sending = true;
        var that = this;
        if(this.addedQueue.size() !== 0) {
            var note = this.addedQueue.getSome();
            this.savehandler.saveServerAdded(note.key, function () {
                that.addedQueue.remove(note.key);
            }, function () {
                that.sending = false;
                that.notify();
            });
        } else {
            if(this.savedQueue.size() !== 0) {
                var note = this.savedQueue.getSome();
                this.savehandler.saveServerSaved(note.key, note.value, function () {
                    that.savedQueue.remove(note.key);
                }, function () {
                    that.sending = false;
                    that.notify();
                });
            } else {
                if(this.deletedQueue.size() !== 0) {
                    var note = this.deletedQueue.getSome();
                    this.savehandler.saveServerDeleted(note.key, function () {
                        that.deletedQueue.remove(note.key);
                    }, function () {
                        that.sending = false;
                        that.notify();
                    });
                } else {
                    this.sending = false;
                }
            }
        }
    };
    return ServerQueue;
})();

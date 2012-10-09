/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
var SaveHandler = (function () {
    function SaveHandler(server, notes) {
        this.server = server;
        this.notes = notes;
    }
    SaveHandler.prototype.save = function (note, updateView) {
        if (typeof updateView === "undefined") { updateView = true; }
        if(updateView) {
            if(!this.notes.contains(note.id)) {
                this.notes.add(note);
            }
        }
        this.saveLocal(note);
    };
    SaveHandler.prototype.deleteNote = function (note) {
        // update the view
        this.notes.remove(note);
        // update the model (local);
        this.deleteLocalNote(note);
    };
    SaveHandler.prototype.initiate = function () {
        this.loadAllLocal();
    };
    SaveHandler.prototype.loadAllLocal = function () {
        var ids = this.getLocalIds();
        var that = this;
        $.each(ids, function (index, value) {
            var noteString = localStorage["note_" + value];
            if(typeof noteString !== "undefined") {
                that.insertNote(Note.deSerializeToNew(noteString, that));
            } else {
                console.log("Note not found in localstorage: " + ("note_" + value));
            }
        });
    };
    SaveHandler.prototype.saveLocal = function (note) {
        this.addToLocalIds(note.id);
        localStorage["note_" + note.id] = note.serialize();
    };
    SaveHandler.prototype.insertNote = function (note, force) {
        if (typeof force === "undefined") { force = false; }
        if(this.notes.contains(note.id)) {
            if(force) {
                this.notes.getNote(note.id).deSerializeIntoThis(note.serialize());
            }
        } else {
            this.notes.add(note);
        }
    };
    SaveHandler.prototype.deleteLocalNote = function (note) {
        localStorage.removeItem("note_" + note.id);
        var ids = this.getLocalIds();
        var idIndex = ids.indexOf(note.id);
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
        localStorage.removeItem("notes_idList");
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

/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
class SaveHandler {
    constructor (private server: Server, private notes: Notes) {

    }
    public save(note: Note, updateView? = true) {
        if (updateView) {
            if (!this.notes.contains(note.id)) {
                this.notes.add(note);
            }
        }
        this.saveLocal(note);
    }
    public deleteNote(note: Note) {
        // update the view
        this.notes.remove(note);
        // update the model (local);
        this.deleteLocalNote(note);
    }
    public initiate() {
        this.loadAllLocal();
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
        this.addToLocalIds(note.id);
        localStorage["note_" + note.id] = note.serialize();
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
    private deleteLocalNote(note: Note) {
        localStorage.removeItem("note_" + note.id);
        var ids = this.getLocalIds();
        var idIndex = ids.indexOf(note.id);
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

/// <reference path="jquery.d.ts" />
/// <reference path="basic.ts" />
class Notes {
    private noteMap = new HashMap();
    constructor (private elem: JQuery) { }
    public add(note: Note) {
        if (typeof this.noteMap.get(note.id) === "undefined") {
            this.elem.append(note.element);
            this.elem.trigger("create");
            note.updateHeadline();
            this.noteMap.put(note.id, note);
        }
        else {
            console.log("Note: " + note.id + " was already added!");
        }
    }
    public changeId(from: string, to: string): bool {
        var note: Note = this.noteMap.get(from);
        if (this.noteMap.remove(from)) {
            this.noteMap.put(to, note);
            return true;
        }
        return false;
    }
    public getNote(id: string): Note {
        return this.noteMap.get(id);
    }
    public contains(id: string): bool {
        return typeof this.noteMap.get(id) !== "undefined";
    }
    public getNotes() {
        var noteEntries = this.noteMap.getEntryArray();
        var res: Note[] = [];
        $.each(noteEntries, function (index, value: Entry) {
            res.push(value.value);
        });
        return res;
    }
    public addFirst(note: Note, animation? = true) {
        if (typeof this.noteMap.get(note.id) === "undefined") {
            this.elem.prepend(note.element);
            note.element.trigger("create");
            this.elem.trigger("create");
            if (animation) {
                note.element.hide().slideDown(400);
            }
            this.noteMap.put(note.id, note);
        }
        else {
            console.log("Note: " + note.id + " was already added!");
        }
    }
    public remove(note: Note): bool {
        note.element.slideUp(400, function () {
            note.element.detach();
        });
        return this.noteMap.remove(note.id);
    }
}
interface SerializedNote {
    id: string;
    content: string;
}
class Note {
    private static tmpIdCounter: number = 0;
    headline: JQuery;
    textarea: JQuery;
    public element: JQuery;
    constructor (private saver: SaveHandler, public id? = Note.getNextTempId(), private content? = "") {
        var that = this;
        this.element = $("<div data-role='collapsible' data-iconpos='right'></div>");
        this.headline = $("<h3>" + this.getHeadline() + "</h3>");
        this.element.append(this.headline);
        this.textarea = $("<textarea>" + this.content + "</textarea>");
        this.textarea.keyup(function () {
            that.setContent(that.getContent(), false);
        });
        this.element.append(this.textarea);
        var deleteButton = $("<a href='javascript:void(0)' class='button' data-role='button' data-icon='delete' data-inline='true'>Delete</a>");
        deleteButton.click(function () {
            // Update the model
            that.saver.deleteNote(that);
        });
        this.element.append(deleteButton);
        var saveButton = $("<a href='index.html' class='saveButton button' data-role='button' data-icon='check' data-theme='b' data-inline='true'>Save</a>");
        saveButton.click(function () {
            that.saver.save(that);
            that.collapse();
        });
        this.element.append(saveButton);

        this.element.bind('expand', function () {
            $(this).children().slideDown(400);
        }).bind('collapse', function () {
            $(this).children().next().slideUp(400);
        });

    }
    public setContent(content: string, updateTextarea? = true) {
        this.content = content;
        this.updateHeadline();
        if (updateTextarea) {
            this.textarea.text(content);
        }
    }
    public getContent(): string {
        return this.textarea.val();
    }
    public updateHeadline() {
        var headline = this.getHeadline();
        if (headline.length == 0) {
            this.headline.find(".ui-btn-inner").css({ height: "20px", display: "block" });
        }
        this.headline.find(".ui-btn-text").text(headline);

    }
    public collapsed(): bool {
        return this.element.hasClass("ui-collapsible-collapsed");
    }
    public collapse(): void {
        if (!this.collapsed()) {
            this.headline.click();
        }
    }
    public destroy(): void {
        this.element.remove();
    }
    public serialize(): string {
        var serialized: SerializedNote = { id: this.id, content: this.getContent() };
        return JSON.stringify(serialized);
    }
    public static deSerializeToNew(noteString: string, saver: SaveHandler): Note {
        var note: Note = new Note(saver);
        note.deSerializeIntoThis(noteString);
        return note;
    }
    public deSerializeIntoThis(noteString: string): void {
        var note: SerializedNote = JSON.parse(noteString);
        this.id = note.id;
        this.setContent(note.content);
    }
    private getHeadline(): string {
        return this.content ? this.content.split(/\n/g)[0] : "";
    }
    private static getNextTempId() {
        Note.tmpIdCounter++;
        return "tmpID" + Note.tmpIdCounter + new Date().getTime().toString();
    }
}
class NewNote extends Note {
    constructor (saver: SaveHandler, notes: Notes) {
        super(saver, Note.getNextTempId(), "New note");
        var that = this;
        this.element.one("expand", function () {
            saver.save(that);
            NewNote.removeContentOverTime(that, 400, function () {
                that.textarea.focus();
                notes.addFirst(new NewNote(saver, notes));
            });
        });
    }
    private static removeContentOverTime(note: Note, time: number, callback?: Function) {
        var content = note.getContent();
        var orgsize = content.length;
        var timePrChar = time / orgsize;
        var timeCounter = 0;
        for (var i = orgsize - 1; i >= 0; i--) {
            (function () {
                var index = i;
                timeCounter += timePrChar;
                setTimeout(function () {
                    note.setContent(content.slice(0, index));
                    if (index == 0) {
                        if ($.isFunction(callback)) {
                            callback();
                        }
                    }
                }, timeCounter);
            })();

        }
    }
}
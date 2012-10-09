/// <reference path="jquery.d.ts" />
/// <reference path="server/server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />


// TODO: Save every note in a hashMap of id-s. 
class Notes {
    constructor (private elem: JQuery) { }
    public add(note: Note) {
        this.elem.append(note.element);
        this.elem.trigger("create");
    }
    public addFirst(note: Note) {
        this.elem.prepend(note.element);
        note.element.trigger("create");
        this.elem.trigger("create");
        note.element.hide().slideDown(400);
    }
    public remove(note: Note): void {
        note.element.detach();
    }
}
class Note {
    private static tmpIdCounter: number = 0;
    headline: JQuery;
    textarea: JQuery;
    public element: JQuery;
    constructor (public id? = Note.getNextTempId(), private content? = "") {  

        this.element = $("<div data-role='collapsible' data-iconpos='right'></div>");
        this.headline = $("<h3>" + this.getHeadline() + "</h3>");
        this.element.append(this.headline);
        this.textarea = $("<textarea>" + this.content + "</textarea>");
        this.element.append(this.textarea);
        var deleteButton = $("<a href='javascript:void(0)' data-role='button' data-icon='delete' data-inline='true'>Delete</a>");
        this.element.append(deleteButton);
        var saveButton = $("<a href='index.html' data-role='button' data-icon='check' data-theme='b' data-inline='true'>Save</a>");
        this.element.append(saveButton);

        this.element.bind('expand', function () {
            $(this).children().slideDown(400);
        }).bind('collapse', function () {
            $(this).children().next().slideUp(400);
        });
    }
    public setContent(content: string) {
        this.content = content;
        this.updateHeadline(); 
        this.textarea.text(content); 
    }
    private updateHeadline() {
        this.headline.find(".ui-btn-text").text(this.getHeadline());
    }
    public collapsed(): bool {
        return this.element.hasClass("ui-collapsible-collapsed");
    }
    public destroy(): void {
        this.element.remove();
    }
    private getHeadline(): string {
        return this.content ? this.content.split(/\n/g)[0] : '';
    }
    private static getNextTempId() {
        Note.tmpIdCounter++;
        return "tmpID" + Note.tmpIdCounter + new Date().getTime().toString();
    }
}
class NewNote extends Note {
    constructor (notes : Notes) {
        super("", "Add note");
        var that = this;
        this.element.one("expand", function () {
            that.setContent("");
            setTimeout(function () { that.textarea.focus(); }, 400);
            notes.addFirst(new NewNote(notes));
        });
    }
}

var scripts = [
    "http://webbies.dk/assets/files/SudoSlider/package/js/jquery.sudoSlider.min.js",
            /* "script/server/server.js",  */
            /* "script/mobile.js",  */];
ScriptLoader.loadScripts(scripts, function () {
    $(document).ready(function () {
        var notes = new Notes($("#notes"));
        var newNote = new NewNote(notes);
        notes.add(newNote);



    });
});



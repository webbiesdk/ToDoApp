var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
/// <reference path="jquery.d.ts" />
/// <reference path="server/server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
// TODO: Save every note in a hashMap of id-s.
var Notes = (function () {
    function Notes(elem) {
        this.elem = elem;
    }
    Notes.prototype.add = function (note) {
        this.elem.append(note.element);
        this.elem.trigger("create");
    };
    Notes.prototype.addFirst = function (note) {
        this.elem.prepend(note.element);
        note.element.trigger("create");
        this.elem.trigger("create");
        note.element.hide().slideDown(400);
    };
    Notes.prototype.remove = function (note) {
        note.element.detach();
    };
    return Notes;
})();
var Note = (function () {
    function Note(id, content) {
        if (typeof id === "undefined") { id = Note.getNextTempId(); }
        if (typeof content === "undefined") { content = ""; }
        this.id = id;
        this.content = content;
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
    Note.tmpIdCounter = 0;
    Note.prototype.setContent = function (content) {
        this.content = content;
        this.updateHeadline();
        this.textarea.text(content);
    };
    Note.prototype.updateHeadline = function () {
        this.headline.find(".ui-btn-text").text(this.getHeadline());
    };
    Note.prototype.collapsed = function () {
        return this.element.hasClass("ui-collapsible-collapsed");
    };
    Note.prototype.destroy = function () {
        this.element.remove();
    };
    Note.prototype.getHeadline = function () {
        return this.content ? this.content.split(/\n/g)[0] : '';
    };
    Note.getNextTempId = function getNextTempId() {
        Note.tmpIdCounter++;
        return "tmpID" + Note.tmpIdCounter + new Date().getTime().toString();
    }
    return Note;
})();
var NewNote = (function (_super) {
    __extends(NewNote, _super);
    function NewNote(notes) {
        _super.call(this, "", "Add note");
        var that = this;
        this.element.one("expand", function () {
            that.setContent("");
            setTimeout(function () {
                that.textarea.focus();
            }, 400);
            notes.addFirst(new NewNote(notes));
        });
    }
    return NewNote;
})(Note);
var scripts = [
    "http://webbies.dk/assets/files/SudoSlider/package/js/jquery.sudoSlider.min.js", 
    
];
/* "script/server/server.js",  */
/* "script/mobile.js",  */ ScriptLoader.loadScripts(scripts, function () {
    $(document).ready(function () {
        var notes = new Notes($("#notes"));
        var newNote = new NewNote(notes);
        notes.add(newNote);
    });
});

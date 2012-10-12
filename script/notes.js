var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
}
var Notes = (function () {
    function Notes(elem) {
        this.elem = elem;
        this.noteMap = new HashMap();
    }
    Notes.prototype.add = function (note) {
        if(typeof this.noteMap.get(note.id) === "undefined") {
            this.elem.append(note.element);
            this.elem.trigger("create");
            note.updateHeadline();
            this.noteMap.put(note.id, note);
        } else {
            console.log("Note: " + note.id + " was already added!");
        }
    };
    Notes.prototype.addFirst = function (note, animation) {
        if (typeof animation === "undefined") { animation = true; }
        if(typeof this.noteMap.get(note.id) === "undefined") {
            this.elem.prepend(note.element);
            note.element.trigger("create");
            this.elem.trigger("create");
            if(animation) {
                note.element.hide().slideDown(400);
            }
            note.updateHeadline();
            this.noteMap.put(note.id, note);
        } else {
            console.log("Note: " + note.id + " was already added!");
        }
    };
    Notes.prototype.addAfterFirst = function (note, animation) {
        if (typeof animation === "undefined") { animation = true; }
        if(typeof this.noteMap.get(note.id) === "undefined") {
            this.elem.children().eq(0).after(note.element);
            note.element.trigger("create");
            this.elem.trigger("create");
            if(animation) {
                note.element.hide().slideDown(400);
            }
            note.updateHeadline();
            this.noteMap.put(note.id, note);
        } else {
            console.log("Note: " + note.id + " was already added!");
        }
    };
    Notes.prototype.changeId = function (from, to) {
        var note = this.noteMap.get(from);
        if(this.noteMap.remove(from)) {
            this.noteMap.put(to, note);
            note.id = to;
            return true;
        }
        return false;
    };
    Notes.prototype.getNote = function (id) {
        return this.noteMap.get(id);
    };
    Notes.prototype.contains = function (id) {
        return typeof this.noteMap.get(id) !== "undefined";
    };
    Notes.prototype.getNotes = function () {
        var noteEntries = this.noteMap.entryArray();
        var res = [];
        $.each(noteEntries, function (index, value) {
            res.push(value.value);
        });
        return res;
    };
    Notes.prototype.remove = function (id) {
        var note = this.noteMap.get(id);
        if(typeof note === "undefined") {
            console.log("Could note remove note: " + id);
            return false;
        } else {
            note.element.slideUp(400, function () {
                note.element.detach();
            });
            return this.noteMap.remove(note.id);
        }
    };
    return Notes;
})();
var Note = (function () {
    function Note(saver, id, content) {
        if (typeof id === "undefined") { id = Note.getNextTempId(); }
        if (typeof content === "undefined") { content = ""; }
        this.saver = saver;
        this.id = id;
        this.content = content;
        var _this = this;
        var that = this;
        this.element = $("<div data-role='collapsible' data-iconpos='right'></div>");
        this.headline = $("<h3>" + this.getHeadline() + "</h3>");
        this.element.append(this.headline);
        this.textarea = $("<textarea>" + this.content + "</textarea>");
        this.textarea.keyup(function () {
            that.setContent(that.getContent(), false);
        });
        this.textarea.keyup(_.debounce(function () {
            return saver.save(_this);
        }, 300));
        this.element.append(this.textarea);
        var deleteButton = $("<a href='javascript:void(0)' class='button' data-role='button' data-icon='delete' data-inline='true'>Delete</a>");
        deleteButton.click(function () {
            that.saver.deleteNote(that.id);
            return false;
        });
        this.element.append(deleteButton);
        var saveButton = $("<a href='index.html' class='saveButton button' data-role='button' data-icon='check' data-theme='b' data-inline='true'>Save</a>");
        saveButton.click(function () {
            that.saver.save(that);
            that.collapse();
            return false;
        });
        this.element.append(saveButton);
        this.element.bind('expand', function () {
            $(this).children().slideDown(400);
        }).bind('collapse', function () {
            $(this).children().next().slideUp(400);
        });
    }
    Note.tmpIdCounter = 0;
    Note.prototype.setContent = function (content, updateTextarea) {
        if (typeof updateTextarea === "undefined") { updateTextarea = true; }
        this.content = content;
        this.updateHeadline();
        if(updateTextarea) {
            this.textarea.text(content);
        }
    };
    Note.prototype.getContent = function () {
        return this.textarea.val();
    };
    Note.prototype.updateHeadline = function () {
        var headline = this.getHeadline();
        if(headline.length == 0) {
            this.headline.find(".ui-btn-inner").css({
                height: "20px",
                display: "block"
            });
        }
        this.headline.find(".ui-btn-text").text(headline);
    };
    Note.prototype.collapsed = function () {
        return this.element.hasClass("ui-collapsible-collapsed");
    };
    Note.prototype.hasFocus = function () {
        return this.element.find("textarea:focus, .button:focus").length != 0;
    };
    Note.prototype.collapse = function () {
        if(!this.collapsed()) {
            this.headline.click();
        }
    };
    Note.prototype.destroy = function () {
        this.element.remove();
    };
    Note.prototype.serialize = function () {
        var content = this.getContent();
        // Escaping some stuff.
        content = content.replace(/&/g, '&amp;');
        content = content.replace(/\"/g, '&#34;');
        content = content.replace(/\n/g, '&newLine;');
        var serialized = {
            content: content
        };
        return JSON.stringify(serialized);
    };
    Note.deSerializeToNew = function deSerializeToNew(id, noteString, saver) {
        var note = new Note(saver);
        note.deSerializeIntoThis(id, noteString);
        return note;
    }
    Note.prototype.deSerializeIntoThis = function (id, noteString) {
        var note;
        try  {
            note = JSON.parse(noteString);
        } catch (e) {
            console.log("Catched: " + e);
            note = new Note(this.saver, id);
        }
        var content = note.content;
        // Unescaping.
        content = content.replace(/&newLine;/g, '\n');
        content = content.replace(/&#34;/g, '"');
        content = content.replace(/&amp;/g, '&');
        this.setContent(content);
        this.id = id;
    };
    Note.prototype.getHeadline = function () {
        return this.content ? this.content.split(/\n/g)[0] : "";
    };
    Note.getNextTempId = function getNextTempId() {
        Note.tmpIdCounter++;
        return "tmpID" + Note.tmpIdCounter + new Date().getTime().toString();
    }
    return Note;
})();
var NewNote = (function (_super) {
    __extends(NewNote, _super);
    function NewNote(saver, notes) {
        _super.call(this, saver, Note.getNextTempId(), "New note");
        var that = this;
        this.element.one("expand", function () {
            saver.add(that.id)// h�ns
            ;
            NewNote.removeContentOverTime(that, 400, function () {
                that.textarea.focus();
                notes.addFirst(new NewNote(saver, notes));
            });
        });
    }
    NewNote.removeContentOverTime = function removeContentOverTime(note, time, callback) {
        var content = note.getContent();
        var orgsize = content.length;
        var timePrChar = time / orgsize;
        var timeCounter = 0;
        for(var i = orgsize - 1; i >= 0; i--) {
            (function () {
                var index = i;
                timeCounter += timePrChar;
                setTimeout(function () {
                    note.setContent(content.slice(0, index));
                    if(index == 0) {
                        if($.isFunction(callback)) {
                            callback();
                        }
                    }
                }, timeCounter);
            })();
        }
    }
    return NewNote;
})(Note);

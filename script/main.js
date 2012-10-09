/// <reference path="jquery.d.ts" />
/// <reference path="server.ts" />
/// <reference path="mobile.ts" />
/// <reference path="basic.ts" />
/// <reference path="notes.ts" />
/// <reference path="savehandler.ts" />
/// <reference path="keyboard.ts" />
var scripts = [
    "http://webbies.dk/assets/files/SudoSlider/package/js/jquery.sudoSlider.min.js", 
    
];
/* "script/server/server.js",  */
/* "script/mobile.js",  */
/* "script/notes.js",  */
/* "script/savehandler.js",  */
/* "script/keyboard.js",  */ ScriptLoader.loadScripts(scripts, function () {
    $(document).ready(function () {
        var notes = new Notes($("#notes"));
        var saver = new SaveHandler(new Server("backend.php"), notes);
        saver.initiate();
        var newNote = new NewNote(saver, notes);
        notes.addFirst(newNote, false);
        new KeyboardHandler();
    });
});

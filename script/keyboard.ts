interface JQuery {
    nodeName() : string;
}
$.fn.nodeName = function () {
    var res;
    $(this).each(function (index, elem) {
        res = elem.nodeName.toLowerCase();
    });
    return res;
};
class KeyboardHandler {
    constructor () {
        throw 2;
        var that = this;
        var isCtrl = false;
        $(document).keyup(function (e) {
            if (e.which == 17) isCtrl = false;
        });
        // A little fix to make it work.  
        $(window).blur(function () {
            isCtrl = false;
        });
        $(document).keydown(function (e) {
            /* var hovered = $(".ui-focus");
            if (hovered.length == 0) {
                hovered = $(".ui-btn-hover-c:not(.button)");
            }
            else {
                if ($(".ui-focus:not(.button)").length == 0) {
                    hovered = $(".ui-btn-hover-c:not(.button)");
                }
            } */ 
            if (e.which == 17) isCtrl = true;
            else if (e.which == 83 && isCtrl == true) {
                // Ctrl + s
                var focusTextarea = $('textarea:focus');
                if (focusTextarea.length) {
                    focusTextarea.parent().find('.saveButton').click();
                } 
                return false;
            }
            /* else if (e.which == 13) {
                // Enter
                if ($(".ui-focus").length == 0) {
                    $(".ui-btn-hover-c").each(function (index, elem) {
                        if (elem.nodeName.toLowerCase() === "li") {
                            $(elem).find("a").click();
                        }
                        else {
                            $(elem).parent().click();
                        }
                    });
                }
            }
            // up: 38 down: 40
            else if (e.which == 38) {
                if (hovered.length == 0) {
                    that.selectLastLoginControl();
                } else {
                    hovered.removeClass("ui-focus");
                    if (hovered.nodeName() === "a") {
                        var prev = hovered.parent().parent().prev();
                        if (prev.length == 0) {
                            that.selectLastLoginControl();
                        } else {
                            prev.children().children("a:not(.button)").addClass("ui-focus");
                        }
                    }
                    else {
                        var prev = hovered.prev(":not(.title)");
                        if (prev.length == 0) {
                            that.selectLastNote();
                        } else {
                            prev.addClass("ui-focus");
                        }
                    }
                }
            }
            else if (e.which == 40) {
                if (hovered.length == 0) {
                    that.selectFirstNote();
                } else {
                    hovered.removeClass("ui-focus");
                    if (hovered.nodeName() === "a") {
                        var next = hovered.parent().parent().next();
                        if (next.length == 0) {
                            that.selectFirstLoginControl();
                        } else {
                            next.children().children("a:not(.button)").addClass("ui-focus");
                        }
                    }
                    else {
                        var next = hovered.next(":not(.title)");
                        if (next.length == 0) {
                            that.selectFirstNote();
                        } else {
                            next.addClass("ui-focus");
                        }
                    }
                }
            } */
        });
    }
    /* private selectLastNote() {
        $("#notes > :last a:not(.button)").addClass("ui-focus");
    }
    private selectFirstNote() {
        $("#notes > :first a:not(.button)").addClass("ui-focus");
    }
    private selectLastLoginControl() {
        $("#LoginControls > :not(.title):visible:last").addClass("ui-focus");
    }
    private selectFirstLoginControl() {
        $("#LoginControls > :not(.title):visible:first").addClass("ui-focus");
    } */
}
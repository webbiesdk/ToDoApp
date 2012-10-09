var Mobile;
(function (Mobile) {
    var Loading = (function () {
        function Loading() { }
        Loading.show = function show(text) {
            if (typeof text === "undefined") { text = "Loading"; }
            $.mobile.loading('show', {
                text: text,
                textVisible: true,
                theme: "a",
                textonly: false
            });
        }
        Loading.hide = function hide() {
            $.mobile.loading("hide");
        }
        return Loading;
    })();
    Mobile.Loading = Loading;    
})(Mobile || (Mobile = {}));


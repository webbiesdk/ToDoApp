/// <reference path="jquery.d.ts" />
/// <reference path="basic.ts" />
// jQuery mobile specefic stuff. 
interface JQueryStatic {
    mobile: any;
}
module Mobile {
    export class Loading {
        static public show(text? = "Loading") {
            $.mobile.loading( 'show', {
				text: text,
				textVisible: true,
				theme: "a",
				textonly: false 
		    });
        } 
        public static hide() {
            $.mobile.loading("hide");
        }
    }
}
// In this file we define all the basics that we need, like the script loader. 

/// <reference path="jquery.d.ts" />
class Entry {
    constructor (public key: String, public value: any) { }
}

class HashMap {
    private map: Entry[][] = [];
    private size = 0;
    constructor (private maxSize? = 10) { }
    public get(key: String): any {
        var array = this.map[this.stringHash(key, this.maxSize)];
         
        if (typeof array === "undefined")
            return;
        var res;
        $.each(array, function (index: number, value: Entry) {
            if (value.key == key) {
                res = value.value;
                return false; // break;
            }
        });
        return res;
    }
    public put(key: String, value): void {
        var hash = this.stringHash(key, this.maxSize);
        if (typeof this.map[hash] === "undefined") {
            this.map[hash] = [];
        }
        this.map[hash].push(new Entry(key, value));
        this.size++;
        // Expading if there is to much content for a to little array. Rehashing everything. 
        if (this.size > this.maxSize) {
            this.rehashTo(this.maxSize * 2 + 2);
        }

    }
    public remove(key: String) : bool {
        var array = this.map[this.stringHash(key, this.maxSize)];
        if (typeof array === "undefined")
            return false;
        var found = false;
        $.each(array, function (index: number, value: Entry) {
            if (value.key == key) {
                array.splice(index, 1);
                found = true;
                this.size--;
                return false; // break;
            }
        });
        if (this.size < this.maxSize / 2) {
            this.rehashTo(Math.max(this.maxSize / 2, 10));
        }
        return found;
    }
    private rehashTo(newSize: number) {
        var newMap = new HashMap(newSize);
        $.each(newMap.map, function (index, value) {
            $.each(value, function (index, value : Entry) {
                newMap.put(value.key, value.value);
            });
        });
        this.map = newMap.map;
        this.size = newMap.size;
        this.maxSize = newMap.maxSize;
    }
    private stringHash(string: String, maxHash : number) {
        var hash = 0;
        if (string.length == 0) return hash;
        for (var i = 0; i < string.length; i++) {
            var character = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + character;
            hash = hash & hash; // Convert to 32bit integer
        }
        if (hash < 0) {
            hash = -hash;
        }
        // Not to big.
        hash = hash % this.maxSize;
        return hash;
    }
}
class ScriptLoader {
    private static scriptsFolder = "script/";
    private static loadedScripts = new HashMap();
    private static getScript(url: String, callback: Function, cache: bool) {
        $.ajax({
            type: "GET",
            url: url,
            success: callback,
            dataType: "script",
            cache: cache
        });
    }
    public static loadScripts(resources, callback) {
        if (Array.isArray(resources)) {
            var scripts = [];
            $.each(resources, function (index, value) {
                if (loadedScripts.get(value) !== true) {
                    scripts.push(value);
                } 
            });
            var size = scripts.length; 
            if (size == 0) {
                callback && callback();
            }
            else {
                var count = 0;
                $.each(scripts, function (index, value) {
                    ScriptLoader.getScript(value, function () {
                        count++;
                        if (count === size) {
                            callback && callback();
                        }
                    }, true);
                });
            }
        }
        else {
            ScriptLoader.loadScripts([resources], callback);
        }
    }
}
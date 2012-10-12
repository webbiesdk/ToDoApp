// In this file we define all the basics that we need, like the script loader. 

/// <reference path="jquery.d.ts" />
class Entry {
    constructor (public key: string, public value: any) { }
}

class HashMap {
    private map: Entry[][] = [];
    private length = 0;
    constructor (private maxSize? = 10, private maxFill? = 3) { }
    public get(key: string): any {
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
    public put(key: string, value): any {
        var hash = this.stringHash(key, this.maxSize);
        if (typeof this.map[hash] === "undefined") {
            this.map[hash] = [];
        }
        var array = this.map[hash];
        var replaced;
        $.each(array, function (index, entry: Entry) {
            if (entry.key == key) {
                replaced = entry.value;
                entry.value = value;
            }
        });
        if (typeof replaced === "undefined") {
            array.push(new Entry(key, value));
            this.length++;
        }
        // Expading if there is to much content for a to little array. Rehashing everything. 
        if (this.length > (this.maxSize * this.maxFill)) {
            this.rehashTo(this.maxSize * 2 + 2);
        }
        return replaced;
    }
    public remove(key: string) : bool {
        var array = this.map[this.stringHash(key, this.maxSize)];
        if (typeof array === "undefined")
            return false;
        var found = false;
        var that = this;
        $.each(array, function (index: number, value: Entry) {
            if (value.key == key) {
                array.splice(index, 1);
                found = true;
                that.length--;
                return false; // break;
            }
        });
        if (this.length < this.maxSize) {
            this.rehashTo(Math.max(this.maxSize / 2, 10));
        }
        return found;
    }
    public size() {
        return this.length;
    }
    public getEntryArray() {
        var res: Entry[] = [];
        $.each(this.map, function (index, value) {
            if (typeof value !== "undefined") {
                $.each(value, function (index, value) {
                    res.push(value);
                });
            }
        });
        return res;
    }
    public serialize(translator?: Function): string {
        var res = {};
        $.each(this.getEntryArray, function (index, entry: Entry) {
            var savedValue = entry.value;
            if ($.isFunction(translator)) {
                savedValue = translator(savedValue);
            }
            res[entry.key] = savedValue;
        });
        return JSON.stringify(res);
    }
    public deserialize(map: string, translator? : Function): void {
        this.clear();
        var that = this;
        $.each(JSON.parse(map), function (index, value) {
            if ($.isFunction(translator)) {
                value = translator(value);
            }
            that.put(index, value);
        });
    }
    public clear(): void {
        this.length = 0;
        this.map = [];
    }
    public getSome() : Entry {
        var gotIt: bool = false;
        var res;
        $.each(this.map, function (index, value) {
            if (typeof value !== "undefined") {
                $.each(value, function (index, value) {
                    res = value;
                    gotIt = true;
                    return false;
                });
            }
            if (gotIt) {
                return false;
            }
        });
        return res;
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
    private stringHash(string: string, maxHash : number) {
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
    private static getScript(url: string, callback: Function, cache: bool) {
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
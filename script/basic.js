// In this file we define all the basics that we need, like the script loader.
/// <reference path="jquery.d.ts" />
var Entry = (function () {
    function Entry(key, value) {
        this.key = key;
        this.value = value;
    }
    return Entry;
})();
var HashMap = (function () {
    function HashMap(maxSize) {
        if (typeof maxSize === "undefined") { maxSize = 10; }
        this.maxSize = maxSize;
        this.map = [];
        this.size = 0;
    }
    HashMap.prototype.get = function (key) {
        var array = this.map[this.stringHash(key, this.maxSize)];
        if(typeof array === "undefined") {
            return;
        }
        var res;
        $.each(array, function (index, value) {
            if(value.key == key) {
                res = value.value;
                return false;// break;
                
            }
        });
        return res;
    };
    HashMap.prototype.put = function (key, value) {
        var hash = this.stringHash(key, this.maxSize);
        if(typeof this.map[hash] === "undefined") {
            this.map[hash] = [];
        }
        this.map[hash].push(new Entry(key, value));
        this.size++;
        // Expading if there is to much content for a to little array. Rehashing everything.
        if(this.size > this.maxSize) {
            this.rehashTo(this.maxSize * 2 + 2);
        }
    };
    HashMap.prototype.remove = function (key) {
        var array = this.map[this.stringHash(key, this.maxSize)];
        if(typeof array === "undefined") {
            return false;
        }
        var found = false;
        $.each(array, function (index, value) {
            if(value.key == key) {
                array.splice(index, 1);
                found = true;
                this.size--;
                return false;// break;
                
            }
        });
        if(this.size < this.maxSize / 2) {
            this.rehashTo(Math.max(this.maxSize / 2, 10));
        }
        return found;
    };
    HashMap.prototype.getEntryArray = function () {
        var res = [];
        $.each(this.map, function (index, value) {
            if(typeof value !== "undefined") {
                $.each(value, function (index, value) {
                    res.push(value);
                });
            }
        });
        return res;
    };
    HashMap.prototype.rehashTo = function (newSize) {
        var newMap = new HashMap(newSize);
        $.each(newMap.map, function (index, value) {
            $.each(value, function (index, value) {
                newMap.put(value.key, value.value);
            });
        });
        this.map = newMap.map;
        this.size = newMap.size;
        this.maxSize = newMap.maxSize;
    };
    HashMap.prototype.stringHash = function (string, maxHash) {
        var hash = 0;
        if(string.length == 0) {
            return hash;
        }
        for(var i = 0; i < string.length; i++) {
            var character = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + character;
            hash = hash & hash// Convert to 32bit integer
            ;
        }
        if(hash < 0) {
            hash = -hash;
        }
        // Not to big.
        hash = hash % this.maxSize;
        return hash;
    };
    return HashMap;
})();
var ScriptLoader = (function () {
    function ScriptLoader() { }
    ScriptLoader.scriptsFolder = "script/";
    ScriptLoader.loadedScripts = new HashMap();
    ScriptLoader.getScript = function getScript(url, callback, cache) {
        $.ajax({
            type: "GET",
            url: url,
            success: callback,
            dataType: "script",
            cache: cache
        });
    }
    ScriptLoader.loadScripts = function loadScripts(resources, callback) {
        if(Array.isArray(resources)) {
            var scripts = [];
            $.each(resources, function (index, value) {
                if(ScriptLoader.loadedScripts.get(value) !== true) {
                    scripts.push(value);
                }
            });
            var size = scripts.length;
            if(size == 0) {
                callback && callback();
            } else {
                var count = 0;
                $.each(scripts, function (index, value) {
                    ScriptLoader.getScript(value, function () {
                        count++;
                        if(count === size) {
                            callback && callback();
                        }
                    }, true);
                });
            }
        } else {
            ScriptLoader.loadScripts([
                resources
            ], callback);
        }
    }
    return ScriptLoader;
})();

const cssClass_RainbowText = "rainbowtext";
const cssClass_RainbowText3D = "rainbowtext3D";

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function IsParameterEnabled(name, url) {
    var param = getParameterByName(name, url);
    if (param == null) return false;
    
    param = param.toLocaleLowerCase();
    if (param == "1") return true;
    if (param == "yes") return true;
    if (param == "on") return true;
    if (param == "true") return true;
    if (param == "active") return true;
    if (param == "enable") return true;
    if (param == "enabled") return true;

    return true;
}

function setInnerHtml(className, text){
    var elements = document.getElementsByClassName(className);
    for(var i = 0; i < elements.length; i++)
    {
       elements.item(i).innerHTML = text;
    }
}

function addClassFor(className, newClassName){
    var elements = document.getElementsByClassName(className);
    for(var i = 0; i < elements.length; i++)
    {
        elements.item(i).classList.add(newClassName);
    }
}

function removeClassFor(className, oldClassName)
{
    var elements = document.getElementsByClassName(className);
    for(var i = 0; i < elements.length; i++)
    {
        elements.item(i).classList.remove(oldClassName);
    }
}

function forceRedraw(element){
    var disp = element.style.display;
    element.style.display = 'none';
    var trick = element.offsetHeight;
    element.style.display = disp;
};
  
function redraw(){
    var testimonials = document.querySelectorAll('.acrylic');
    Array.prototype.forEach.call(testimonials, function(elements, index) {
        forceRedraw(elements);
    });
};

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

class CSS {
    static blur(val)
    {
        return `blur(${val}px)`; 
    }

    static rgba(color)
    {
        return `rgba(${color.red}, ${color.green}, ${color.blue}, ${color.alpha})`;
    }

    static url(url)
    {
        return `url("${url}")`;
    }

    static property(param, value)
    {
        return `${param}: ${value}; `;
    }
    
    static definition(cssSelector, cssParams)
    {
        return `${cssSelector} { ${cssParams} }`;
    }
}

class URLQueryParameter
{
    constructor(name, url=null) {
        this.url = url ? url : window.location.href;
        this.name = name;
    }

    get enabled() {
        var v = this.value;
        if (v == null) return false;

        v = v.toLocaleLowerCase();
        if (v == "1") return true;
        if (v == "yes") return true;
        if (v == "on") return true;
        if (v == "true") return true;
        if (v == "active") return true;
        if (v == "enable") return true;
        if (v == "enabled") return true; 

        return false;
    }
    
    get value()
    {
        name = this.name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(this.url);

        if (!results) return null;
        if (!results[2]) return '';

        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    get exists()
    {
        return this.value != null;
    }

    is(...values)
    {
        var a = this.value ? this.value.toLocaleLowerCase() : this.value;
        for (var i = 0; i < values.length; i++) {
            var b = values[i] ? values[i].toLocaleLowerCase() : values[i];
            if (a == b) return true;
        }
    }

    static Get(name, url=null) {
        return new URLQueryParameter(name, url);
    }

    static getValue(name, url) {
        var p = new URLQueryParameter(name, url);
        return p.value;
    }
}

class Site {
    static setElement(identifier, type)
    {
        var elemnt = document.getElementById(identifier)
        if (elemnt == null) 
        {
            elemnt = document.createElement(type);
            document.body.appendChild(elemnt);
        }

        return elemnt;
    }

    static setImg(identifier, url, css=""){
        var img = this.setElement(identifier, 'img');
        
        img.setAttribute('id', identifier);
        img.setAttribute('src', url);
        if (css.length > 0) img.setAttribute('style', css);

        return img;
    }
    
    static setStyle(identifier, css){
        var style = this.setElement(identifier, 'style');

        style.type = 'text/css';
        style.setAttribute('id', identifier);
        style.innerHTML = css;

        return style;
    }

    static removeElement(identifier)
    {
        var def = document.getElementById(identifier)
        if (def != null) def.remove();
    }

    static Parameter(name)
    {
        return URLQueryParameter.Get(name);
    }

}

class Session
{
    static get storageKeyLoad()
    {
         return Storage.keyPrefix + "session.loadTimestamp";
    }

    static get storageKeyUnload()
    {
         return Storage.keyPrefix + "session.unloadTimestamp";
    }

    static updateLoadTimestamp()
    {
        var timestamp = Date.now().toString();
        Storage.session.set(Session.storageKeyLoad, timestamp);
    }

    static updateUnloadTimestamp()
    {
        var timestamp = Date.now().toString();
        Storage.session.set(Session.storageKeyUnload, timestamp);
    }

    static get deltaTime()
    {
        var l = Session.loadTimestamp;
        var u = Session.lastUnloadTimestamp;

        //console.log("[Session] unload: " + u);
        //console.log("[Session] load: " + l);

        if (u == null)
        {
            console.log("[Session] New");
            return Infinity;
        }

        var d = l - u;
        //console.log("[Session] delta: " + d + "ms");

        return d;
    }

    static get isSamePage()
    {
        return Session.deltaTime < 500;
    }

    static get loadTimestamp()
    {
        var timestamp = Storage.session.get(Session.storageKeyLoad);
        return timestamp != null ? Number(timestamp) : null;
    }

    static get lastUnloadTimestamp()
    {
        var timestamp = Storage.session.get(Session.storageKeyUnload);
        return timestamp != null ? Number(timestamp) : null;
    }
}
window.onload = function(){ Session.updateLoadTimestamp(); };
window.onunload = function(){ Session.updateUnloadTimestamp(); };

class Storage
{
    static get keyPrefix()
    {
        return "icelane.acrylic.";
    }

    static get local()
    {
        return new Storage(window.localStorage);
    }

    static get session()
    {
        return new Storage(window.sessionStorage);
    }

    constructor(storage) {	
        this.__storage = storage;
    }

    get storage()
    {
        return this.__storage;
    }

    get(name)
    {
        return this.storage.getItem(name);
    }

    delete(name)
    {
        this.storage.removeItem(name);
    }

    set(name, value)
    {
        this.storage.setItem(name, value);
    }
}

class Cookies
{
    //"test=2; G_ENABLED_IDPS=google"

    static get list()
    {
        var cookies = document.cookie.split(";");
        var list = [];
        for (var e in cookies)
        {
                var n = cookies[e].split("=");
                list.push(n[0]);
        }
        return list;
    }

    static deleteAll()
    {
        var list = Cookies.list;
        for (var c in list)
        {
            Cookies.delete(list[c]);
        }
    }

    static get(name)
    {
        var list = document.cookie.split(";");
        for (var e in list)
        {
            var n = list[e].split("=");
            if (n[0] == name) return n[1];
        }
        return null;
    }

    static delete(name)
    {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }

    static set(name, value, path=null)
    {
        var _path = "";
        if (path) _path = `; path=${path}`
        var cookie = `${name}=${value}; SameSite=Lax ${_path}`;
        //console.log("Cookie: " + cookie);
        document.cookie = cookie;
    }
}

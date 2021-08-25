const cssClass_RainbowText = "rainbowtext";
const cssClass_RainbowText3D = "rainbowtext3D";

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


class UrlParameter{
    constructor(query, name) {
        this.query = query;
        this.name = name;
    }

    get value(){
        return this.query.value(this.name);
    }
    get enabled(){
        return this.query.enabled(this.name);
    }
    get empty()
    {
        var v = this.value;
        return v != null && v.length == 0;
    }

    get set()
    {
        this.query.set(this.name, value);
    }

    get has()
    {
        return this.query.has(this.name);
    }
    get exists()
    {
        return this.has;
    }

    is(...values)
    {
        var a = this.value ? this.value.toLocaleLowerCase() : this.value;
        for (var i = 0; i < values.length; i++) {
            var b = values[i] ? values[i].toLocaleLowerCase() : values[i];
            if (a == b) return true;
        }
        return false;
    }

    delete()
    {
        this.query.delete(this.name);
    }
}

class UrlParams
{
    constructor(url=null) {
        this.url = url ? url : window.location.search;
        this.query = new URLSearchParams(this.url);
    }

    get(name)
    {
        return new UrlParameter(this, name);
    }

    value(name)
    {
        return this.query.get(name);
    }

    enabled(name)
    {
        var v = this.value(name);
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

    set(name, value)
    {
        if (value == null) this.delete(name);
        else this.query.set(name, value);
    }

    delete(name)
    {
        this.query.delete(name);
    }

    has(name)
    {
        return this.value(name) != null;
    }

    toString()
    {
        return this.query.toString();
    }

    apply()
    {
        window.history.pushState( {name: name} , '', `?${this.toString()}` );
    }

    reset()
    {
        this.query = new URLSearchParams(this.url);
    }

    static getCurrent()
    {
        return new UrlParams(null);
    }
}

class Site {

    static __query = null;

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

    static get query()
    {
        if (Site.__query == null) Site.__query = UrlParams.getCurrent()
        return Site.__query;
    }

    static parameter(name)
    {
        return Site.query.get(name);
    }
    
    static setParameter(name, value)
    {
        Site.query.set(name, value);
        Site.query.apply();
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

class EdgeScroll
{
    constructor(element)
    {
        this.element = element;

        this.element.addEventListener("mouseenter", this.__enter.bind(this), false);
        this.element.addEventListener("mousemove", this.__move.bind(this), false);
        this.element.addEventListener("mouseleave", this.__leave.bind(this), false);

        this.timer = null;
        this.event = null;
    }

    __enter(ev)
    {
        if (this.timer != null) clearInterval(this.timer);
        this.event = ev;
        this.timer = setInterval(this.update.bind(this), 16);
    }
    __move(ev)
    {
        this.event = ev;
    }
    __leave()
    {
        clearInterval(this.timer);
    }

    update()
    {
        var e = this.element;
        var l = this.event.x <= (20);
        var r = this.event.x >= (e.clientWidth - 20);

        if (l && e.scrollLeft > 0)
        {
            e.scrollLeft -= 2;
        }
        if (r && e.scrollLeft < e.scrollWidth)
        {
            e.scrollLeft += 2;
        }
    }
}

class HTTP
{
    static async requestText(url, contentType=null)
    {
        return await fetch(url)
            .then((response) =>
            {
                if (contentType != null)
                {
                    var type = response.headers.get('Content-Type');
                    if (type != contentType) throw new Error("Unexpected content type: " + type);
                }

                return response.text();
            })
            .then((text) => { return text; })
            .catch((err) => { throw err; });
    }

    static async requestHTML(url) { return HTTP.requestText(url, 'text/html'); }
    static async requestPlainText(url) { return HTTP.requestText(url, 'text/plain'); }
}

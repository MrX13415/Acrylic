

class Article
{
    constructor(name)
    {
        this.name = name;
        this.url = `./articles/${name}.txt`;
        this.rawinput = null;

        this.title = "";
        this.sources = [];

        this.headline = "";
        this.author;
        this.date;
        this.content = [];

        this.init();
    }
    static get(name) { return new Article(name); }

    static showListing()
    {
        var list = [
            { name: "(1899)NikolaTesla_Alles-ist-das-Licht", title: "Nikola Tesla - Alles ist das Licht" },
            { name: "NyeCounty_Brief-des-Vorsitzenden", title: "Ein Brief des Vorsitzenden des Nye County" }
        ];

        var content = document.getElementById("article-content");
        content.innerHTML = "<h2>Artikel:</h2>";

        for(var l of list)
        {
            var p = `<li> <a href="javascript:void(0)" onclick="loadArticle('${l.name}');">${l.title}</a> </li>`;
            content.innerHTML += p;
        }
    }

    init()
    {
        console.log("Article: " + this.name);
        var content = document.getElementById("article-content");
        content.innerHTML = "Artikel wird geladen ...";

        this.fetch();
    }

    fetch()
    {
        console.log("   fetching ...");
        let response = HTTP.requestPlainText(this.url);
        response.then((text) =>
        {
            this.rawinput = text;
            this.parse();
        })
        .catch((err) =>
        {
            console.error("Could not load article. Not found or invalid.", err);

            var content = document.getElementById("article-content");
            content.innerHTML = "Der Artikel wurde nicht gefunden!";
        });
    }

    parseTags(input)
    {
        var s = input.trim();

        var _brkS = 0;
        var _brkE = -1;

        while(_brkS >= 0)
        {
            // Find next tag ...
            _brkS = s.indexOf("[", _brkE + 1);
            _brkE = s.indexOf("]", _brkS);
            if (_brkE < 0) break;

            // Find content and args...
            var args = [s.substring(_brkS + 1, _brkE)];
            if (args[0].indexOf("|") >= 0) args = args[0].split("|");

            var keys = [];
            for(var a of args)
            {
                var _colon = a.indexOf(":");
                var _space = a.indexOf(" ");

                var key = a;
                var value = "";
                if (_colon > 0 && (_space < 0 || _colon < _space))
                {
                    key = a.substring(0, _colon).trim().toLowerCase();
                    value = a.substring(_colon + 1).trim();
                }

                keys.push([key, value]);
            }

            var o = this.parseArgs(keys, input);
            var lA = s.substring(0, _brkS);
            var lB = s.substring(_brkE + 1);

            if (o.init == "hx")
            {
                if (o.tag == "h1")
                {
                    this.headline = lB;
                    return "";
                }
                else s = lA + `<${o.tag}>${lB}</${o.tag}>`;
            }
            if (o.init == "hr") 
                s = lA + `<hr />` + lB;

            if (o.init == "img")
                s = lA + `<p class="img"><img src="./articles/${o.src}" alt="${o.txt}">${o.txt}</p>` + lB;

            if (o.init == "url")
                s = lA + `<a href="${o.href}">${o.txt}</a>` + lB;
        }

        return s;
    }
    parseArgs(keys)
    {
        var o = null;

        for(var k of keys)
        {
            var key = k[0];
            var value = k[1];

            var first = o == null;
            if (first) o = { init: key.toLowerCase() };

            // h1, h2, h3, ...
            if (o.init.length >= 2 && o.init[0] == "h" && /^\d+$/.test(o.init[1]))
            {
                if (first) o = { init: "hx", tag: key.toLowerCase() };
            }

            if (o.init == "img")
            {
                if (first) o = { init: key, src: value, txt: "" };
                else /*if (key == "txt")*/ o.txt = value;

            }

            if (o.init == "url")
            {
                if (first) o = { init: key, href: value, txt: "" };
                else /*if (key == "txt")*/ o.txt = value;
            }
        }

        return o;
    }

    parse()
    {
        console.log("   parsing ...");
        var header = true;

        var array = this.rawinput.split("\n");
        for(var line of array)
        {
            // Find header keys:
            // On line per key. Must be the first line of text using this scheme:
            // Key: value
            if (header)
            {
                if (line.trim().length == 0) continue;

                var _colon = line.indexOf(":");
                if (_colon < 0) header = false;

                if (header)
                {
                    var key = line.substring(0, _colon).toLowerCase();
                    var value = line.substring(_colon + 1);

                    if (key == "title") this.title = value;
                    if (key == "source") this.sources.push(value);
                    if (key == "author") this.author = value;
                    if (key == "date") this.date = value;
                    if (key == "lang_en" || key == "lang_de")
                    {
                        var translations = document.getElementById("article-translations");
                        var txt = "Übersetzung: ";
                        var lang = "Deutsch";
                        if(key == "lang_en")
                        {
                            var txt = "Original-Text: ";
                            var lang = "Englisch";
                        }

                        var p = `${txt}<a href="javascript:void(0)" onclick="loadArticle('${value.trim()}');">${lang}</a>`;

                        translations.innerHTML = p;
                    }
                }
            }
            if (header) continue;

            if (this.title.length > 0) document.title = `Article | ${this.title}`

            // Find headline line:
            // The first line directly followed be at least 3 empty lines.
            line = this.parseTags(line);

            this.content.push(line);
        }

        this.rawinput = null;
        this.loadContent();
    }

    loadContent()
    {

        var header = document.getElementById("article-title");
        header.innerHTML = this.headline;

        // ----

        var info = document.getElementById("article-info");
        var author = document.getElementById("article-author");
        var date = document.getElementById("article-date");

        if (this.author.length > 0) info.style = "";
        author.innerHTML = this.author;
        date.innerHTML = this.date;

        // ----

        var source = document.getElementById("article-source");
        var sources = document.getElementById("article-sources");

        sources.innerHTML = "";
        if (this.sources.length > 0) source.style = "";
        for(var line of this.sources)
        {
            var text = line;
            if (line.length > 80)
            {
                text = line.substring(0, 80) + "...";
            }

            var a = `<a href="${line}">${text}</a>`;
            sources.innerHTML += a;
        }

        // ----

        var content = document.getElementById("article-content");

        content.innerHTML = "";
        for(var line of this.content)
        {
            var p = "";

            var _colon = line.indexOf(":");
            var _space = line.indexOf(" ");

            if (_colon > 0 && (_space < 0 || _colon < _space))
            {
                var key = line.substring(0, _colon + 1);
                var value = line.substring(_colon + 1);

                p = `<p><b>${key} </b>${value}</p>`;
            }
            else
                p = `<p>${line}</p>`;

            content.innerHTML += p;
        }

        console.log("   OK");
    }

}

// ----------------------------------------

var article = null;
function loadArticle(name, history = true)
{
    if (history) window.history.pushState( {name: name} , '', `?a=${name}` );
    article = Article.get(name);
}
function loadListing()
{
    console.log("Show listing");

    var title = document.getElementById("article-title");
    var info = document.getElementById("article-info");
    var source = document.getElementById("article-source");
    title.innerHTML = "";
    info.style = "display: none;";
    source.style = "display: none;";

    document.title = `Article | Listing`
    window.history.pushState( {} , '', `` );

    article = null;
    Article.showListing();
}

window.addEventListener('error', onError, false);
window.addEventListener('load', onLoad, false);
window.addEventListener('popstate', onPopState, false);

function onPopState(event)
{
    var o = event.state;

    if (o.name == null) loadListing();
    else loadArticle(o.name, false);
}

function onError(error)
{
    console.log(error);
    alert(`Error: ${error.message} (${error.filename}:${error.lineno},${error.colno})`);
}

function onLoad(event)
{
    // This seems to be a bug somewhere:
    // On mobile, "setInterval" won't create a new thread
    // when this is used for the first time. 
    // To fix this. we just create a unsed intervale and clear it imidiatly.
    var tester = setInterval(function(){}, 250);
    clearInterval(tester);
    
    console.log("Page loaded");

    // ----------------------------------------
    // Init page


    console.log("Page ready");

    // ----------------------------------------
    // Parse url query parametes

    var query = Site.query;

    query.get('help')

    var help = Site.parameter('help');
    if (help.exists)
    {
        console.log("URL query parameters:");
        console.log("  a=<name>       - Load article with given name.");
    }

    var a = Site.parameter('a');
    if (a.exists) loadArticle(a.value);
    else loadListing();

    // ----------------------------------------

}

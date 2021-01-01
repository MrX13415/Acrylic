
class HSLColor {
    constructor(h=0, s=0, l=0, a=0) {
        this.hue = h;
        this.saturation = s;
        this.lightness = l;
        this.alpha = a;
    }

    static fromJSON(json) {
        return new HSLColor(json.hue, json.saturation, json.lightness, json.alpha);
    }

    clone()
    {
        return new HSLColor(this.hue, this.saturation, this.lightness, this.alpha);
    }

    get rgb()
    {
        return RGBColor.fromHSL(this, this.alpha);
    }
}

class RGBColor {
    constructor(r=0, g=0, b=0, a=0) {
        this.red = r;
        this.green = g;
        this.blue = b;
        this.alpha = a;
    }

    clone()
    {
        return new HSLColor(this.red, this.green, this.blue, this.alpha);
    }

    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes h, s, and l are contained in the set [0, 1] and
     * returns r, g, and b in the set [0, 255].
     */
    static fromHSL(hsl, alpha=0)
    {
        var r, g, b;
        var h, s, l;
        h = hsl.hue;
        s = hsl.saturation;
        l = hsl.lightness;

        if(s == 0){
            r = g = b = l; // achromatic
        }else{
            var hue2rgb = function hue2rgb(p, q, t){
                if(t < 0) t += 1;
                if(t > 1) t -= 1;
                if(t < 1.0/6.0) return p + (q - p) * 6 * t;
                if(t < 1.0/2.0) return q;
                if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6;
                return p;
            }
    
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1.0/3.0);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1.0/3.0);
        }
        
        var map = function(val){ return Math.min(Math.floor(val*256),255); };
        
        return new RGBColor(map(r), map(g), map(b), alpha);
    }
}


// --------------------

class ThemeDefinitions {

    static get themeDarkName()
    {
        return 'dark';
    }

    static get themeDefaultName()
    {
        return 'light';
    }

    static defaultColor(theme=null)
    {
        if (theme != null)
        {
            if (theme.name == this.themeDarkName) return new HSLColor(0, 0, 0, 0.7);
        }
        return new HSLColor(0, 0, 1, 0.3); // default theme / light theme;
    }

    static defaultBlur(theme=null)
    {
        if (theme != null)
        {
            if (theme.name == this.themeDarkName) return 14.0; //px
        }
        return 14.0; //px // default theme / light theme;
    }

    static styleIdentifierBackgroundFrontBuffer(theme) { return `themeStyleBackgroundFrontBuffer`; }
    static styleIdentifierBackgroundBackBuffer(theme) { return `themeStyleBackgroundBackBuffer`; }

    static cssSelectorBackground(theme)
    {
        return `${theme.cssClass} .parent::after, ${theme.cssClass} .overlay::after`;
    }
    static styleIdentifierColor(theme)
    {
        return `themeStyleColor_${theme.name}`;
    }

    static cssSelectorBlur(theme)
    {
        return `${theme.cssClass} .parent, ${theme.cssClass} .parent::before`;
    }
    static cssSelectorBlurOverlay(theme)
    {
        return `${theme.cssClass} .overlay, ${theme.cssClass} .overlay::before`;
    }
    static styleIdentifierBlur(theme)
    {
        return `themeStyleBlur_${theme.name}`;
    }
}

// --------------------

class SlideShow {
    constructor(themeBackground) {
        this.background = themeBackground;
        this.currentImgNum = 27;	
        this.timer = null;
        this.imgArray = new Array();
        this.interval = 20000;
    }

    get intervalStr()
    {
        return this.interval < 1000 ? (this.interval + "ms") : ((this.interval/1000) + " sec.");
    }

    get isActive()
    {
        return this.timer != null;
    }

    start(interval=-1)
    {
        if (interval > 0) this.interval = interval;
        if (this.interval < 100) this.interval = 100;
    
        this.timer = true;
        this.resetTimer();
        
        console.log("[Theme] Background slideshow started ... (" + this.intervalStr + ")");
    }

    resetTimer()
    {
        if (!this.isActive) return;

        clearTimeout(this.timer);
        this.timer = setInterval(this.next.bind(this), this.interval);
    }

    stop(){
        clearTimeout(this.timer);
        this.timer = null;
        console.log("[Theme] Background slideshow stopped");
    }

    next(force=false)
    {
        if (this.imgArray.length == 0) this.shuffle();
        var id = this.imgArray.pop(0);
        this.background.set(id, force);
    }

    shuffle()
    {
        for (var i=1; i <= 31; i++)
        {
            if (i == this.currentImgNum) continue;
            this.imgArray.push(i);
        }
        shuffle(this.imgArray);
    }

    compose()
    {
        var json =
        { 
            "isActive":this.isActive,
            "currentImgNum":this.currentImgNum,
        };
        return json;
    }

    parse(json)
    {
        this.currentImgNum = json.currentImgNum;
        this.background.skipNextTransition = true;
        this.background.set(this.currentImgNum);
        if (json.isActive) this.start();
        else this.stop();
    }
}

class ImageCache {
    constructor(themeBackground) {
        this.background = themeBackground;
        this.cache = new Array();

        this.url = "";
        this.timer = null;

        this.skipNextTransition = false;
    }

    get active() { return this.timer != null; }
 
    apply(url)
    {
        if (this.active) return;

        if (this.cache.includes(url)){
            this.finalize();
            return;
        }

        this.url = url;
        this.timer = setTimeout(this.load.bind(this), 0);
    }

    load()
    {
        if (this.url.length == 0) return;
        if (this.output) console.log("[Theme] Loading image ... (url: " + this.url + ")");

        var t = this;
        var img = new Image();
        img.onload = function()
        {
            t.finalize();
        };
        img.onerror = function(e)
        {
            console.error("[Theme] Image loading failed. (url: " + img.src +")");
            t.clean();
        };
        img.src = this.url;
    }

    clean()
    {
        clearTimeout(this.timer);
        this.timer = null;
        this.url = "";
    }

    finalize()
    {
        this.background.skipNextTransition = this.skipNextTransition;
        this.background.apply(this.url);
        this.skipNextTransition = false;
        this.clean();
    }

    addCache(url)
    {
        if (this.enabled) this.cache.push(url);
    }
}

class RainbowColor {
    constructor(manager) {
        this.manager = manager;
        this.timer = null;

        this.color = RainbowColor.defaultColor;
        this.steps = 0.001;
    }

    static get defaultColor()
    {
        return new HSLColor(0, 0.9, 0.4, 0.4);
    }

    reset()
    {
        this.color = RainbowColor.defaultColor;
    }

    get isActive()
    {
        return this.timer != null;
    }

    start(interval=33){
        clearInterval(this.timer);
        this.timer = setInterval(this.step.bind(this), interval);

        this.applyDefaults();
        console.log("[Theme] Rainbow started ...");
    }

    stop(){
        clearInterval(this.timer);
        this.timer = null;
        console.log("[Theme] Rainbow stopped");
    }

    step(){
        if (this.color.hue > 1) this.color.hue = 0;
        
        this.manager.themeDark.settings.color.hue = this.color.hue;
        this.manager.themeDark.settings.applyColor();
        this.manager.themeLight.settings.color.hue = this.color.hue;
        this.manager.themeLight.settings.applyColor();

        this.manager.settingsDialog.update();

        this.color.hue += this.steps;
    }

    applyDefaults()
    {
        this.manager.themeDark.settings.color.saturation = this.color.saturation;
        this.manager.themeDark.settings.color.lightness = this.color.lightness;
        this.manager.themeDark.settings.color.alpha = this.color.alpha;
        this.manager.themeLight.settings.color.saturation = this.color.saturation;
        this.manager.themeLight.settings.color.lightness = this.color.lightness;
        this.manager.themeLight.settings.color.alpha = this.color.alpha;
    }
}

// --------------------

class ThemeBackground {
    constructor() {	
        this.slideshow = new SlideShow(this);
        this.cache = new ImageCache(this);

        this.skipNextTransition = false;
        this.__trsSkipped = false;
        this.__trsState = false;
    }

    get element() { return document.getElementById("background"); }

    get frontBuffer() { return this.element.children[this.isSwaped ? 0 : 1]; }  // first element is bb
    get backBuffer() { return this.element.children[this.isSwaped ? 1 : 0]; }   // second element is fb
    get current() { return window.getComputedStyle(this.frontBuffer).getPropertyValue("background-image"); }

    get defaultBackground() { return window.getComputedStyle(document.body).getPropertyValue("background"); }

    swap(force) { return this.element.classList.toggle("swapbackground", force); }
    get isSwaped() { return this.element.classList.contains("swapbackground"); }

    setTransitionEnabled(enabled) { this.element.classList.toggle("backgroundtransition", enabled); }
    get isTransitionEnabled() { return this.element.classList.contains("backgroundtransition"); }

    apply(url)
    {
        if (url.length == 0) return;

        if (this.skipNextTransition)
        {
            if (!this.__trsSkipped) this.__trsState = this.isTransitionEnabled;
            this.__trsSkipped = true;
            this.setTransitionEnabled(false);
        }
        else
        {
            if (this.__trsSkipped) this.setTransitionEnabled(this.__trsState);
            this.__trsSkipped = false;
        }
        this.skipNextTransition = false;

        this.updateBuffer(url);
        this.swap();

        this.cache.addCache(url);

        // no url output when using internal images ...
        if (url[0] != "/") console.log("[Theme] Background: " + url);
    }
    
    updateBuffer(url)
    {
        if (!this.isSwaped)
        {
            Site.setStyle(ThemeDefinitions.styleIdentifierBackgroundBackBuffer(),
                CSS.definition("#background div:nth-child(1)", 
                    CSS.property("background-image", CSS.url(url))
                )
            );
        }
        if (this.isSwaped)
        {
            Site.setStyle(ThemeDefinitions.styleIdentifierBackgroundFrontBuffer(),
                CSS.definition("#background div:nth-child(2)", 
                    CSS.property("background-image", CSS.url(url))
                )
            );
        };

        var init = document.getElementById(ThemeDefinitions.styleIdentifierBackgroundFrontBuffer()) == null;
        if (init)
        {
            Site.setStyle(ThemeDefinitions.styleIdentifierBackgroundFrontBuffer(),
                CSS.definition("#background div:nth-child(2)", 
                    CSS.property("background", this.defaultBackground)
                )
            );
        };
    }

    set(num, force=false)
    {
        if (!force && this.cache.active) return;

        num = Number(num)
        if (!Number.isInteger(num))
        {
            console.log("Not a number! (" + num + ")");
            return;
        }
        if (num > 31) num = -1;
        if (num < 1)
        {
            console.log("Invalid image ID! Range: 1 - 31");
            num = 27;
        }

        this.slideshow.currentImgNum = num;
        this.setUrl('/style/img/back/img (' + num + ').jpg', force);

        console.log("[Theme] Background: Image #" + num);
    }

    setUrl(url, force=false)
    {
        if (!force && this.cache.active) return;
        if (url.length == 0) return;

        this.cache.skipNextTransition = this.skipNextTransition;
        this.cache.apply(url);
    }

    next(force=false)
    {
        this.slideshow.next(force);
        this.slideshow.resetTimer();
    }

    reset()
    {
        this.swap(false);
        Site.removeElement(ThemeDefinitions.styleIdentifierBackground());
        this.slideshow.resetTimer();
        this.setTransitionEnabled(true);
        return this;
    }
}

// --------------------

class ThemeSettings {
    constructor(theme, hsl=null, blur=0) {
        this.theme = theme;
        this.color = hsl != null ? hsl : new HSLColor();
        this.blur = blur;
    }

    clone()
    {
        return new ThemeSettings(this.theme, this.color.clone(), this.blur);
    }

    apply()
    {
        this.applyColor();
        this.applyBlur();
    }
    applyColor(){
        Site.setStyle(ThemeDefinitions.styleIdentifierColor(this.theme),
            CSS.definition(ThemeDefinitions.cssSelectorBackground(this.theme),
                CSS.property("background-color", CSS.rgba(this.color.rgb))
            )
        );
        return this;
    }
    applyBlur()
    {
        Site.setStyle(ThemeDefinitions.styleIdentifierBlur(this.theme),
            CSS.definition(ThemeDefinitions.cssSelectorBlur(this.theme),
                CSS.property("-webkit-backdrop-filter", CSS.blur(this.blur)) +
                CSS.property("backdrop-filter", CSS.blur(this.blur))
            ) +
            CSS.definition(ThemeDefinitions.cssSelectorBlurOverlay(this.theme),
                CSS.property("-webkit-backdrop-filter", CSS.blur(this.blur/2)) +
                CSS.property("backdrop-filter", CSS.blur(this.blur/2))
            )
        );
        return this;
    }

    reset()
    {
        this.resetColor(this.theme);
        this.resetBlur(this.theme);
        return this;
    }
    resetColor()
    {
        this.color = ThemeDefinitions.defaultColor(this.theme);
        Site.removeElement(ThemeDefinitions.styleIdentifierColor(this.theme));
        return this;
    }
    resetBlur()
    {
        this.blur = ThemeDefinitions.defaultBlur(this.theme);
        Site.removeElement(ThemeDefinitions.styleIdentifierBlur(this.theme));
        return this;
    }

    compose()
    {
        var json =
        { 
            "color":this.color,
            "blur":this.blur
        };
        return json;
    }

    parse(json)
    {
        this.color = HSLColor.fromJSON(json.color);
        this.blur = json.blur;
        this.apply();
    }
}

class Theme {
    constructor(manager, name=null) {		
        this.manager = manager;

        this.name = name;
        this.defaultTheme = false;
        if (name == null)
        {
            this.defaultTheme = true;
            this.name = ThemeDefinitions.themeDefaultName;
        }

        this.defaults = new ThemeSettings(this).reset();
        this.settings = this.defaults.clone();
    }

    clone()
    {
        var t = new Theme(this.manager, this.name);
        t.defaults = this.defaults.clone();
        t.settings = this.settings.clone();
        return t;
    }

    get cssClass()
    {
        if (this.defaultTheme) return '';
        return '.' + this.name;
    }

    get isActive()
    {
        return document.body.classList.contains(this.name);
    }

    setActive()
    {
        this.manager.setTheme(this);
    }

    add()
    {
        if (this.defaultTheme) return;
        if (!document.body.classList.contains(this.name)) document.body.classList.add(this.name);
    }

    remove()
    {
        if (this.defaultTheme) return;
        if (document.body.classList.contains(this.name)) document.body.classList.remove(this.name);
    }

    apply()
    {
        this.applyColor();
        this.applyBlur();
    }
    applyColor() { this.settings.applyColor(); }
    applyBlur() { this.settings.applyBlur(); }

    reset(apply=true)
    {
        this.settings = this.defaults.clone();
        if(apply) this.apply();
    }
}

class ThemeSettingsDialog {
    constructor(manager) {
        this.manager = manager;

        this.togglebtn;
        this.hueSlider;
        this.satSlider;
        this.lightSlider;
        this.alphaSlider;
        this.blurSlider;

        this.blurNotSupportedWarn; 
                
        this.nextImgBtn;
        this.slideshowSwitch;
        this.rainbowSwitch;
        this.resetBtn;

        this.targetTimer;
        this.targetTimerName;

        // -----

        this.timeLastApplyColor = 0;
        this.ctrlKey = false;
    }

    register()
    {
        this.tooglebtn = document.getElementById("tooglebtn");

        this.hueSlider = document.getElementById("colorHue");
        this.satSlider = document.getElementById("colorSat");
        this.lightSlider = document.getElementById("colorLight");
        this.alphaSlider = document.getElementById("colorAlpha");
        this.blurSlider = document.getElementById("blur");

        this.colorHueVal = document.getElementById("colorHueVal");
        this.colorSatVal = document.getElementById("colorSatVal");
        this.colorLightVal = document.getElementById("colorLightVal");
        this.colorAlphaVal = document.getElementById("colorAlphaVal");
        this.blurVal = document.getElementById("blurVal");

        this.colorHueEdit = document.getElementById("colorHueEdit");
        this.colorSatEdit = document.getElementById("colorSatEdit");
        this.colorLightEdit = document.getElementById("colorLightEdit");
        this.colorAlphaEdit = document.getElementById("colorAlphaEdit");
        this.blurEdit = document.getElementById("blurEdit");

        this.blurNotSupportedWarn = document.getElementById("blurNotSupportedWarn");
        
        this.nextImgBtn = document.getElementById("nextimgbtn");
        this.slideshowSwitch = document.getElementById("slideshowswitch");
        this.rainbowSwitch = document.getElementById("rainbowswitch");
        this.resetBtn = document.getElementById("colorResetBtn");

        this.targetTimer = document.getElementById("targetTimer");
        this.targetTimerName = document.getElementById("targetTimerName");

        // ----

        ThemeSettingsDialog.addEvent('click', this.onMateEditable.bind(this), 
            this.colorHueVal, 
            this.colorSatVal, 
            this.colorLightVal,
            this.colorAlphaVal,
            this.blurVal);
        ThemeSettingsDialog.addEvent('blur', this.onMateReadOnly.bind(this),
            this.colorHueEdit, 
            this.colorSatEdit, 
            this.colorLightEdit,
            this.colorAlphaEdit,
            this.blurEdit);
        ThemeSettingsDialog.addEvent('keyup', this.onMateKeyUp.bind(this),
            this.colorHueEdit, 
            this.colorSatEdit, 
            this.colorLightEdit,
            this.colorAlphaEdit,
            this.blurEdit);
        ThemeSettingsDialog.addEvent('keyup', this.onMateKeyUp.bind(this),
            this.hueSlider, 
            this.satSlider, 
            this.lightSlider,
            this.alphaSlider,
            this.blurSlider);

        ThemeSettingsDialog.addEvent('click', this.onToggleBtnClick.bind(this), this.tooglebtn);

        ThemeSettingsDialog.addEvent('input', this.onHueSliderChange.bind(this), this.hueSlider);
        ThemeSettingsDialog.addEvent('input', this.onSatSliderChange.bind(this), this.satSlider);
        ThemeSettingsDialog.addEvent('input', this.onLightSliderChange.bind(this), this.lightSlider);
        ThemeSettingsDialog.addEvent('input', this.onAlphaSliderChange.bind(this), this.alphaSlider);
        ThemeSettingsDialog.addEvent('input', this.onBlurSliderChange.bind(this), this.blurSlider);

        ThemeSettingsDialog.addEvent('click', this.onNextImgBtnClick.bind(this), this.nextImgBtn);
        ThemeSettingsDialog.addEvent('click', this.onSlideshowSwitch.bind(this), this.slideshowSwitch);
        ThemeSettingsDialog.addEvent('click', this.onRainbowSwitch.bind(this), this.rainbowSwitch);
        ThemeSettingsDialog.addEvent('click', this.onResetBtnClick.bind(this), this.resetBtn);

        // -----

        window.addEventListener('keydown', this.onKeyDown.bind(this), false);
        window.addEventListener('keyup', this.onKeyUp.bind(this), false);
    }

    static addEvent(event, func, ...controls)
    {
        for(var i in controls)
        {
            if (controls[i] == null) continue;
            controls[i].addEventListener(event, func, false);   
        }
    }

    onKeyDown(event)
    {
        this.ctrlKey = event.ctrlKey;
        this.resetBtn.classList.toggle("redbutton", this.ctrlKey);
    }

    onKeyUp(event)
    {
        this.ctrlKey = event.ctrlKey;
        this.resetBtn.classList.toggle("redbutton", this.ctrlKey);
    }
    
    onToggleBtnClick(event)
    {
        this.manager.setNextTheme();
        this.update();
        this.manager.save();
    }
    onHueSliderChange(event)
    {
        this.updateSliderValues(true, false, false, false, false);
        this.manager.current.settings.color.hue = this.hueSlider.value / 1000;
        this.apply(true, false);
        this.manager.save();
    }
    onSatSliderChange(event)
    {
        this.updateSliderValues(false, true, false, false, false);
        this.manager.current.settings.color.saturation = this.satSlider.value / 1000;
        this.apply(true, false);
    }
    onLightSliderChange(event)
    {
        this.updateSliderValues(false, false, true, false, false);
        this.manager.current.settings.color.lightness = this.lightSlider.value / 1000;
        this.apply(true, false);
        this.manager.save();
    }
    onAlphaSliderChange(event)
    {
        this.updateSliderValues(false, false, false, true, false);
        this.manager.current.settings.color.alpha = this.alphaSlider.value / 1000;
        this.apply(true, false);
        this.manager.save();
    }
    onBlurSliderChange(event)
    {
        this.updateSliderValues(false, false, false, false, true);
        this.manager.current.settings.blur = this.blurSlider.value / 10;
        this.apply(false, true);
        this.manager.save();
    }

    onMate(control, setvalue=false, select=true)
    {
        var mate = document.getElementById(control.getAttribute("data-mate"));
        var ctrl = control;
        var hidde = true;
        if (mate == null)
        {
            ctrl = document.getElementById(control.getAttribute("data-mateCtrl"));
            if (ctrl == null) return null;
            mate = control; 
            hidde = false;
        }

        var data = document.getElementById(mate.getAttribute("data-mateData"));
        var dataDiv = mate.getAttribute("data-mateDataDiv");
        if (dataDiv < 1) dataDiv = 1;
        if (data != null)
        {
            if (setvalue)
            {   
                data.value = mate.value.replace(",", ".") * dataDiv;
                this.updateSliderValues();
            }
            else
            {
                mate.value = data.value / dataDiv;
                mate.focus();
                setTimeout(function(){
                    if (select) mate.select();
                }, 1);
            }
        }

        ctrl.classList.toggle("hidden", hidde);
        mate.classList.toggle("hidden", !hidde);

        return mate;
    }
    onMateEditable(event)
    {
        this.onMate(event.target, false);
    }
    onMateReadOnly(event)
    {
        this.onMate(event.target, true);
    }
    onMateKeyUp(event)
    {
        if (event.key == "Enter") this.onMate(event.target, true);
        
        if (Number.isInteger(Number(event.key)) || event.key == "." || event.key == ",")
        {
            var c = event.target;
            var mate = null;
            if (mate) console.log(mate.classList.contains("hidden"));
            if (c == this.hueSlider) mate = this.onMate(this.colorHueVal, false, false);
            if (c == this.satSlider) mate = this.onMate(this.colorSatVal, false, false);
            if (c == this.lightSlider) mate = this.onMate(this.colorLightVal, false, false);
            if (c == this.alphaSlider) mate = this.onMate(this.colorAlphaVal, false, false);
            if (c == this.blurSlider) mate = this.onMate(this.blurVal, false, false);
            if (mate) mate.value = event.key;
        }
    }

    onSlideshowSwitch(event)
    {
        var ss = this.manager.background.slideshow;
        if (this.slideshowSwitch.checked && !ss.isActive) ss.start();
        if (!this.slideshowSwitch.checked && ss.isActive) ss.stop();
        this.manager.save();
    }
    onRainbowSwitch()
    {
        var rb = this.manager.rainbow;
        if (this.rainbowSwitch.checked && !rb.isActive) rb.start();
        if (!this.rainbowSwitch.checked && rb.isActive) rb.stop();
    }
    onNextImgBtnClick(event)
    {
        this.manager.background.next();
        this.manager.save();

        var index = 0;
        var delay = this.manager.background.isTransitionEnabled ? 10 : 0;
        var func = function()
        {
            var done = index++ > delay && !this.manager.background.cache.active;
            this.setEnabled(this.nextImgBtn, done);
            this.setBtnIconAnim_Spin3D(this.nextImgBtn, !done);
            if (done) clearInterval(timer);
        };
        var timer = setInterval(func.bind(this), 250);
    }
    onResetBtnClick(event)
    {
        var fullReset = this.ctrlKey;
        this.manager.reset(fullReset);
    }

    apply(color=true, blur=true)
    {
        var timeDiff = performance.now() - this.timeLastApply;
        if (timeDiff <= 5) return;  // max 200 updates per second.
        this.timeLastApply = performance.now();

        if (color) this.manager.current.applyColor();
        if (blur) this.manager.current.applyBlur();
    }

    update()
    {
        var s = this.manager.current.settings;
        
        this.hueSlider.value = s.color.hue * 1000;
        this.satSlider.value = s.color.saturation * 1000;
        this.lightSlider.value = s.color.lightness * 1000;
        this.alphaSlider.value = s.color.alpha * 1000;
        this.blurSlider.value = s.blur * 10;

        this.updateBlurSupported();

        this.updateSliderValues();
        this.updateButtonStates();
    }

    updateBlurSupported()
    {
        var support = ThemeManager.IsBlurSupported;

        if (!support) this.blurSlider.value = 0;
        this.blurNotSupportedWarn.classList.toggle('hidden', support);
        this.setEnabled(this.blurSlider, support);
    }

    updateButtonStates()
    {
        this.slideshowSwitch.checked = this.manager.background.slideshow.isActive;
        this.rainbowSwitch.checked = this.manager.rainbow.isActive;
    }
    
    updateSliderValues(h=true, s=true, l=true, a=true, b=true)
    {
        if (h) this.colorHueVal.innerHTML = Math.round(360 / 1000 * this.hueSlider.value * 10) / 10 + "° (" + this.hueSlider.value / 1000 + ")";
        if (s) this.colorSatVal.innerHTML = this.satSlider.value / 10 + "%";
        if (l) this.colorLightVal.innerHTML = this.lightSlider.value / 10 + "%";
        if (a) this.colorAlphaVal.innerHTML = this.alphaSlider.value / 10 + "%";
        if (b) this.blurVal.innerHTML = this.blurSlider.value / 10 + "px";
    }

    setEnabled(control, enabled)
    {
        if (control == null) return;
        if (!enabled) control.setAttribute("disabled", "true");
        else control.removeAttribute("disabled");
    }
	
	setBtnIconAnim_Spin3D(control, active)
	{
        if (control == null) return false;
        if (control.children.length == 0) return false;        
        var icon = control.getElementsByTagName('div')[0];
        if (icon == null) return false;
        icon.classList.toggle('anim-Spin3D', active);
        return true;
	}

    setButtonState(btn, active)
    {
        if (btn == null) return;
        btn.classList.toggle('buttonactive', active);
    }

    setButtonText(btn, text)
    {
        if (btn == null) return;
        btn.innerHTML = btn.innerHTML.replace(btn.innerText, text);
    }

    setButtonTextState(btn, txtTrue, txtFalse, state)
    {
        if (btn == null) return;
        var txt = btn.innerText;
        var on = txt.endsWith(txtTrue);
        var off = txt.endsWith(txtFalse);

        if (state && on) return;
        if (!state && off) return;

        if (on) txt = txt.substr(0, txt.length - txtTrue.length);
        if (off) txt = txt.substr(0, txt.length - txtFalse.length);

        this.setButtonText(btn, txt + (state ? txtTrue : txtFalse));
    }

    toggle()
    {
        var settings = document.getElementById("settings");
        var settingsbtn = document.getElementById("settingsbtn");
        settings.classList.toggle('hidden');
        settingsbtn.classList.toggle('buttonactive');
    }
}

class ThemeManager {
    constructor() {
        this.background = new ThemeBackground();
        this.rainbow = new RainbowColor(this);

        this.themeDark = new Theme(this, ThemeDefinitions.themeDarkName);
        this.themeLight = new Theme(this); // default theme (no seperate css class)
        
        this.default = this.themeDark;
        this.current = this.default;

        // Do not add the default theme explicitly to this list.
        this.themes = 
        [
            this.default,
            this.themeLight
        ];

        if (isCountDownPage)
        {
            this.default = this.themeLight;
            this.themes = 
            [
                this.default,
                this.themeDark
            ];

            this.default.defaults.color.alpha = 0.1;
            this.default.defaults.blur = 50;
            this.default.reset(false);
        }

        this.settingsDialog = new ThemeSettingsDialog(this);

        this.__loaded = false;
    }

    static get cookieKey()
    {
        return "theme";
    }

    static get storageKey()
    {
        return Storage.keyPrefix + "theme";
    }
    
    static get IsBlurSupported()
    {
        return "backdrop-filter" in document.body.style
            || "-webkit-backdrop-filter" in document.body.style;
    }
    
    initialize(load=true)
    {
        if (!ThemeManager.IsBlurSupported) console.warn("[Theme] Blur not supported.")
        this.settingsDialog.register();
        return this.__loaded = this.load();
    }

    get HasSettingsLoader()
    {
        return this.__loaded;
    }
    
    getThemeByName(name)
    {
        for(var index in this.themes)
        {
            var t = this.themes[index];
            if (t.name == name) return t;
        }
        return null;
    }

    getThemeIndex(theme)
    {
        return this.themes.indexOf(theme);
    }

    setThemeDark()
    {
        this.themeDark.setActive();
    }
    setThemeLight()
    {
        this.themeLight.setActive();
    }
    setThemeDefault()
    {
        this.default.setActive();
    }
    setTheme(theme)
    {
        this.current.remove();
        this.current = theme;
        this.current.add();

        var name = this.current.name;
        if (this.current.defaultTheme) name += " (default)";
        console.log(`[Theme] Set theme to: ${name}`);
    }

    setNextTheme(){
        var index = this.getThemeIndex(this.current);
        
        index++;
        if (index < 0) index = 0;
        if (index >= this.themes.length) index = 0;

        this.themes[index].setActive();
    }

    compose()
    {
        var json =
        { 
            "slideshow":this.background.slideshow.compose(),
            "light":{
                "settings":this.themeLight.settings.compose()
            },
            "dark":{
                "settings":this.themeDark.settings.compose()
            },
            "current":this.current.name
        };
        return JSON.stringify(json);
    }

    parse(str)
    {
        var json = JSON.parse(str);
        if (json == null) return;
        
        this.background.slideshow.parse(json.slideshow);

        var t = this.getThemeByName(json.current);
        if (t != null)
        {
            this.themeLight.settings.parse(json.light.settings);
            this.themeDark.settings.parse(json.dark.settings);
            this.setTheme(t);
        }
        else{
            console.log(`[Theme] Error: Unable to load theme '${json.current}'`);
        }

        this.settingsDialog.update();
        this.settingsDialog.updateButtonStates();
    }

    save()
    {
        //Cookies.set(ThemeManager.cookieKey, this.compose());
        Storage.local.set(ThemeManager.storageKey, this.compose());
    }

    load()
    {
        //var c = Cookies.get(ThemeManager.cookieKey);
        var c = Storage.local.get(ThemeManager.storageKey);
        if (c != null)
        {
            console.log("[Theme] Loading config ...");
            this.parse(c);
            return true;
        }
        // load/apply default ...
        this.background.next(); // init random default, as we removed the css default img.
        this.default.setActive();
        this.default.apply();
        return false;
    }

    reset(fullReset=false)
    {
        if (fullReset)
        {
            ThemeManager.delete();
            this.themeLight.settings.reset();
            this.themeDark.settings.reset();

            //this.background.reset();  // Do not reset because we then have a black background as we remove the def. css back img.
            if (!this.background.slideshow.isActive)
                this.background.slideshow.start();
                
            console.log("[Theme] Reset to default");
            this.default.setActive();
        }
        this.current.reset();

        if (this.rainbow.isActive) this.rainbow.applyDefaults();

        this.settingsDialog.update();
        if (!fullReset) this.save();
    }

    static delete()
    {
        Cookies.delete(ThemeManager.cookieKey);
        Cookies.deleteAll(); // We don't use em as of now!
        Storage.local.delete(ThemeManager.storageKey);
    }
}

// --------------------

const theme = new ThemeManager();
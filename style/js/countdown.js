
const cssClass_ASCIIArt = "asciiart";
const cssClass_CountdownDays = "countdowntext-days";

class DateTime
{
    static dateYear(year) {
        return new Date(year, 0, 1, 0, 0, 0);
    }

    static get nextYear() {
      return new Date().getFullYear() + 1;
    }

    static timeToday(time) {
        return DateTime.setTime(new Date(), time);
    }

    static setTime(dateobj, time) {
        var dateTime = new Date("2000-01-01 " + time);
        dateobj.setHours(dateTime.getHours(), dateTime.getMinutes(), dateTime.getSeconds());
        return dateobj;
    }
    static getTime(dateobj) {
        return dateobj.getHours().toString().padStart(2, '0') +
        ":" + dateobj.getMinutes().toString().padStart(2, '0');
    }
    static getDate(dateobj) {
        return dateobj.getFullYear().toString().padStart(4, '0') +
        "-" + (dateobj.getMonth() + 1).toString().padStart(2, '0') +
        "-" + dateobj.getDate().toString().padStart(2, '0');
    }

    static tomorrow(date = null) {
        if (date == null) date = new Date();
        var d = new Date(date);
        return d.setDate(d.getDate() + 1);
    }

    static AddHours(hours, dateobj = new Date())
    {
        var d = new Date();
        d.setHours(d.getHours() + hours);
        return d;
    }
}

class CountdownProfile {

    static profiles = [ 
        CountdownProfile.NewYear(),
        CountdownProfile.Lunch(),
        CountdownProfile.Custom()
    ];

    constructor(key="", buttonId="") {
        this.key = key;
        this.buttonId = buttonId;

        this.title = "Countdown";
        this.message = "";
        this.daily = false;
        this.targetDate = DateTime.dateYear(DateTime.nextYear);
        this.mode3D = false;
        this.modeASCII = false;

        this.locked_daily = false;
        this.locked_date = false;
        this.locked_time = false;
    }

    get date() {
        return DateTime.getDate(this.targetDate);
    }
    get datetime() {
        return this.date + " " + this.time;
    }
    set datetime(datetime) {
        this.targetDate = new Date(datetime);
    }

    set date(date) {
        this.datetime = date + " " + DateTime.getTime(this.targetDate);
    }

    get time()
    {
        return DateTime.getTime(this.targetDate);
    }
    set time(time)
    {
        // get target date of today for the given time.
        var dateToday = DateTime.timeToday(time);
        this.targetDate.setHours(dateToday.getHours(), dateToday.getMinutes(), dateToday.getSeconds());
    }

    is(profile)
    {
        return this.key == profile.key && this.buttonId == profile.buttonId;
    }

    get button() { return document.getElementById(this.buttonId); }

    setActive()
    {
        for (var p of CountdownProfile.profiles)
        {
            if (p.button == null) continue;
            CountdownProfile.setButtonState(p.button, p == this);
        }
        this.updateUrl();
    }

    loadUrl()
    {
        var title = Site.parameter('title');
        if (title.exists)
        {
            this.title = title.value;
            console.log("[Countdown] Title: '" + this.title + "'");
        }

        var date = Site.parameter('date');
        if (date.exists && !this.locked_date){
            this.date = date.value;
            console.log("[Countdown] Date: '" + this.date + "'");
        }

        var time = Site.parameter('time');
        if (time.exists && !this.locked_time)
        {
            this.time = time.value
            console.log("[Countdown] Time: '" + this.time + "'");
        }

        var daily = Site.parameter('daily');
        if (daily.exists && !this.locked_daily)
        {
            this.daily = daily.enabled;
            console.log("[Countdown] Daily: '" + this.daily + "'");
        }

        var msg1 = Site.parameter('msg');
        var msg2 = Site.parameter('message');
        var txt = Site.parameter('text');
        if (msg1.exists) txt = msg1;
        if (msg2.exists) txt = msg2;
        if (txt.exists)
        {
            this.message = txt.value;
            console.log("[Countdown] Messsage: '" + this.message + "'");
            if (title.exists) document.title = document.title.replace("New Year", txt.value);
        }
    }

    updateUrl()
    {
        Site.query.set("profile", this.key);
        Site.query.set("title", this.title);
        Site.query.set("date", this.date);
        Site.query.set("time", this.time);
        Site.query.set("daily", this.daily);
        Site.query.set("msg", this.message);
        Site.query.apply();
    }

	static profileKeys()
	{
		var keys = [];
		for (var p of CountdownProfile.profiles)
        {
            keys.push(p.key)
        }
		return keys;
	}
	
    static setButtonState(btn, active)
    {
        if (btn == null) return;
        btn.classList.toggle('buttonactive', active);
    }

    static get(key)
    {
        if (key == null) return null;
        if (CountdownProfile.profiles == null) return null;
        for (var p of CountdownProfile.profiles)
        {
            if (p.key == key) return p;
        }
        return null;
    }

    static getFromUrl()
    {
        var profile = Site.parameter('profile');
        if (!profile.has || profile.empty) return null;

        var p = CountdownProfile.get(profile.value);
        if (p == null) console.error("[Countdown] Profile: '" + profile.value + "' not found!");
        return p;
    }

    static getNew(key="", buttonId="", create)
    {
        var p = CountdownProfile.get(key);
        if (p == null)
        {
            p = new CountdownProfile(key, buttonId);
            create(p);
        }
        return p;
    }

    static Custom()
    {
        return CountdownProfile.getNew("custom", "profile_Custom", function(p)
        {
            p.targetDate = DateTime.AddHours(1);
        });
    }

    static NewYear()
    {
        return CountdownProfile.getNew("newyear", "profile_NewYear", function(p)
        {
            p.title = "New Year";
            p.message = "{year}";
            p.daily = false;
            p.targetDate = DateTime.dateYear(DateTime.nextYear);
            p.locked_daily = true;
            p.locked_date = true;
            p.locked_time = true;
        });
    }
    static Lunch()
    {
        return CountdownProfile.getNew("lunch", "profile_Lunch", function(p)
        {
            p.title = "Lunch";
            p.message = "🍽";
            p.daily = true;
            p.targetDate = DateTime.timeToday("12:00");
            p.mode3D = true;
            p.locked_daily = true;
            p.locked_date = true;
        });
    }

    static get ASCII_Cat()
    {
      return " _                        \n"
           + " \\`*-.                    \n"
           + "  )  _`-.                 \n"
           + " .  : `. .                \n"
           + " : _   '  \\               \n"
           + " ; *` _.   `*-._          \n"
           + " `-.-'          `-.       \n"
           + "   ;       `       `.     \n"
           + "   :.       .        \\    \n"
           + "   . \\  .   :   .-'   .   \n"
           + "   '  `+.;  ;  '      :   \n"
           + "   :  '  |    ;       ;-. \n"
           + "   ; '   : :`-:     _.`* ;\n"
           + ".*' /  .*' ; .*`- +'  `*' \n"
           + "`*-*   `*-*  `*-*'        ";
    }
}

    
class CountdownSettingsDialog {
    constructor(manager) {
        this.manager = manager;

        this.title;

        this.targetdate;
        this.targettime;

        this.dailyswitch;

        this.message;
    }

    register()
    {
        this.title = document.getElementById("countdowntitle");

        this.targetdatecontainer = document.getElementById("targetdatecontainer");  // For hidding
        this.targetdate = document.getElementById("targetdate");
        this.targettime = document.getElementById("targettime");

        this.dailyswitch = document.getElementById("dailyswitch");

        this.message = document.getElementById("countdownmsg");

        this.restart = document.getElementById("restart");

        // ----

        CountdownSettingsDialog.addEvent('click', this.onTitleEditable.bind(this), this.title);
        CountdownSettingsDialog.addEvent('blur', this.onTitleReadOnly.bind(this), this.title);
        CountdownSettingsDialog.addEvent('keyup', this.onTitleKeyUp.bind(this), this.title);

        CountdownSettingsDialog.addEvent('click', this.onTargetDateEditable.bind(this), this.targetdate);
        CountdownSettingsDialog.addEvent('blur', this.onTargetDateReadOnly.bind(this), this.targetdate);
        CountdownSettingsDialog.addEvent('keyup', this.onTargetDateKeyUp.bind(this), this.targetdate);
        CountdownSettingsDialog.addEvent('click', this.onTargetTimeEditable.bind(this), this.targettime);
        CountdownSettingsDialog.addEvent('blur', this.onTargetTimeReadOnly.bind(this), this.targettime);
        CountdownSettingsDialog.addEvent('keyup', this.onTargetTimeKeyUp.bind(this), this.targettime);

        CountdownSettingsDialog.addEvent('click', this.onMsgEditable.bind(this), this.message);
        CountdownSettingsDialog.addEvent('blur', this.onMsgReadOnly.bind(this), this.message);
        CountdownSettingsDialog.addEvent('keyup', this.onMsgKeyUp.bind(this), this.message);

        CountdownSettingsDialog.addEvent('click', this.onDailySwitch.bind(this), this.dailyswitch);

        CountdownSettingsDialog.addEvent('click', this.onRestartBtn.bind(this), this.restart);

    }

    static addEvent(event, func, ...controls)
    {
        for(var i in controls)
        {
            if (controls[i] == null) continue;
            controls[i].addEventListener(event, func, false);   
        }
    }

    update()
    {
        this.title.value = this.manager.title;
        this.targetdate.value = this.manager.date;
        this.targettime.value = this.manager.time;

        this.dailyswitch.checked = this.manager.daily;
        this.message.value = this.manager.message;

        this.validate();
    }
    validate()
    {
        this.targetdate.disabled = this.manager.profile.locked_date;
        this.targettime.disabled = this.manager.profile.locked_time;
        this.dailyswitch.disabled = this.manager.profile.locked_daily;

        if (this.dailyswitch.checked)
        {
            CountdownSettingsDialog.setHidden(this.targetdatecontainer, true);
            this.targetdate.setAttribute("display", "none");
        }
        else
        {
            CountdownSettingsDialog.setHidden(this.targetdatecontainer, false);
        }
    }

    onTitleEditable(event)
    {
    }
    onTitleReadOnly(event)
    {
        this.manager.title = this.title.value;
    }
    onTitleKeyUp(event)
    {
        if (event.key == "Enter") this.manager.title = event.target.value;
        if (event.key == "Escape") event.target.value = this.manager.title;
    }

    onTargetDateEditable(event)
    {
        //event.target.value = this.manager.date;
    }
    onTargetDateReadOnly(event)
    {
        this.manager.date = event.target.value;
    }
    onTargetDateKeyUp(event)
    {
        if (event.key == "Enter") this.manager.date = event.target.value;
        if (event.key == "Escape") event.target.value = this.manager.date;
    }
    onTargetTimeEditable(event)
    {
        //event.target.value = this.manager.time;
    }
    onTargetTimeReadOnly(event)
    {
        this.manager.time = event.target.value;
    }
    onTargetTimeKeyUp(event)
    {
        if (event.key == "Enter") this.manager.time = event.target.value;
        if (event.key == "Escape") event.target.value = this.manager.time;
    }

    onMsgEditable(event)
    {
        //event.target.value = this.manager.message;
    }
    onMsgReadOnly(event)
    {
        this.manager.message = event.target.value;
    }
    onMsgKeyUp(event)
    {
        if (event.key == "Enter") this.manager.message = event.target.value;
        if (event.key == "Escape") event.target.value = this.manager.message;
    }

    onDailySwitch()
    {
        this.manager.daily = event.target.checked;
        if (this.manager.daily)
            this.manager.time = this.targettime.value;
        else
            this.manager.date = this.targetdate.value;
        this.validate();
    }

    onRestartBtn()
    {
        this.manager.start();
    }
   
    static setHidden(control, hidden)
    {
        if (control == null) return;
        if (hidden) control.style.display = "none";
        else control.style.removeProperty("display");
    }
    static setEnabled(control, enabled)
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

class Countdown {
    constructor(htmlElementName, profile) {
        this.elementName = htmlElementName;

        this.titleMaster = document.title;

        this.profile = new CountdownProfile();
        this.setProfile(profile);

        this.timer = null;
        this.timerinit = false;

        this.settingsDialog = new CountdownSettingsDialog(this);
    }

    initialize(defaultProfile = null)
    {
        if (defaultProfile == null) defaultProfile = new CountdownProfile();
        var profile = CountdownProfile.getFromUrl();
        if (profile == null) profile = defaultProfile;
        profile.loadUrl();
        this.setProfile(profile);
    }

    setProfile(profile)
    {
        if (profile == null) return;

        this.profile = profile;
        this.profile.setActive();

        console.log("[Countdown] Profile '" + this.profile.title + "' loaded.");

        if(this.settingsDialog != null)
        {
            this.settingsDialog.update();
            this.start();
        }
    }

    // Find the distance between now and the count down date
    get distance() {
        return this.profile.targetDate.getTime() - new Date().getTime();
    }

    get date(){
        return this.profile.date;
    }
    get datetime(){
        return this.profile.datetime;
    }
    set datetime(datetime){
        this.profile.datetime = datetime;
    }
    set date(date){
        if (this.locked_date) return;
        this.profile.date = date;
        Site.setParameter("date", date);
    }

    get time(){
        return this.profile.time;
    }
    set time(time){
        if (this.locked_time) return;
        this.profile.time = time;
        Site.setParameter("time", time);
    }

    get daily() {
        return this.profile.daily;
    }
    set daily(daily) {
        if (this.profile.locked_daily) return;
        this.profile.daily = daily;
        Site.setParameter("daily", daily);
    }

    get message() {
        return this.profile.message;
    }
    set message(text) {
        this.profile.message = text;
        Site.setParameter("msg", text);
    }
    get title() {
        return this.profile.title;
    }
    set title(text) {
        this.profile.title = text;
        // Apply new title ...
        document.title = this.titleMaster;
        if (text.length > 0) document.title += ": " + text;
        console.log("[Countdown] Title: '" + document.title + "'");
        Site.setParameter("title", text);
    }

    validate()
    {
        if (this.daily)
        {
            // get target date of today for the given time.
            var dateToday = DateTime.timeToday(this.time);

            // get date of tomorrow if target time is more then 60 minutes in the past.
            var diff = new Date() - dateToday;
            var diff = diff / 1000 / 60; // difference in minutes ...
            if (diff > 60) dateToday = DateTime.tomorrow(dateToday);
            // Set ...
            this.datetime = dateToday;
        }
    }

    start(interval=500) {
        clearInterval(this.timer);
        //console.log("[Countdown] Stopping ... (" + this.timer + ")");

        this.setRainbow3DMode(false);
        this.setRainbowMode(false);
        setInnerHtml(this.elementName, "• • •");
        this.setArtMode(false);

        this.validate();
        var id = setInterval(this.update.bind(this), interval);
        this.timer = id;

        console.log("[Countdown] Started ... (" + id + ")");
        this.timerinit = true;
    }

    stop() {
        clearInterval(this.timer);
        console.log("[Countdown] Stopped")
    }

    showMessage() {
        this.stop();

        var msg = this.message;

        if (msg.length == 0)
        {
            msg = CountdownProfile.ASCII_Cat;
            this.setArtMode(true);
            this.setRainbow3DMode(true);
        }
        else
        {
            msg = this.resolveVariables(msg);

            if (this.profile.mode3D) this.setRainbow3DMode(true);
            else this.setRainbowMode(true);
            this.setArtMode(this.profile.modeASCII);
        }

        setInnerHtml(this.elementName, msg);
    }

    setArtMode(enable)
    {
        if (enable) addClassFor(this.elementName, cssClass_ASCIIArt);
        else removeClassFor(this.elementName, cssClass_ASCIIArt);
    }

    setRainbowMode(enable)
    {
        if (enable)
        {
            removeClassFor(this.elementName, cssClass_RainbowText3D);
            addClassFor(this.elementName, cssClass_RainbowText);
        }
        else removeClassFor(this.elementName, cssClass_RainbowText);
    }

    setRainbow3DMode(enable)
    {
        if (enable)
        {
            removeClassFor(this.elementName, cssClass_RainbowText);
            addClassFor(this.elementName, cssClass_RainbowText3D);
        }
        else removeClassFor(this.elementName, cssClass_RainbowText3D);
    }

    resolveVariables(msg)
    {
        msg = msg.replace("{year}", this.profile.targetDate.getFullYear().toString()); // year
        return msg;
    }

    update()
    {
        // Find the distance between now and the count down date
        var distance = this.distance;
        if (distance < 0) distance = 0;

        // Time calculations for days, hours, minutes and seconds
        var days = Math.floor(distance / (1000 * 60 * 60 * 24));
        var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Display the result in the element
        var output = "";
        if (days > 0){
            var div = "<div class=\"" + cssClass_CountdownDays + "\">";
            div += days.toString();
            div += "</div>";
            output += div;
        }
        output += hours.toString().padStart(2, '0') + ":";
        output += minutes.toString().padStart(2, '0') + ":";
        output += seconds.toString().padStart(2, '0');

        if (this.timerinit = true)
        {
            this.timerinit = false;
            this.setRainbowMode(false);
        }
        setInnerHtml(this.elementName, output);
        this.onUpdate();

        // If the count down is finished, write some text
        if (distance == 0) this.showMessage();
    }

    onUpdate() 
    {
        // lazy event handling. empty on purpose.
    }
}

const countdown = new Countdown("countdowntext");

window.addEventListener('load', onLoad, false);

function StorageKey()
{
    return Storage.keyPrefix + "countdown.lunchbreak.time";
}

function onTargetTimeChange(event)
{
    var val = theme.settingsDialog.targetTimer.value;
    if (val.length == 0) return;
    countdown.time = val;
    Storage.local.set(StorageKey(), val);
}

function countdownSettingsBtnClick(event) {
    countdown.settingsDialog.update();
}

function profileBtnClick(event) {
    var btn = event.currentTarget;
    if (btn == null) return;

    var key = btn.getAttribute("profilekey");
    if (key != null)
        countdown.setProfile(CountdownProfile.get(key), true);
}

function onLoad(event)
{
    // ----------------------------------------
    // Init page

    var settingsbtn = document.getElementById("settingsbtn");
    if (settingsbtn != null) settingsbtn.addEventListener('click', countdownSettingsBtnClick, false);

    // Register countdown profile buttons ...
    var profiles = document.getElementById("profiles");
    if (profiles != null)
    {
        var btns = [...profiles.getElementsByTagName("button")];
        btns.forEach(b => b.addEventListener("click", profileBtnClick, true));
    }

    // ----------------------------------------
    // Theme setup

    theme.background.slideshow.currentImgNum = 31; // default img num for this site.
    theme.background.slideshow.shuffle();

    // ----------------------------------------
    // Init countdown

    countdown.settingsDialog.register();
    ThemeSettingsDialog.addEvent('blur', onTargetTimeChange.bind(this), theme.settingsDialog.targetTimer);

    countdown.onUpdate = function()
    {
        var ctrl = theme.settingsDialog.targetTimer;
        if (ctrl && ctrl.value.length == 0) ctrl.value = countdown.time;

        var elem = document.getElementById("countdown");
        elem.classList.remove('invisible');
    }

    countdown.initialize(CountdownProfile.NewYear())

    // ----------------------------------------
    // Parse url query parametes

    var help = Site.parameter('help');
    if (help.exists)
    {
        console.log("URL query parameters:");
        console.log("  date=<date> - Set countdown date (Format: YYYY-MM-DD HH:MM:SS)");
        console.log("  time=<time> - Set countdown date to today with the given time (Format: HH:MM:SS)");
        console.log("  msg=<text> - Sets the text to display after the end of the countdown is reached.");
        console.log("  title=<title> - Sets the title for this countdown.");
		console.log("  profile=<name> - Sets the countdown profile.");
		console.log(CountdownProfile.profileKeys());
    }

    // -----

    var val = Storage.local.get(StorageKey());
    if (val && val.length > 0) countdown.time = val;

    // ----------------------------------------
    // Countdown start

    countdown.start();
}



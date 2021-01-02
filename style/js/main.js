
window.addEventListener('error', onError, false);
window.addEventListener('load', onLoad, false);
window.addEventListener('scroll', onScroll, false);

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

    var isCountDownPage = false;

    // ----------------------------------------
    // Init page
    
    settingsbtn = document.getElementById("settingsbtn");
    if (settingsbtn != null) settingsbtn.addEventListener('click', settingsBtnClick, false);
    
    theme.initialize();

    // Scroll with mouse on left or right edge
    // for smaller screens.
    var menu = document.getElementById("menubuttonarray");
    var menuEdgeScroll = new EdgeScroll(menu);

    // overlay.container.element.addEventListener('click', function(event)
    // {
    //     alert(overlay.container);
    //     if (event.target.id != overlay.container.element.id) return;
    //     overlay.container.hideAll();
    //     overlay.container.hide();
    // }, false);

    // ----------------------------------------
    // Parse url query parametes

    var help = Site.Parameter('help');
    if (help.exists)
    {
        console.log("URL query parameters:");
        console.log("  img=<index>       - Set background image");
        console.log("  slideshow=1|0     - Enabled/Disabled slideshow");
        console.log("  rainbow=1|0       - Enabled/Disable rainbow mode");
        console.log("  theme=dark|light  - Enabled rainbow mode");
    }

    // -----

    var img = Site.Parameter('img');
    if (img.exists)
    {
        var isp = Session.isSamePage;
        //debug: console.log("IsSamePage = " + isp);

        if (isp)
        {
            var timer = null;
            var f = function()
            {
                if (theme.background.preload.isActive) return;

                theme.background.skipNextTransition = false;
                theme.background.set(img.value, true);
                theme.save();
                clearInterval(timer);
            };
            timer = setInterval(f.bind(this), 100);
        }
        else
        {
            theme.background.skipNextTransition = true;
            theme.background.set(img.value, true);
            theme.save();
        }
    }
    
    // -----

    var paramTheme = Site.Parameter('theme');
    var paramDark = Site.Parameter('dark');
    var paramLight = Site.Parameter('light');

    if (paramDark.exists || paramTheme.is("dark", "0")) 
    {
        theme.setThemeDark();
        console.log("Theme set to dark via parameter.");
    }
    else if (paramLight.exists || paramTheme.is("light", "1"))
    {
        theme.setThemeLight();
        console.log("Theme set to light via parameter.");
    }

    // -----

    var slideshow = Site.Parameter('slideshow');
    if (slideshow.exists && !slideshow.enabled)
    {
        theme.background.slideshow.stop();
        console.log("Slideshow disabled via parameter.")
    }
    else if (!theme.HasSettingsLoader)
    {
        theme.background.slideshow.start();
    }

    // -----

    var rainbow = Site.Parameter('rainbow');
    if (rainbow.enabled) theme.rainbow.start();
    else theme.rainbow.stop();

    // ----------------------------------------
    // Update page element states

    theme.settingsDialog.setButtonState(theme.settingsDialog.slideshowBtn, theme.background.slideshow.isActive);

    // ----------------------------------------

    console.log("Page ready");
}


function onScroll(event)
{
    // var s = document.scrollingElement.scrollTop / 25;
    // theme.background.frontBuffer.style.top = (s * -1) + "px";
    // theme.background.frontBuffer.style.bottom = s + "px";
}

// ----------

// window.addEventListener('keydown', onKeyDown, false);
// window.addEventListener('up', onKeyUp, false);

// function onKeyDown(event)
// {
//     console.log(event);
// }

// function onKeyUp(event)
// {
//     console.log(event);
// }

// ----------

function settingsBtnClick(event) {
    theme.settingsDialog.update();
    theme.settingsDialog.toggle();
}

// ----------

// class OverlayContainer { 

//     get element()
//     {
//         return document.getElementById("overlaycontainer");
//     }

//     get exits()
//     {
//         return this.element != null;
//     }

//     show()
//     {
//         if (this.element != null) this.element.classList.remove('hidden');
//         return this.element != null;
//     }

//     hide()
//     {
//         if (this.element != null) this.element.classList.add('hidden');
//         return this.element != null;
//     }

//     get overlayList(){
//         return this.element.querySelectorAll("div[id].overlay")
//     }

//     hideAll()
//     {
//         if (!this.exits) return false;

//         for(overlay in this.overlayList)
//         {
//             if (overlay != null) continue;
//             if (overlay.classList.contains('hidden'))  continue;
//             overlay.classList.add('hidden');
//         }

//         return true;
//     }
// }

// class Overlay {
//     constructor() {
//         this.container = new OverlayContainer();
//     }

//     register()
//     {
//         return this.container.register();
//     }

//     get list(){
//         return this.container.overlayList;
//     }
    
//     show(id)
//     {
//         if (!this.container.exits) return false;
//         var element = document.getElementById(id);                
//         if (element == null) return false;

//         this.container.hideAll();
//         this.container.show();
//         element.classList.remove('hidden');
//         return true;
//     }

//     hide(id=null)
//     {
//         if (!this.container.exits) return false;

//         if (id == null)
//         {
//             this.container.hideAll();
//             this.container.hide();
//             return true;
//         }

//         var element = document.getElementById(id);        
//         if (element == null) return false;
//         element.classList.add('hidden');
//         return true;
//     }

//     toogle(id)
//     {
//         if (!this.container.exits) return false;
//         var element = document.getElementById(id);
//         if (element == null) return false;

//         if (this.isHidden(id))
//         {
//             this.show(id);
//             this.container.show();
//         }
//         else
//         {
//             this.hide(id);
//             this.container.hide();
//         }
//     }

//     isHidden(id)
//     {
//         if (!this.container.exits) return true;
//         var element = document.getElementById(id);                
//         if (element == null) return true;
//         return element.classList.contains('hidden');
//     }
// }

// var overlay = new Overlay();


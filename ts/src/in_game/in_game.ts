import { AppWindow } from "../AppWindow";
import {
  OWGamesEvents,
  OWHotkeys
} from "@overwolf/overwolf-api-ts";
import { interestingFeatures, hotkeys, windowNames, smiteClassId } from "../consts";
import WindowState = overwolf.windows.WindowStateEx;

import gods from '../res/gods.json';
import builds from '../res/builds.json';
import items from '../res/items.json';

// The window displayed in-game while a Fortnite game is running.
// It listens to all info events and to the game events listed in the consts.ts file
// and writes them to the relevant log using <pre> tags.
// The window also sets up Ctrl+F as the minimize/restore hotkey.
// Like the background window, it also implements the Singleton design pattern.
class InGame extends AppWindow {
  private static _instance: InGame;
  private _smiteGameEventsListener: OWGamesEvents;
  private _eventsLog: HTMLElement;
  private _infoLog: HTMLElement;

  private search_box : HTMLInputElement;

  private search_god : HTMLElement;
  private select_god : HTMLElement;

  private constructor() {
    super(windowNames.inGame);

    this._eventsLog = document.getElementById('eventsLog');
    this._infoLog = document.getElementById('infoLog');

    this.setToggleHotkeyBehavior();
    this.setToggleHotkeyText();

    this._smiteGameEventsListener = new OWGamesEvents({
      onInfoUpdates: this.onInfoUpdates.bind(this),
      onNewEvents: this.onNewEvents.bind(this)
    },
      interestingFeatures);
  }

  public static instance() {
    if (!this._instance) {
      this._instance = new InGame();
    }

    return this._instance;
  }

  public run() {
    this._smiteGameEventsListener.start();

    this.initGods();

    this.search_god = document.getElementById("search_god");
    this.select_god = document.getElementById("select_god");

    document.getElementById("select_god").style.display = "none";
    document.getElementById("build_maker").style.display = "none";
    document.getElementById("show_build").style.display = "none";

    this.search_box = document.getElementById("search_box") as HTMLInputElement
    this.search_box.addEventListener('keyup', this.searchBox);

    this.select_god.querySelector('button').addEventListener('click', this.makeBuild, false);
  }

  public initGods(){
    var liste = document.getElementById("liste");
    
    for(var i = 0; i < gods.length; ++i) {
      var god = document.createElement("div");
      var img = document.createElement("img");
      var name = document.createElement("h4");
      var id = gods[i].id.toString();
      god.setAttribute("id", id);
      god.setAttribute("class", "card");
      //god.style.width = "200px";
      god.addEventListener('click', this.clickGod, false);
      img.src = gods[i].godIcon_URL;
      img.setAttribute("class", "card-text")
      name.textContent = gods[i].Name;
      name.setAttribute("class", "card-title");
      god.appendChild(name);
      god.appendChild(img);
      liste.append(god);
    }
    
  }

  public searchBox(){
    this.search_box = document.getElementById("search_box") as HTMLInputElement;
    var gods = document.getElementById("liste");
    var li = gods.getElementsByTagName("div");
    var filterName = this.search_box.value.toUpperCase();
    
    for(var i = 0; i < li.length; i++) {
      var name = li[i].querySelector('h1').textContent;
      if(name.toUpperCase().indexOf(filterName) > -1){
        li[i].style.display = "";
      } else {
        li[i].style.display = "none";
      }
    }
  }

  public clickGod(evt : any){
    var god = gods.find(element => element.id == evt.currentTarget.id);
    var select_god = document.getElementById("select_god");
    document.getElementById('search_god').style.display = "none";
    
    select_god.querySelector('h1').textContent = god.Name;
    select_god.querySelector('img').src = god.godIcon_URL;

    select_god.querySelector('button').id = god.id.toString(); 

    select_god.style.display = "";
  }

  public makeBuild(evt : any){
    var build_maker = document.getElementById('build_maker');
    var list_items = document.getElementById('list_items')
    build_maker.style.display = "";

    for(var i = 1; i < 7; ++i)
    {
      var item = build_maker.querySelector('#item_'+i) as HTMLImageElement;
      item.src = items[i].itemIcon_URL;
    }
    
    for(var i = 0; i < items.length; ++i)
    {
      if(items[i].ItemTier >= 3)
      {
        var img = document.createElement('img')
        img.src = items[i].itemIcon_URL;
        
        list_items.appendChild(img)
      }
    }
    
  }
  
  private onInfoUpdates(info) {
    this.logLine(this._infoLog, info, false);
  }

  // Special events will be highlighted in the event log
  private onNewEvents(e) {
    const shouldHighlight = e.events.some(event => {
      switch (event.name) {
        case 'kill':
        case 'death':
        case 'assist':
        case 'level':
        case 'matchStart':
        case 'matchEnd':
          return true;
      }

      return false
    });
    this.logLine(this._eventsLog, e, shouldHighlight);
  }

  // Displays the toggle minimize/restore hotkey in the window header
  private async setToggleHotkeyText() {
    const hotkeyText = await OWHotkeys.getHotkeyText(hotkeys.toggle, smiteClassId);
    const hotkeyElem = document.getElementById('hotkey');
    hotkeyElem.textContent = hotkeyText;
  }

  // Sets toggleInGameWindow as the behavior for the Ctrl+F hotkey
  private async setToggleHotkeyBehavior() {
    const toggleInGameWindow = async (hotkeyResult: overwolf.settings.hotkeys.OnPressedEvent): Promise<void> => {
      console.log(`pressed hotkey for ${hotkeyResult.name}`);
      const inGameState = await this.getWindowState();

      if (inGameState.window_state === WindowState.NORMAL ||
        inGameState.window_state === WindowState.MAXIMIZED) {
        this.currWindow.minimize();
      } else if (inGameState.window_state === WindowState.MINIMIZED ||
        inGameState.window_state === WindowState.CLOSED) {
        this.currWindow.restore();
      }
    }

    OWHotkeys.onHotkeyDown(hotkeys.toggle, toggleInGameWindow);
  }

  // Appends a new line to the specified log
  private logLine(log: HTMLElement, data, highlight) {
    console.log(`${log.id}:`);
    console.log(data);
    const line = document.createElement('pre');
    line.textContent = JSON.stringify(data);

    if (highlight) {
      line.className = 'highlight';
    }

    const shouldAutoScroll = (log.scrollTop + log.offsetHeight) > (log.scrollHeight - 10);

    log.appendChild(line);

    if (shouldAutoScroll) {
      log.scrollTop = log.scrollHeight;
    }
  }
}

InGame.instance().run();

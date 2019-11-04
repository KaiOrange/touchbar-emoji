const { ipcRenderer } = require('electron');
const EMOJIS = require("./lib/emojis.json");

let initPersistent = localStorage.getItem("init-persistent") !== "false"; // 为空或者是"true"时选中
let initRandom = localStorage.getItem("init-random") === "true";
let initCustom = localStorage.getItem("init-custom") === "true";
let initCustomTexts = JSON.parse(localStorage.getItem("custom-texts") || '[]');
ipcRenderer.send('persistent-float',initPersistent);
ipcRenderer.send('random-float',initRandom);
ipcRenderer.send('only-custom',initCustom);

if (process.platform === 'win32') {
  let link = document.createElement("link");
  link.setAttribute("rel","stylesheet");
  link.setAttribute("href","css/font.css");
  document.body.appendChild(link);
}

// 控制器处理
var vm = new Vue({
  el: '#main-card',
  data: {
    EMOJIS,
    selectedIndex: 1,
    isDarwin: process.platform === 'darwin',
    isPersistent: initPersistent,
    isRandom: initRandom,
    isCustom: initCustom,
    isPaging: false,
    customText: '',
    customTexts: initCustomTexts,
    isInputShake: false,
    longpressTimer: null,
    flotages: []
  },
  methods:{
    handleMouseInCard(isEnter){
      ipcRenderer.send('control-slide',!isEnter);
    },
    handleTabClick(index){
      this.selectedIndex = index;
      ipcRenderer.send('touchbar-segmented-control-selected',index - 1);
    },
    handleEmoji(emoji){
      ipcRenderer.send('play-emoji',emoji);
    },
    handleQuit(){
      ipcRenderer.send('app-quit');
    },
    handlePersistent(){
      this.isPersistent = !this.isPersistent;
      localStorage.setItem("init-persistent", this.isPersistent);
      ipcRenderer.send('persistent-float',this.isPersistent);
    },
    handleRandom(){
      if(!this.isPersistent){
        return;
      }
      this.isRandom = !this.isRandom;
      localStorage.setItem("init-random", this.isRandom);
      ipcRenderer.send('random-float',this.isRandom);
    },
    handleCustom(){
      if(!this.isPersistent || this.customTexts.length === 0 || !this.isRandom){
        return;
      }
      this.setCustion(!this.isCustom);
    },
    handleTogglePaging(){
      this.isPaging = !this.isPaging;
    },
    handleAddCustomText(){
      if(this.customText === ''){
        this.isInputShake = true;
        return;
      }
      ipcRenderer.send('play-emoji',this.customText);
      this.addCustomText(this.customText)
      this.customText = '';
    },
    addCustomText(customText){
      let index = this.customTexts.findIndex(item=>item===customText)
      if(index !== -1) {
        this.customTexts.splice(index,1)
      }
      this.customTexts.unshift(customText);
      localStorage.setItem("custom-texts", JSON.stringify(this.customTexts));
      ipcRenderer.send('set-custom-texts',{
        texts: this.customTexts,
      });
    },
    handleDeleteCustomText(text){
      let index = this.customTexts.findIndex(item=>item===text)
      if(index !== -1) {
        this.customTexts.splice(index,1)
      }
      localStorage.setItem("custom-texts", JSON.stringify(this.customTexts));
      ipcRenderer.send('set-custom-texts', {
        texts: this.customTexts,
        deleteText: text
      });
      if (this.customTexts.length === 0) {
        this.setCustion(false);
      }
    },
    setCustion(isCustom){
      this.isCustom = isCustom;
      localStorage.setItem("init-custom", isCustom);
      ipcRenderer.send('only-custom',isCustom);
    },
    handleClearAnimation(){
      this.isInputShake = false;
    },
    // 模拟长按事件
    handleEmojiMousedown(e){
      this.longpressTimer = setTimeout(() => {
        let box = e.target.getBoundingClientRect();
        let top = box.top + window.pageYOffset;
        let left = box.left + window.pageXOffset + box.width / 2 - 2;
        let text = e.target.innerText;
        if (left < 54) {
            left = 54;
        } else if (left > 326) {
            left = 326;
        }
        this.flotages.push({
          left,
          top,
          text
        });
        this.addCustomText(text)
        this.longpressTimer = null;
      }, 800);;
    },
    handleEmojiMouseup(){
      if (this.longpressTimer) {
        clearTimeout(this.longpressTimer);
      }
    },
    handleFlotagesAnimationend(index){
      this.flotages.splice(index,1);
    },
  }
})

ipcRenderer.on('tab-selected', (event, arg) => {
  vm.selectedIndex = arg;
})
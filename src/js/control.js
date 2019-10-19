const { ipcRenderer } = require('electron');
const EMOJIS = require("./lib/emojis.json");

let initPersistent = localStorage.getItem("init-persistent") !== "false"; // 为空或者是"true"时选中
let initRandom = localStorage.getItem("init-random") === "true";
ipcRenderer.send('persistent-float',initPersistent);
ipcRenderer.send('random-float',initRandom);
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
    isRandom: initRandom
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
    handlePersistent(e){
      this.isPersistent = e.target.checked;
      localStorage.setItem("init-persistent", this.isPersistent);
      ipcRenderer.send('persistent-float',this.isPersistent);
    },
    handleRandom(e){
      if(!this.isPersistent){
        return;
      }
      this.isRandom = e.target.checked;
      localStorage.setItem("init-random", this.isRandom);
      ipcRenderer.send('random-float',this.isRandom);
    },
  }
})

ipcRenderer.on('tab-selected', (event, arg) => {
  vm.selectedIndex = arg;
})
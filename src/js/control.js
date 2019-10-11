const { ipcRenderer } = require('electron');
const EMOJIS = require("./lib/emojis.json");

// 控制器处理
var vm = new Vue({
  el: '#main-card',
  data: {
    EMOJIS,
    selectedIndex: 1,
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
    }
  }
})

ipcRenderer.on('tab-selected', (event, arg) => {
  vm.selectedIndex = arg;
})
const { ipcRenderer } = require('electron');
const EMOJIS = require("./lib/emojis.json");

let canvas = document.querySelector('#canvas')
let innerWidth = window.innerWidth;
let innerHeight = window.innerHeight;
canvas.width = innerWidth;
canvas.height = innerHeight;
let context = canvas.getContext('2d');
context.textBaseline="top";
context.font='38px sans-serif';

// 控制器处理
var vm = new Vue({
  el: '#main-card',
  data: {
    EMOJIS,
    selectedIndex: 1,
    hasMouseEnter: false
  },
  methods:{
    handleMouseInCard(isEnter){
      this.hasMouseEnter = isEnter;
      // ipcRenderer.send('set-ignore-mouse-events',!isEnter);
    },
    handleTabClick(index){
      this.selectedIndex = index;
      ipcRenderer.send('touchbar-segmented-control-selected',index - 1);
    },
    handleEmoji(emoji){
      playEmojis(emoji);
    },
    handleQuit(){
      ipcRenderer.send('app-quit');
    }
  }
})

ipcRenderer.on('tab-selected', (event, arg) => {
  vm.selectedIndex = arg;
})

function createEmoji(text, x, y, xOffset, yOffset, scale = 1){
  return ({
    x,
    y,
    xOffset,
    yOffset,
    scale,
    text,
    destroy:false,
    measuredWidth: 38,
    updated () {
      this.x = this.x + this.xOffset;
      this.y = this.y + this.yOffset;
      // 当超出2个身位的时候销毁
      if (this.x < -this.measuredWidth * 2 || this.x > innerWidth + 2 * this.measuredWidth) {
        this.destroy = true;
      } else if (this.y > innerHeight + 2 * this.measuredWidth) {
        this.destroy = true;
      }
    },
    draw(){
      // console.log(this);
      context.save();
      context.scale(this.scale,this.scale);
      // scale 是相对于坐标系的 然后移回去
      context.translate(this.x / this.scale - this.x, this.y / this.scale - this.y);
      context.fillText(this.text, this.x, this.y);
      context.restore();
    }
  })
}

function random(n = 1){
  return parseInt(Math.random() * n);
}

function createRandomEmoji(text){
  let scale = (random(5) + 7.5) / 10;
  let measuredWidth = context.measureText(text).width * scale;
  let obj = createEmoji(text,
    random(innerWidth - measuredWidth),
    -random(100) - measuredWidth,
    Math.random() * 2 - 1,
    Math.random() * 3 + 2,
    scale
    )
  obj.measuredWidth = measuredWidth
  return obj
}

let emojiArray = [];

function playEmojis(text = '😀'){
  let randomTotle = 5 + random(6);
  for (let i = 0; i < randomTotle; i++) {
    emojiArray.push(createRandomEmoji(text));
  }
}

//启动时候发一波
playEmojis();

ipcRenderer.on('play-emoji', (event, message) => {
  playEmojis(message);
})

function animate(){
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = emojiArray.length - 1; i >= 0; i--) {
    const element = emojiArray[i];
    element.updated();
    if (element.destroy) {
      emojiArray.splice(i,1);
    }
  }
  for (let i = 0; i < emojiArray.length; i++) {
    const element = emojiArray[i];
    element.draw();
  }
  requestAnimationFrame(animate);
}
animate();
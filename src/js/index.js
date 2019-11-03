const { ipcRenderer } = require('electron');
const randomColor = require('randomcolor');
const EMOJIS = require("./lib/emojis.json");
const ALLEMOJIS = EMOJIS.reduce((pre,next)=>{
	return pre.concat(next.emojis || []);
},[])
let CUSTOMTEXTS = JSON.parse(localStorage.getItem("custom-texts") || '[]');

let canvas = document.querySelector('#canvas')
let innerWidth = window.innerWidth;
let innerHeight = window.innerHeight;
canvas.width = innerWidth;
canvas.height = innerHeight;
let context = canvas.getContext('2d');
context.textBaseline="top";
context.font='38px sans-serif';
let isPersistent = false;
let isRandom = false;
let isCustom = false;
let floatMaxTime = 500;// 间隔500毫秒发一发
let currentTime = 0;// 间隔500毫秒发一发
let currentEmoji =  localStorage.getItem("init-emoji") || ALLEMOJIS[0];
let emojiHistory =  [currentEmoji];
if (process.platform === 'win32') {
  let link = document.createElement("link");
  link.setAttribute("rel","stylesheet");
  link.setAttribute("href","css/font.css");
  document.body.appendChild(link);
  context.font='38px Emoji';
}

function createEmoji(text, x, y, xOffset, yOffset, scale = 1, color = randomColor()){
  return ({
    x,
    y,
    xOffset,
    yOffset,
    scale,
    text,
    destroy:false,
    measuredWidth: 38,
    color: color,
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
      context.fillStyle = this.color;
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

function playEmojis(text){
  currentEmoji = text;
  localStorage.setItem("init-emoji", currentEmoji);
  let randomTotle = 5 + random(6);
  for (let i = 0; i < randomTotle; i++) {
    emojiArray.push(createRandomEmoji(text));
  }
}

//启动时候发一波
playEmojis(currentEmoji);

ipcRenderer.on('play-emoji', (event, message) => {
  currentEmoji = message;
  localStorage.setItem("init-emoji", currentEmoji);
  let index = emojiHistory.findIndex(item=>item === currentEmoji);
  if (index !== -1) {
    if (index !== emojiHistory.length - 1) {
      emojiHistory.splice(index,1);
      emojiHistory.push(currentEmoji);
    }
  } else {
    emojiHistory.push(currentEmoji);
  }
  playEmojis(currentEmoji);
})

ipcRenderer.on('persistent-float', (event, message) => {
  isPersistent = message;
})

ipcRenderer.on('random-float', (event, message) => {
  isRandom = message;
})

ipcRenderer.on('only-custom', (event, message) => {
  isCustom = message;
})

ipcRenderer.on('set-custom-texts', (event, message) => {
  CUSTOMTEXTS = message.texts;
  if (message.deleteText) {
    let index = emojiHistory.findIndex(item=>item === message.deleteText);
    if (index !== -1) {
      if (emojiHistory.length - 1 === index) {
        if (emojiHistory.length > 1) {
          currentEmoji = emojiHistory[emojiHistory.length - 2];
          localStorage.setItem("init-emoji", currentEmoji);
        } else if (emojiHistory.length === 1) {
          currentEmoji = ALLEMOJIS[0];
          localStorage.setItem("init-emoji", currentEmoji);
        }
      }
      emojiHistory.splice(index,1);
    }
  }
})

function animate(time = 0){
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
  if (isPersistent && time - currentTime > floatMaxTime) {
    currentTime = time;
    let text = currentEmoji;
    if (isRandom) {
      if (isCustom) {
        text = CUSTOMTEXTS[random(CUSTOMTEXTS.length)];
      } else {
        text = ALLEMOJIS[random(ALLEMOJIS.length)];
      }
    }
    emojiArray.push(createRandomEmoji(text));
  }
  requestAnimationFrame(animate);
}
animate();
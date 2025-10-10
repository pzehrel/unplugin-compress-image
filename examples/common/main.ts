import IMG from './assets/1.png'
import IMG2 from './assets/2.png'
import IMG3 from './assets/3.png'
import './main.css'

const html = `
  <h1>CSS image</h1>
  <div class="div"></div>
  <div class="div2"></div>
  <div class="div3"></div>

  <h1>Images</h1>
  <img src="${IMG}" />
  <img src="${IMG2}" />
  <img src="${IMG3}" />
`

const $app = document.createElement('div')
$app.innerHTML = html
document.body.appendChild($app)

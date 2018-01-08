let blessed = require('blessed')
let Theme = require('./theme')
let Box = blessed.Box
let Menu = require('./menu.js')

class Http extends Box {
  constructor(options) {
    super(options)
    this.options = options || {}
    this.screen = options.screen
    this.style = this.options.style || Theme.style.base

    this.overall = blessed.box({
      width: '100%',
      top: 3,
      left: '0',
      label: 'HTTP',
      height: 3,
      mouse: true,
      content: '',
      tags: true,
      inputOnFocus: true,
      keys: true,
      style: this.style.name || Theme.style.base,
      border: {
        type: 'line',
      },
    });

    this.append(new Menu({
      screen: this.screen,
      selected: 'HTTP',
    }))
    this.append(this.overall)
  }
}

module.exports = Http

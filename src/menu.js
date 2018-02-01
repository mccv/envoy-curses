const blessed = require('blessed')
const Theme = require('./theme')
const Box = blessed.Box

class Menu extends Box {
  constructor(options) {
    super(options)
    this.options = options || {};
    this.sections = this.options.sections || [
      'Server',
      'Clusters',
      'Stats']

    this.style = this.options.style || Theme.style.base
    this.options.height = 3

    this.screen = options.screen
    this.refresh = false
    for (let i = 0; i < this.sections.length; i++) {
      const spacing = Math.floor(100/this.sections.length)
      const style = JSON.parse(JSON.stringify(Theme.style.nofocus))
      if (this.sections[i] === this.options.selected) {
        style.border.fg = Theme.palette.red
      }
      this.append(Box({
        height: 3,
        tags: true,
        left: `${i*spacing}%`,
        width: `${spacing}%`,
        content: this.sections[i],
        border: 'line',
        style: style,
      }))
    }
  }
}

module.exports = Menu

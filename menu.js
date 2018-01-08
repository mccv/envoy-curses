var blessed = require('blessed')
, Theme = require('./theme')
, Box = blessed.Box
, contrib = require('blessed-contrib')
, http = require('http')
, dateFormat = require('dateformat')
, log = require('simple-node-logger').createSimpleFileLogger('envoy.log')

function Menu(options) {
  var self = this;

  if (!(this instanceof Box)) {
    return new Menu(options);
  }

  this.options = options || {};
  this.sections = this.options.sections || [
    'Server',
    'Clusters',
    'Listeners',
    'HTTP']

  this.style = this.options.style || Theme.style.base
  this.options.height = 3

  this.screen = options.screen
  this.refresh = false
  Box.call(this, this.options)
  for(i = 0; i < this.sections.length; i++) {
    spacing = Math.floor(100/this.sections.length)
    let style = JSON.parse(JSON.stringify(Theme.style.nofocus))
    if (this.sections[i] === this.options.selected) {
      style.border.fg = Theme.palette.red
    }
    this.append(Box({
      height: 3,
      left: `${i*spacing}%`,
      width: `${spacing}%`,
      content: this.sections[i],
      border: 'line',
      style: style 
    }))
  }
}

Menu.prototype.__proto__ = Box.prototype;


module.exports = Menu

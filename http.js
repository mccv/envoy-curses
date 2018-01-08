var blessed = require('blessed')
, Theme = require('./theme')
, Box = blessed.Box
, contrib = require('blessed-contrib')
, http = require('http')
, dateFormat = require('dateformat')
, log = require('simple-node-logger').createSimpleFileLogger('envoy.log')
, Menu = require('./menu.js')

function Http(options) {
  var self = this;

  if (!(this instanceof Box)) {
    return new Http(options);
  }

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
    }
  });

  Box.call(this, this.options)
  this.append(Menu({
    screen: this.screen,
    selected: "HTTP"
  }))
  this.append(this.overall)
}

Http.prototype.__proto__ = Box.prototype;


module.exports = Http

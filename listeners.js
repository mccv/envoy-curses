var blessed = require('blessed')
, Theme = require('./theme')
, Box = blessed.Box
, contrib = require('blessed-contrib')
, http = require('http')
, dateFormat = require('dateformat')
, log = require('simple-node-logger').createSimpleFileLogger('envoy.log')
, Menu = require('./menu.js')

function Listeners(options) {
  var self = this;

  if (!(this instanceof Box)) {
    return new Listeners(options);
  }

  this.options = options || {};

  this.style = this.options.style || Theme.style.base

  this.domain = options.domain
  this.screen = options.screen
  this.stats = options.stats
  this.log = options.log
  Box.call(this, this.options)
  this.append(Menu({
    screen: this.screen,
    selected: "Listeners"
  }))
  
  this.transactionsLine = contrib.line(
    {
      label: 'Total Transactions',
      showLegend: true,
      top: 3,
      height: '100%-3',
      legend: {width: 20}
    })
  this.append(this.transactionsLine)
  this.series = [
    {
      title: 'downstream_rq_2xx',
      style: {line: 'green'},
      x: [],
      y: []
    },
    {
      title: 'downstream_rq_3xx',
      style: {line: 'cyan'},
      x: [],
      y: []
    },
    {
      title: 'downstream_rq_4xx',
      style: {line: 'yellow'},
      x: [],
      y: []
    },
    {
      title: 'downstream_rq_5xx',
      style: {line: 'red'},
      x: [],
      y: []
    }
  ]

  this.stats.on('updated', () => {
    this.series.forEach(s => {
      let currentSeries = this.stats.getSeries('http.gke-proxy-80.' + s.title)
      if (currentSeries) {
        s.x = currentSeries.x
        s.y = currentSeries.y
        log.debug(JSON.stringify(s))
      } else {
        log.debug("couldn't find series")
      }
    })
    if (this.parent) {
      this.transactionsLine.setData(this.series);
      this.screen.render()
    }
  })
}

Listeners.prototype.__proto__ = Box.prototype;


module.exports = Listeners

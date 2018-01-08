let blessed = require('blessed')
let Theme = require('./theme')
let Box = blessed.Box
let contrib = require('blessed-contrib')
let log = require('simple-node-logger').createSimpleFileLogger('envoy.log')
let Menu = require('./menu.js')

class Listeners extends Box {
  constructor(options) {
    super(options)
    this.options = options || {};

    this.style = this.options.style || Theme.style.base

    this.domain = options.domain
    this.screen = options.screen
    this.stats = options.stats
    this.log = options.log
    this.append(new Menu({
      screen: this.screen,
      selected: 'Listeners',
    }))

    this.transactionsLine = contrib.line(
      {
        label: 'Total Transactions',
        showLegend: true,
        top: 3,
        height: '100%-3',
        legend: {width: 20},
      })
    this.append(this.transactionsLine)
    this.series = [
      {
        title: 'downstream_rq_2xx',
        style: {line: 'green'},
        x: [],
        y: [],
      },
      {
        title: 'downstream_rq_3xx',
        style: {line: 'cyan'},
        x: [],
        y: [],
      },
      {
        title: 'downstream_rq_4xx',
        style: {line: 'yellow'},
        x: [],
        y: [],
      },
      {
        title: 'downstream_rq_5xx',
        style: {line: 'red'},
        x: [],
        y: [],
      },
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
}

module.exports = Listeners

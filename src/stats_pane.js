let blessed = require('blessed')
let Theme = require('./theme')
let Box = blessed.Box
let Textbox = blessed.Textbox
let contrib = require('blessed-contrib')
let Menu = require('./menu.js')
let ListTable = blessed.ListTable
let theme = require('./theme.js')

class StatsPane extends Box {
  constructor(options) {
    super(options)
    this.options = options || {}
    this.screen = options.screen
    this.style = this.options.style || Theme.style.base
    this.stats = options.stats
    this.log = options.log
    this.chartedStat = 'rq_total'
    this.availableStats = []
    this.selectedListenerName = ''
    this.treeData = {}
    this.legendWidth = 20

    /* eslint camelcase: ["error", {properties: "never"}]*/
    this.reservedHostnames = {
      default_priority: true,
      high_priority: true,
      added_via_api: true,
    }

    this.statsSearch = Textbox({
      content: 'Search',
      top: 3,
      height: 3,
      fg: Theme.style.base.fg,
      border: {type: 'line', fg: Theme.style.base.border.fg},
      width: '100%',
      inputOnFocus: true,
      keys: true,
      mouse: true
    })

    this.statsList = ListTable({
      interactive: true,
      invertSelected: true,
      mouse: true,
      align: 'left',
      width: '50%-1',
      top: 4,
      height: '100%-4',
      border: {type: 'line', fg: Theme.style.table.border}
    })

    this.connectionsLine = contrib.line(
      {
        label: 'Stats',
        showLegend: true,
        top: 4,
        left: '50%',
        width: '50%',
        height: '100%-4',
        border: {type: 'line', fg: Theme.style.table.border},
        legend: {width: 40},
        style: Theme.style.chart,
      })

    this.selectStat = (s) => {
      if (s) {
        this.chartedStat = s
        this.setCharts(this.selectedListenerName)
      }
    }
    this.connectionsSeries = null

    this.updateStatNames = () => {
      let st = this.stats.getStatsTable()
      this.statsList.setData(this.stats.getStatsTable())
    }

    this.statsList.on('select', (s) => {
      this.statName = s.statName
      this.updateChartData()
      this.updateView()
    })
    this.updateChartData = () => {
      if (this.statName) {
        let series = []
        let seriesData = this.stats.getSeries(this.statName)
        let title = this.statName
        if (title.length > this.legendWidth) {
          title = `...${title.substring(title.length - this.legendWidth - 3)}`
        }
        if (seriesData) {
          this.connectionsSeries = [{
            title: title,
            stat_name: this.statName,
            style: {
            line: theme.pickChartColor(0, 10)
            },
            x: seriesData.x,
            y: seriesData.y,
          }]
        }
      }
    }

    this.updateView = () => {
      if (this.parent) {
        if (this.connectionsSeries) {
          this.connectionsLine.setData(this.connectionsSeries)
          this.connectionsLine.setLabel(`${this.chartedStat}`)
        }
        this.screen.render()
      }
    }

    this.on('attach', () => {
      this.statsList.focus()
    })

    this.stats.on('updated', () => {
      this.updateChartData()
      this.updateStatNames()
      this.updateView()
    })

    this.show = (screen) => {
      this.append(new Menu({
        screen: screen,
        selected: 'Stats',
      }))
      this.append(this.statsSearch)
      //this.append(this.statsList)
      //this.append(this.connectionsLine)
      screen.append(this)
      this.updateStatNames()
      this.updateChartData()
      this.updateView()
      this.statsSearch.focus()
    }
  }
}

module.exports = StatsPane

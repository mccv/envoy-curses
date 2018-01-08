var blessed = require('blessed')
, Theme = require('./theme')
, Box = blessed.Box
, contrib = require('blessed-contrib')
, http = require('http')
, dateFormat = require('dateformat')
, log = require('simple-node-logger').createSimpleFileLogger('envoy.log')
, Menu = require('./menu.js')
, theme = require('./theme.js')

function ClustersPane(options) {
  var self = this;

  if (!(this instanceof Box)) {
    return new ClustersPane(options);
  }

  this.options = options || {}
  this.screen = options.screen
  this.style = this.options.style || Theme.style.base
  this.clusters = options.clusters
  this.stats = options.stats
  this.log = options.log
  this.chartedStat = 'rq_total'
  this.availableStats = []
  this.selectedClusterName = ''
  
  Box.call(this, this.options)

  this.append(Menu({
    screen: this.screen,
    selected: "Clusters"
  }))

  this.reservedHostnames = {
    'default_priority': true,
    'high_priority': true,
    'added_via_api': true
  }
  
  this.clustersTable = contrib.table({
    fg: Theme.style.table.fg
    , selectedFg: Theme.style.table.selectedFg
    , selectedBg: Theme.style.table.selectedBg
    , keys: true
    , interactive: true
    , label: 'Clusters'
    , width: '50%'
    , top: 3
    , height: '100%-3'
    , border: {type: "line", fg: Theme.style.table.border}
    , columnSpacing: 2 //in chars
    , columnWidth: [20, 8, 8, 8, 8, 8] /*in chars*/
  })
  this.append(this.clustersTable)

  this.connectionsLine = contrib.line(
    {
      label: 'Stats',
      showLegend: true,
      top: 3,
      left: '50%',
      width: '50%',
      height: '100%-3',
      border: {type: "line", fg: Theme.style.table.border},
      legend: {width: 20},
      style: Theme.style.chart
    })
  this.append(this.connectionsLine)

  let searchStyle = Object.assign({
    item: {
      hover: {
        bg: Theme.style.base.fg
      }
    },
    selected: {
      bg: Theme.style.base.focus.bg,
      fg: Theme.style.base.focus.fg,
      bold: true
    }
  }, Theme.style.base)

  this.statSearch = blessed.List({
    label: 'Stats',
    width: '50%',
    height: '50%',
    top: 'center',
    left: 'center',
    hidden: true,
    style: searchStyle,
    border: {type: "line", fg: Theme.style.base.border.fg},
    keys: true,
    interactive: true,
  })
  this.append(this.statSearch)

  this.selectStat = (s) => {
    if (s) {
      this.chartedStat = s
      this.setCharts(this.selectedClusterName)
    }
  }
  this.connectionsSeries = []

  this.setCharts = () => {
    let hostNames = this.clusters.getHostNames(this.selectedClusterName)
    let series = []
    let newStats = new Set()
    for (i = 0; i < hostNames.length; i++) {
      if (!this.reservedHostnames[hostNames[i]]){
        this.clusters.getStatNames(this.selectedClusterName, hostNames[i]).forEach(s => {
          newStats.add(s)
        })
        series.push({
          title: hostNames[i],
          cluster_name: this.selectedClusterName,
          stat_namespace: hostNames[i],
          stat_name: this.chartedStat,
          style: {
            line: theme.pickChartColor(i, hostNames.length)
          },
          x: [],
          y: []
        })
      }
    }
    this.statSearch.clearItems()
    this.availableStats = Array.from(newStats).sort()
    for (i = 0; i < this.availableStats.length; i++) {
      this.statSearch.addItem(this.availableStats[i])
      if (this.availableStats[i] === this.chartedStat) {
        this.statSearch.select(i)
      }
    }
  
    this.connectionsSeries = series
  }

  this.updateCharts = () => {
    let clusterNames = this.clusters.getClusterNames()
    let tableData = {
      headers: ['cluster', 'cx act', 'rq act', 'rq total', 'members', 'healthy'],
      data: []
    }
    clusterNames.forEach(c => {
      let row = []
      if (!this.selectedClusterName) {
        this.selectedClusterName = c
        this.setCharts()
      }
      row.push(c)
      row.push(this.stats.getStat(`cluster.${c}.upstream_cx_active`))
      row.push(this.stats.getStat(`cluster.${c}.upstream_rq_active`))
      row.push(this.stats.getStat(`cluster.${c}.upstream_rq_total`))
      row.push(this.stats.getStat(`cluster.${c}.membership_total`))
      row.push(this.stats.getStat(`cluster.${c}.membership_healthy`))
      tableData.data.push(row)
    })
    this.connectionsSeries.forEach(s => {
      let currentSeries = this.clusters.getSeries(s.cluster_name, s.stat_namespace, s.stat_name)
      if (currentSeries) {
        s.x = currentSeries.x
        s.y = currentSeries.y
      } else {
        this.log.debug(`could not find series ${s.cluster_name}::${s.stat_namespace}::${s.stat_name} - ${currentSeries}`)
      }
    })
    if (this.parent) {
      this.connectionsLine.setData(this.connectionsSeries)
      this.connectionsLine.setLabel(`${this.selectedClusterName} - ${this.chartedStat}`)
      this.clustersTable.setData(tableData)
      this.screen.render()
    }
  }

  this.on('attach', () => {
    this.clustersTable.focus()
  })

  this.clustersTable.rows.on('select', (cluster) => {
    this.selectedClusterName = cluster.content.split(/\s+/)[0]
    this.setCharts()
    this.updateCharts()
  })

  this.clusters.on('updated', () => {
    this.updateCharts()
  })

  this.on('element keypress', (ch, key) => {
    if (key === '/' || key === '?') {
      this.statSearch.focus()
      this.statSearch.show()
      this.statSearch.once('action', (el, selected) => {
        this.statSearch.hide();
        if (el) {
          this.selectStat(el.content)
        }
        this.clustersTable.focus()
        self.screen.render()
      });
    }
  })
}

ClustersPane.prototype.__proto__ = Box.prototype;


module.exports = ClustersPane


var blessed = require('blessed')
, contrib = require('blessed-contrib')
, http = require('http')
, dateFormat = require('dateformat')
, log = require('simple-node-logger').createSimpleFileLogger('envoy.log')
, Listeners = require('./listeners.js')
, ClustersPane = require('./clusters_pane.js')
, Stats = require('./stats.js')
, Clusters = require('./clusters.js')
, Server = require('./server.js')
, HttpPane = require('./http.js')

var screen = blessed.screen()
var adminServerAddress = "192.168.99.100:8001"
log.setLevel('debug')
//create layout and widgets

let stats = new Stats({
  log: log,
  stats_uri: `http://${adminServerAddress}/stats`
})

let clusters = new Clusters({
  log: log,
  clusters_uri: `http://${adminServerAddress}/clusters`
})

let listeners = Listeners({
  domain: 'http.gke-proxy-80',
  height: '100%-6',
  stats: stats,
  screen: screen,
  log: log
})

let clustersPane = ClustersPane({
  clusters: clusters,
  stats: stats,
  screen: screen,
  log: log
})

let server = Server({
  stats: stats,
  screen: screen,
  log: log
})

let httpPane = HttpPane({
  stats: stats,
  screen: screen,
  log: log
})

function serverPage(screen) {
  screen.append(server)
}

function listenersPage(screen) {
  screen.append(listeners)
}

function clustersPage(screen) {
  screen.append(clustersPane)
}

function httpPage(screen) {
  screen.append(httpPane)
}

var carousel = new contrib.carousel(
  [serverPage, clustersPage, listenersPage, httpPage],
  { screen: screen
    , interval: 0 
    , controlKeys: true
  }
)


screen.key(['q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

carousel.start()

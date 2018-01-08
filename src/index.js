
let blessed = require('blessed')
let contrib = require('blessed-contrib')
let Carousel = contrib.carousel
let log = require('simple-node-logger').createSimpleFileLogger('envoy.log')
let Listeners = require('./listeners.js')
let ClustersPane = require('./clusters_pane.js')
let Stats = require('./stats.js')
let Clusters = require('./clusters.js')
let Server = require('./server.js')
let HttpPane = require('./http.js')

let screen = blessed.screen()
let adminServerAddress = '192.168.99.100:8001'
log.setLevel('debug')
// create layout and widgets

let stats = new Stats({
  log: log,
  statsURI: `http://${adminServerAddress}/stats`,
})

let clusters = new Clusters({
  log: log,
  clustersURI: `http://${adminServerAddress}/clusters`,
})

let listeners = new Listeners({
  domain: 'http.gke-proxy-80',
  height: '100%-6',
  stats: stats,
  screen: screen,
  log: log,
})

let clustersPane = new ClustersPane({
  clusters: clusters,
  stats: stats,
  screen: screen,
  log: log,
})

let server = new Server({
  stats: stats,
  screen: screen,
  log: log,
})

let httpPane = new HttpPane({
  stats: stats,
  screen: screen,
  log: log,
})

function serverPage(serversScreen) {
  serversScreen.append(server)
}

function listenersPage(listersScreen) {
  listersScreen.append(listeners)
}

function clustersPage(clustersScreen) {
  clustersScreen.append(clustersPane)
}

function httpPage(httpScreen) {
  httpScreen.append(httpPane)
}

let carousel = new Carousel(
  [serverPage, clustersPage, listenersPage, httpPage],
  { screen: screen,
    interval: 0,
    controlKeys: true,
  }
)


screen.key(['q', 'C-c'], function (ch, key) {
  return process.exit(0);
});

carousel.start()

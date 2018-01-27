
let blessed = require('blessed')
let contrib = require('blessed-contrib')
let Carousel = contrib.carousel
let log = require('simple-node-logger').createSimpleFileLogger('envoy-curses.log')
let Stats = require('./stats.js')
let StatsPane = require('./stats_pane.js')
let Clusters = require('./clusters.js')
let ClustersPane = require('./clusters_pane.js')
let Server = require('./server.js')

let screen = blessed.screen()
let adminServerAddress = process.argv[2] || 'localhost:9000'
let pollingInterval = parseInt(process.argv[3]) || 1000
log.setLevel('info')
// create layout and widgets

let stats = new Stats({
  log: log,
  pollingInterval: pollingInterval,
  statsURI: `http://${adminServerAddress}/stats`,
})

let clusters = new Clusters({
  log: log,
  pollingInterval: pollingInterval,
  clustersURI: `http://${adminServerAddress}/clusters`,
})

let statsPane = new StatsPane({
  domain: 'http.gke-proxy-80',
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

let carousel = new Carousel(
  [server.show, clustersPane.show, statsPane.show],
  { screen: screen,
    interval: 0,
    controlKeys: true,
  }
)

stats.start()
clusters.start()

screen.key(['C-c', 'C-d'], function (ch, key) {
  return process.exit(0);
});

carousel.start()

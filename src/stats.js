let EventEmitter = require('events')
let dateFormat = require('dateformat')

const http = require('http');

class Stats extends EventEmitter {
  constructor(options) {
    super()
    this.log = options.log
    this.options = options || {}
    this.statsURI = this.options.statsURI || 'http://localhost:9999/stats'
    this.bufferSize = this.options.bufferSize || 20
    this.pollingInterval = this.options.pollingInterval || 1000
    this.bufferIdx = -1
    this.stats = {}
    this.statsTree = {
      extended: true,
    }
    this.times = []
  }

  /**
   * return an array of stat names from the last call to the stats endpoint
   * @param {string} statsPrefix a filter to apply to stat names
   * @returns {array} stat names
   */
  getStatNames(statsPrefix) {
    let names = new Set()
    Object.getOwnPropertyNames(this.stats).forEach(s => {
      if (s.startsWith(statsPrefix)) {
        names.add(s.split('.').pop())
      }
    })
    return names
  }

  /**
   * get stats suitable for display in a table widget
   * @param {string} match a regex to filter the tables stats on
   * @returns {array} of elements that correspond to table cells
   */
  getStatsTable(match) {
    let stats = Object.getOwnPropertyNames(this.stats).filter(s => {
      return match.exec(s)
    }).map(s => {
      return [s, this.getCurrentStatValue(s).toString()]
    })
    stats.unshift(['Stat Name', 'Stat Value'])
    return stats
  }

  /**
   * return the raw circular buffer for a stat
   * @param {string} statName the actual stat to retrieve
   * @returns {array} raw stats
   */
  getStat(statName) {
    if (this.stats[statName]) {
      return this.stats[statName]
    }
    this.log.error(`unknown series ${statName}`)
    return `err - ${statName}`
  }

  /**
   * return the current value of the given stat
   * @param {string} statName the actual stat to retrieve
   * @returns {array} raw stats
   */
  getCurrentStatValue(statName) {
    if (this.stats[statName]) {
      return this.stats[statName][this.bufferIdx]
    }
    this.log.error(`unknown series ${statName}`)
    return `err - ${statName}`
  }

  /**
   * compute deltas over the raw circular buffer, returning a metric series.
   * will return an object containing an x array (the metric value) and y array
   * (the textual timestamps of the metric values)
   * @param {string} statName the actual stat to retrieve
   * @returns {array} array of delta metrics
   */
  getSeries(statName) {
    this.log.debug(`looking for ${statName}, bufferIdx=${this.bufferIdx}`)
    let series = this.stats[statName]
    if (!series) {
      this.log.error(`unknown series ${statName}`)
      return null
    }
    this.log.debug(`series = ${series}`)
    this.log.debug(`series: ${this.stats[statName]}`)
    let x = []
    let y = []
    let numSamples = 0
    for (let i = 2; i < this.bufferSize; i++) {
      let idx = (i + this.bufferIdx) % this.bufferSize
      if (typeof series[idx] !== 'undefined') {
        numSamples++
        let lastIdx = idx - 1
        if (lastIdx < 0) {
          lastIdx = this.bufferSize - 1
        }
        y.push(series[idx] - series[lastIdx])
        x.push(this.times[idx])
      }
    }
    if (numSamples > 0) {
      return {
        x: x,
        y: y,
      }
    }
    return null
  }

  /**
   * returning a gauge series for the given stat.
   * will return an object containing an x array (the metric value) and y array
   * (the textual timestamps of the metric values)
   * @param {string} statName name of the cluster to retrieve hosts for
   * @returns {array} gauge metrics
   */
  getSeriesAsGauge(statName) {
    this.log.debug(`looking for ${statName}, bufferIdx=${this.bufferIdx}`)
    let series = this.stats[statName]
    if (!series) {
      this.log.error(`unknown series ${statName}`)
      return null
    }
    this.log.debug(`series = ${series}`)
    this.log.debug(`series: ${this.stats[statName]}`)
    let x = []
    let y = []
    let numSamples = 0
    for (let i = 1; i < this.bufferSize; i++) {
      let idx = (i + this.bufferIdx) % this.bufferSize
      if (typeof series[idx] !== 'undefined') {
        numSamples++
        y.push(series[idx])
        x.push(this.times[idx])
      }
    }
    if (numSamples > 0) {
      return {
        x: x,
        y: y,
      }
    }
    return null
  }

  /**
   * stat a timer to poll the cluster endpoint on the given interval
   * @returns {null} nothing
   */
  start() {
    this.pollStats()
    setInterval(this.pollStats.bind(this), this.pollingInterval)
  }

  /**
   * call Envoy's <manager>/clusters endpoint, update metrics and stat names
   * @returns {null} nothing
   */
  pollStats() {
    http.get(this.statsURI, res => {
      let body = '';
      res.on('data', data => {
        body = body + data;
      });
      res.on('end', () => {
        this.bufferIdx++
        this.bufferIdx = this.bufferIdx % this.bufferSize

        let now = dateFormat(new Date(), 'HH:MM:ss')
        this.times[this.bufferIdx] = now
        body.split('\n').forEach(m => {
          let splits = m.split(':')
          let statName = splits[0]
          let statValue = parseInt(splits[1])
          if (typeof this.stats[statName] === 'undefined') {
            this.stats[statName] = []
          }
          let series = this.stats[statName]
          series[this.bufferIdx] = statValue
        })
        this.emit('updated')
      })
    })
  }
}

module.exports = Stats

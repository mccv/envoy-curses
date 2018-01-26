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

    this.pollStats = () => {
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

    this.getStatNames = (statsPrefix) => {
      let names = new Set()
      Object.getOwnPropertyNames(this.stats).forEach(s => {
        if (s.startsWith(statsPrefix)) {
          names.add(s.split('.').pop())
        }
      })
      return names
    }

    this.getListenerNames = () => {
      let names = new Set()
      Object.getOwnPropertyNames(this.stats).forEach(s => {
        if (s.match(/^listener\.(.*)\.downstream_cx_active/)) {
          names.add(s.match(/^listener\.(.*)\.downstream_cx_active/)[1])
        }
      })
      return names
    }

    this.getStatsTable = (match) => {
      let stats = Object.getOwnPropertyNames(this.stats).filter(s => {
        return match.exec(s)
      }).map(s => {
        return [s, this.getStat(s).toString()]
      })
      stats.unshift(['Stat Name', 'Stat Value'])
      return stats
    }
    this.getStatsTree = () => {
      Object.getOwnPropertyNames(this.stats).forEach(s => {
        let nodes = s.split('.')
        let parent = this.statsTree
        nodes.forEach(n => {
          if (!parent.children) {
            parent.children = {}
          }
          if (!parent.children[n]) {
            parent.children[n] = {
              statName: s,
            }
          }
          parent = parent.children[n]
        })
      })
      return this.statsTree
    }

    this.getStat = (statName) => {
      if (this.stats[statName]) {
        return this.stats[statName][this.bufferIdx]
      }
      this.log.error(`unknown series ${statName}`)
      return `err - ${statName}`
    }

    this.getSeries = (seriesName) => {
      this.log.debug(`looking for ${seriesName}, bufferIdx=${this.bufferIdx}`)
      let series = this.stats[seriesName]
      if (!series) {
        this.log.error(`unknown series ${seriesName}`)
        return null
      }
      this.log.debug(`series = ${series}`)
      this.log.debug(`series: ${this.stats[seriesName]}`)
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

    this.getSeriesAsGauge = (seriesName) => {
      this.log.debug(`looking for ${seriesName}, bufferIdx=${this.bufferIdx}`)
      let series = this.stats[seriesName]
      if (!series) {
        this.log.error(`unknown series ${seriesName}`)
        return null
      }
      this.log.debug(`series = ${series}`)
      this.log.debug(`series: ${this.stats[seriesName]}`)
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
    this.start = () => {
      this.pollStats()
      setInterval(this.pollStats, this.pollingInterval)
    }
  }
}

module.exports = Stats

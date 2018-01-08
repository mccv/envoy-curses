const EventEmitter = require('events')
, dateFormat = require('dateformat')

const http = require('http');

class Stats extends EventEmitter {
  constructor(options) {
    super()
    this.log = options.log
    this.options = options || {}
    this.stats_uri = this.options.stats_uri || "http://localhost:9999/stats"
    this.buffer_size = this.options.buffer_size || 20
    this.polling_interval = this.options.polling_interval || 1000
    this.buffer_idx = -1
    this.stats = {}
    this.times = []
    
    this.pollStats = () => {
      http.get(this.stats_uri, res => {
        let body = "";
        res.on("data", data => {
          body += data;
        });
        res.on("end", () => {
          this.buffer_idx++
          this.buffer_idx %= this.buffer_size
          
          var now = dateFormat(new Date(), 'HH:MM:ss')
          this.times[this.buffer_idx] = now
          body.split("\n").forEach(m => {
            let splits = m.split(":")
            let statName = splits[0]
            let statValue = parseInt(splits[1])
            if (typeof this.stats[statName] == 'undefined') {
              this.stats[statName] = []
            }
            let series = this.stats[statName]
            series[this.buffer_idx] = statValue
          })
          this.emit('updated')
        })
      })
    }

    this.getStat = (statName) => {
      if (this.stats[statName]) {
        return this.stats[statName][this.buffer_idx]
      } else {
        this.log.error(`unknown series ${statName}`)
        return `err - ${statName}`
      }
    }

    this.getSeries = (seriesName) => {
      this.log.debug(`looking for ${seriesName}, buffer_idx=${this.buffer_idx}`)
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
      for (i = 2; i < this.buffer_size; i++) {
        let idx = (i + this.buffer_idx) % this.buffer_size
        if (typeof series[idx] != 'undefined') {
          numSamples++
          let lastIdx = idx - 1
          if (lastIdx < 0) {
            lastIdx = this.buffer_size - 1
          }
          y.push(series[idx] - series[lastIdx])
          x.push(this.times[idx])
        }
      }
      if (numSamples > 0) {
        return {
          x: x,
          y: y
        }
      } else {
        return null
      }
    }

    this.getSeriesAsGauge = (seriesName) => {
      this.log.debug(`looking for ${seriesName}, buffer_idx=${this.buffer_idx}`)
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
      for (i = 1; i < this.buffer_size; i++) {
        let idx = (i + this.buffer_idx) % this.buffer_size
        if (typeof series[idx] != 'undefined') {
          numSamples++
          y.push(series[idx])
          x.push(this.times[idx])
        }
      }
      if (numSamples > 0) {
        return {
          x: x,
          y: y
        }
      } else {
        return null
      }
    }
    setInterval(this.pollStats, this.polling_interval)
  }
}

module.exports = Stats

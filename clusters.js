const EventEmitter = require('events')
, dateFormat = require('dateformat')

const http = require('http');

class Clusters extends EventEmitter {
  constructor(options) {
    super()
    this.log = options.log
    this.options = options || {}
    this.clusters_uri = this.options.clusters_uri || "http://localhost:9999/clusters"
    this.buffer_size = this.options.buffer_size || 20
    this.polling_interval = this.options.polling_interval || 1000
    this.buffer_idx = -1
    this.clusters = {}
    this.times = []

    this.pollStats = () => {
      http.get(this.clusters_uri, res => {
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
            let splits = m.split("::")
            if (splits.length == 4) {
              let clusterName = splits[0]
              let statNamespace = splits[1]
              let statName = splits[2]
              let statValue = splits[3]
              let statNumeric = parseInt(statValue)
              if (typeof this.clusters[clusterName] == 'undefined') {
                this.clusters[clusterName] = {}
              }
              if (typeof this.clusters[clusterName][statNamespace] == 'undefined') {
                this.clusters[clusterName][statNamespace] = {}
              }
              if (!isNaN(statNumeric)) {
                if (typeof this.clusters[clusterName][statNamespace][statName] == 'undefined') {
                  this.clusters[clusterName][statNamespace][statName] = []
                }
                this.clusters[clusterName][statNamespace][statName][this.buffer_idx] = statNumeric
              } else {
                this.clusters[clusterName][statNamespace][statName] = statValue
              }
            }
          })
          this.emit('updated')
        })
      })
    }

    this.getClusterNames = () => {
      return Object.getOwnPropertyNames(this.clusters)
    }

    this.getHostNames = (clusterName) => {
      return Object.getOwnPropertyNames(this.clusters[clusterName])
    }

    this.getStatNames = (clusterName, statNamespace) => {
      return Object.getOwnPropertyNames(this.clusters[clusterName][statNamespace])
    }
    this.getStat = (clusterName, statNamespace, statName) => {
      if (this.clusters[clusterName] &&
          this.clusters[clusterName][statNamespace] &&
          this.clusters[clusterName][statNamespace][statName]) {
        return this.clusters[clusterName][statNamespace][statName]
      } else {
        this.log.error(`unknown series ${clusterName}::${statNamespace}${statName}`)
        return `err - ${clusterName}::${statNamespace}${statName}`
      }
    }

    this.getSeries = (clusterName, statNamespace, statName) => {
      this.log.debug(`looking for ${clusterName}::${statNamespace}${statName}, buffer_idx=${this.buffer_idx}`)
      let series = this.clusters[clusterName][statNamespace][statName]
      if (!series) {
        this.log.error(`unknown series ${clusterName}::${statNamespace}${statName}`)
        return null
      }
      this.log.debug(`series = ${series}`)
      let x = []
      let y = []
      let numSamples = 0
      for (i = 2; i < this.buffer_size; i++) {
        let idx = (i + this.buffer_idx) % this.buffer_size
        if (typeof series[idx] != 'undefined') {
          let lastIdx = idx - 1
          if (lastIdx < 0) {
            lastIdx = this.buffer_size - 1
          }
          let delta = series[idx] - series[lastIdx]
          if (!isNaN(delta)) {
            numSamples++
            y.push(series[idx] - series[lastIdx])
            x.push(this.times[idx])
          }
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

    this.getSeriesAsGauge = (clusterName, statNamespace, statName) => {
      this.log.debug(`looking for ${statName}, buffer_idx=${this.buffer_idx}`)
      let series = this.clusters[clusterName][statNamespace][statName]
      if (!series) {
        this.log.error(`unknown series ${clusterName}::${statNamespace}${statName}`)
        return null
      }
      this.log.debug(`series = ${series}`)
      this.log.debug(`series = ${series}`)
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

module.exports = Clusters

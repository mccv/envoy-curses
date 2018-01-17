let EventEmitter = require('events')
let dateFormat = require('dateformat')

const http = require('http');

class Clusters extends EventEmitter {
  constructor(options) {
    super()
    this.log = options.log
    this.options = options || {}
    this.clustersURI = this.options.clustersURI || 'http://localhost:9999/clusters'
    this.bufferSize = this.options.bufferSize || 20
    this.pollingInterval = this.options.pollingInterval || 1000
    this.bufferIdx = -1
    this.clusters = {}
    this.times = []

    this.pollStats = () => {
      http.get(this.clustersURI, res => {
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
            let splits = m.split('::')
            if (splits.length === 4) {
              let clusterName = splits[0]
              let statNamespace = splits[1]
              let statName = splits[2]
              let statValue = splits[3]
              let statNumeric = parseInt(statValue)
              if (typeof this.clusters[clusterName] === 'undefined') {
                this.clusters[clusterName] = {}
              }
              if (typeof this.clusters[clusterName][statNamespace] === 'undefined') {
                this.clusters[clusterName][statNamespace] = {}
              }
              if (!isNaN(statNumeric)) {
                if (typeof this.clusters[clusterName][statNamespace][statName] === 'undefined') {
                  this.clusters[clusterName][statNamespace][statName] = []
                }
                this.clusters[clusterName][statNamespace][statName][this.bufferIdx] = statNumeric
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
      }
      this.log.error(`unknown series ${clusterName}::${statNamespace}${statName}`)
      return `err - ${clusterName}::${statNamespace}${statName}`
    }

    this.getSeries = (clusterName, statNamespace, statName) => {
      let series = this.clusters[clusterName][statNamespace][statName]
      if (!series) {
        this.log.error(`unknown series ${clusterName}::${statNamespace}${statName}`)
        return null
      }
      this.log.debug(`series = ${series}`)
      let x = []
      let y = []
      let numSamples = 0
      for (let i = 2; i < this.bufferSize; i++) {
        let idx = (i + this.bufferIdx) % this.bufferSize
        if (typeof series[idx] !== 'undefined') {
          let lastIdx = idx - 1
          if (lastIdx < 0) {
            lastIdx = this.bufferSize - 1
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
          y: y,
        }
      }
      return null
    }

    this.getSeriesAsGauge = (clusterName, statNamespace, statName) => {
      this.log.debug(`looking for ${statName}, bufferIdx=${this.bufferIdx}`)
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

module.exports = Clusters

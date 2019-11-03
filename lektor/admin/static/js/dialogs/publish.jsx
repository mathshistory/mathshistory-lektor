'use strict'

/* eslint-env browser */

import React from 'react'
import Component from '../components/Component'
import SlideDialog from '../components/SlideDialog'
import utils from '../utils'
import i18n from '../i18n'
import dialogSystem from '../dialogSystem'
import makeRichPromise from '../richPromise'

class Publish extends Component {
  constructor (props) {
    super(props)

    this.state = {
      servers: [],
      activeTarget: null,
      log: [],
      currentState: 'IDLE'
    }
    this.intervalId = null
    this.onInterval = this.onInterval.bind(this)
  }

  componentDidMount () {
    super.componentDidMount()
    this.syncDialog()
  }

  componentWillUnmount () {
    super.componentWillUnmount()
  }

  componentWillReceiveProps (nextProps) {
    this.syncDialog()
  }

  preventNavigation () {
    return !this.isSafeToPublish()
  }

  syncDialog () {
    utils.loadData('/servers', {}, null, makeRichPromise)
      .then(({ servers }) => {
        this.setState({
          servers: servers,
          activeTarget: servers && servers.length
            ? servers[0].id
            : null
        })

        this.getPublishState()
      })
  }

  getPublishState () {
    utils.apiRequest('/buildpublish-result', {}, makeRichPromise)
      .then((resp) => {
        if (resp.okay) {
          // we're still publishing
          this.setState({
            currentState: 'BUILDING'
          })
          this.intervalId = window.setInterval(this.onInterval, 2000)
        }
      })
  }

  isSafeToPublish () {
    return this.state.currentState === 'IDLE' ||
      this.state.currentState === 'DONE'
  }

  onPublish () {
    const server = encodeURIComponent(this.state.activeTarget)

    utils.apiRequest('/buildpublish-start', { data: { server: server }, method: 'POST' }, makeRichPromise)
      .then((resp) => {
        if (resp.okay) {
          this.setState({
            currentState: 'BUILDING'
          })

          // start the interval
          this.intervalId = window.setInterval(this.onInterval, 2000)
        } else {
          this.setState({
            currentState: 'ERROR'
          })
        }
      })
  }

  onInterval () {
    utils.apiRequest('/buildpublish-result', {}, makeRichPromise)
      .then((resp) => {
        console.log(resp)
        if (!resp.okay) {
          window.clearInterval(this.intervalId)
          this.setState({
            currentState: 'ERROR'
          })
        }

        if (resp.done) {
          console.log('done!')
          window.clearInterval(this.intervalId)
          console.log('cleared interval', this.intervalId)
          this.setState({
            currentState: 'DONE'
          })
        }
      })
  }

  onCancel () {
    dialogSystem.dismissDialog()
  }

  onSelectServer (event) {
    this.setState({
      activeTarget: event.target.value
    })
  }

  componentDidUpdate () {
    super.componentDidUpdate()
    const node = this.refs.log
    if (node) {
      node.scrollTop = node.scrollHeight
    }
  }

  render () {
    const servers = this.state.servers.map((server) => {
      return (
        <option value={server.id} key={server.id}>
          {i18n.trans(server.name_i18n) + ' (' + server.short_target + ')'}
        </option>
      )
    })

    let progress = null
    if (this.state.currentState !== 'IDLE') {
      progress = (
        <div>
          <h3>{this.state.currentState !== 'DONE'
            ? i18n.trans('CURRENTLY_PUBLISHING')
            : i18n.trans('PUBLISH_DONE')}</h3>
          <pre>{i18n.trans('STATE') + ': ' +
            i18n.trans('PUBLISH_STATE_' + this.state.currentState)}</pre>
          <pre ref='log' className='build-log'>{this.state.log.join('\n')}</pre>
        </div>
      )
    }

    return (
      <SlideDialog
        hasCloseButton={false}
        closeOnEscape
        title={i18n.trans('PUBLISH')}>
        <p>{i18n.trans('PUBLISH_NOTE')}</p>
        <dl>
          <dt>{i18n.trans('PUBLISH_SERVER')}</dt>
          <dd>
            <div className='input-group'>
              <select
                value={this.state.activeTarget}
                onChange={this.onSelectServer.bind(this)}
                className='form-control'>
                {servers}
              </select>
            </div>
          </dd>
        </dl>
        <div className='actions'>
          <button type='submit' className='btn btn-primary'
            disabled={!this.isSafeToPublish()}
            onClick={this.onPublish.bind(this)}>{i18n.trans('PUBLISH')}</button>
          <button type='submit' className='btn btn-default'
            disabled={!this.isSafeToPublish()}
            onClick={this.onCancel.bind(this)}>{i18n.trans(
              this.state.currentState === 'DONE' ? 'CLOSE' : 'CANCEL')}</button>
        </div>
        {progress}
      </SlideDialog>
    )
  }
}

export default Publish

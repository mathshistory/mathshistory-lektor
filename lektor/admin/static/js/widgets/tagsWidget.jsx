// npm install --save-dev react-tag-autocomplete

import React from 'react'
import ReactTags from 'react-tag-autocomplete'

function transformTags (tags) {
  const t = tags.map((tag, idx) => ({
    id: idx,
    name: tag
  }))
  console.log(t)
  return t
}

class TagsWidget extends React.Component {
  handleDelete (i) {
    const tags = this.props.value.slice(0)
    tags.splice(i, 1)
    if (this.props.onChange) {
      this.props.onChange(tags)
    }
  }

  handleAddition (tag) {
    const tags = [].concat(this.props.value, tag)
    if (this.props.onChange) {
      this.props.onChange(tags)
    }
  }

  suggestionsFilter (suggestion, query) {
    return this.props.value.indexOf(suggestion) === -1
  }

  calculatePlaceholder () {
    return this.props.value.length === this.props.type.tags.length ? 'No more tags available' : 'Add new tag'
  }

  render () {
    console.log(this.props)
    return (
      <ReactTags
        tags={this.props.value}
        suggestions={transformTags(this.props.type.tags)}
        handleDelete={this.handleDelete.bind(this)}
        handleAddition={this.handleAddition.bind(this)}
        minQueryLength={0}
        maxSuggestionsLength={999}
        suggestionsFilter={this.suggestionsFilter.bind(this)}
        placeholder={this.calculatePlaceholder.bind(this)()}
        autofocus={this.props.disabled}
        disabled={true}
      />
    )
  }
}

TagsWidget.deserializeValue = value => {
  const deserialized = JSON.parse(value)
  if (!Array.isArray(deserialized)) return []
  return transformTags(deserialized)
}
TagsWidget.serializeValue = value => {
  const serialized = JSON.stringify(value)
  return serialized
}

export default TagsWidget

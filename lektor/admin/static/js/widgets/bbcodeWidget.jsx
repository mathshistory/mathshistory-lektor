// @import "~bootstrap/less/dropdowns";

// npm install --save-dev slate-react slate immutable katex react is-hotkey react-color slate-bbcode-serializer @mathshistory/bbcode-rules @mdi/react @mdi/js

import { Editor } from 'slate-react'
import { Value } from 'slate'
import katex from 'katex'
import React from 'react'
import { isKeyHotkey } from 'is-hotkey'
import { TwitterPicker } from 'react-color'
import BBCode from 'slate-bbcode-serializer'
import {
  BBCODE_RULES,
  BBCODE_TAGS,
  RENDER_BLOCK,
  RENDER_MARK,
  RENDER_INLINE
} from '@mathshistory/bbcode-rules'

import Icon from '@mdi/react'
import {
  mdiLink,
  mdiFormatBold,
  mdiFormatItalic,
  mdiFormatUnderline,
  mdiFormatOverline,
  mdiFormatSuperscript,
  mdiFormatSubscript,
  mdiPalette,
  mdiFormatFontSizeIncrease,
  mdiFormatFontSizeDecrease,
  mdiCodeNotEqualVariant,
  mdiFormatHeader1,
  mdiFormatHeader2,
  mdiFormatHeader3,
  mdiFormatHeader4,
  mdiFormatHeader5,
  mdiFormatHeader6,
  mdiFormatParagraph,
  mdiFormatListBulletedSquare,
  mdiFormatQuoteClose,
  mdiFormatAlignCenter,
  mdiFormatIndentIncrease,
  mdiFormatClear,
  mdiImage,
  mdiLinkVariant,
  mdiTranslate,
  mdiMathSin,
  mdiAnchor,
  mdiPlus,
  mdiAccountArrowRight,
  mdiTooltipAccount,
  mdiInformationOutline,
  mdiSchool
} from '@mdi/js'

import SlideDialog from '../components/SlideDialog'
import dialogSystem from '../dialogSystem'

const BUTTON_ACTIVE_COLOR = 'black'
const BUTTON_INACTIVE_COLOR = '#aaa'

const bbcode = new BBCode(BBCODE_RULES, BBCODE_TAGS)

const blockSchema = {
  nodes: [
    {
      match: [
        { object: 'text' },
        { object: 'inline' },
      ]
    }
  ]
}

const inlinesSchema = {
  image: {
    isVoid: true,
  },
  reference: {
    isVoid: true,
  },
  translation: {
    isVoid: true
  },
  math: {
    isVoid: true,
  },
  anchor: {
    isVoid: true,
  },
}

const blockEditorSchema = {
  inlines: inlinesSchema,
  document: {
    nodes: [
      {
        match: [
          { type: 'heading-one' },
          { type: 'heading-two' },
          { type: 'heading-three' },
          { type: 'heading-four' },
          { type: 'heading-five' },
          { type: 'heading-six' },
          { type: 'paragraph' },
          { type: 'list' },
          { type: 'quote' },
          { type: 'center-paragraph' },
          { type: 'indent-paragraph' },
          { type: 'preformatted-paragraph' },
        ]
      }
    ]
  },
  blocks: {
    ['heading-one']: blockSchema,
    ['heading-two']: blockSchema,
    ['heading-three']: blockSchema,
    ['heading-four']: blockSchema,
    ['heading-five']: blockSchema,
    ['heading-six']: blockSchema,
    paragraph: blockSchema,
    list: {
      nodes: [
        {
          match: { type: 'list-item' }
        }
      ]
    },
    ['list-item']: blockSchema,
    quote: blockSchema,
    ['center-paragraph']: blockSchema,
    ['indent-paragraph']: blockSchema,
    ['preformatted-paragraph']: blockSchema,
  }
}

const inlineEditorSchema = {
  inlines: inlinesSchema,
  document: {
    nodes: [
      {
        match: [
          { type: 'inlineblock' },
        ],
        min: 1,
        max: 1
      }
    ]
  },
  blocks: {
    inlineblock: blockSchema,
  }
}

/**
 * Define hotkey matchers.
 *
 * @type {Function}
 */

const isBoldHotkey = isKeyHotkey('mod+b')
const isItalicHotkey = isKeyHotkey('mod+i')
const isUnderlinedHotkey = isKeyHotkey('mod+u')
const isCodeHotkey = isKeyHotkey('mod+`')

/**
 * The rich text example.
 *
 * @type {Component}
 */

class BBCodeEditor extends React.Component {
  constructor (props) {
    super(props)

    this.DEFAULT_NODE = this.props.type === 'inline' ? 'inlineblock' : 'paragraph'

    /*this.state = {
      value: this.props.value
    }*/

    this.getValue = this.getValue.bind(this)
    this.hasMark = this.hasMark.bind(this)
    this.hasBlock = this.hasBlock.bind(this)
    this.hasInline = this.hasInline.bind(this)
    this.ref = this.ref.bind(this)
    this.typeToIcon = this.typeToIcon.bind(this)
    this.renderBlockDropdown = this.renderBlockDropdown.bind(this)
    this.renderToolbar = this.renderToolbar.bind(this)
    this.renderInlineButton = this.renderInlineButton.bind(this)
    this.renderMarkButton = this.renderMarkButton.bind(this)
    this.renderBlockButton = this.renderBlockButton.bind(this)
    this.editorOnChange = this.editorOnChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    this.onClickInline = this.onClickInline.bind(this)
    this.onClickMark = this.onClickMark.bind(this)
    this.onClickBlock = this.onClickBlock.bind(this)
    this.onInlineClick = this.onInlineClick.bind(this)
  }

  /**
   * Deserialize the initial editor value.
   *
   * @type {Object}
   */
  getValue () {
    let value = this.props.value
    if (value.trim() === '' && this.props.type !== 'inline') {
      value = '[p][/p]'
    }

    let deserialized = bbcode.deserialize(value, { type: this.props.type === 'inline' ? 'inline' : 'block' })
    if (this.props.type === 'inline') {
      deserialized.document.nodes = [
        {
          data: {},
          nodes: deserialized.document.nodes,
          object: 'block',
          type: 'inlineblock'
        }
      ]
    }
    return Value.fromJSON(deserialized, { normalize: true })
  }

  /**
   * Check if the current selection has a mark with `type` in it.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasMark (type) {
    //const { value } = this.state
    const value = this.props.value
    return value.marks.some(mark => mark.type === type)
  }

  /**
   * Check if the any of the currently selected blocks are of `type`.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasBlock (type) {
    //const { value } = this.state
    const value = this.props.value
    return value.blocks.some(node => node.type === type)
  }

  /**
   * Check if the any of the currently selected blocks are of `inline`.
   *
   * @param {String} type
   * @return {Boolean}
   */

  hasInline (type) {
    //const { value } = this.state
    const value = this.props.value
    return value.inlines.some(node => node.type === type)
  }

  /**
   * Store a reference to the `editor`.
   *
   * @param {Editor} editor
   */

  ref (editor) {
    this.editor = editor
  }

  /**
   *
   *
   */
  typeToIcon (type) {
    switch (type) {
      case 'heading-one':
        return [mdiFormatHeader1, 'Heading 1']
      case 'heading-two':
        return [mdiFormatHeader2, 'Heading 2']
      case 'heading-three':
        return [mdiFormatHeader3, 'Heading 3']
      case 'heading-four':
        return [mdiFormatHeader4, 'Heading 4']
      case 'heading-five':
        return [mdiFormatHeader5, 'Heading 5']
      case 'heading-six':
        return [mdiFormatHeader6, 'Heading 6']
      case 'paragraph':
        return [mdiFormatParagraph, 'Paragraph']
      case 'list':
      case 'list-item':
        return [mdiFormatListBulletedSquare, 'List']
      case 'quote':
        return [mdiFormatQuoteClose, 'Quote']
      case 'center-paragraph':
        return [mdiFormatAlignCenter, 'Centered Paragraph']
      case 'indent-paragraph':
        return [mdiFormatIndentIncrease, 'Indented Paragraph']
      case 'preformatted-paragraph':
        return [mdiFormatClear, 'Preformatted Paragraph']

      case 'link':
        return [mdiLink, 'Link']
      case 'bold':
        return [mdiFormatBold, 'Bold']
      case 'italic':
        return [mdiFormatItalic, 'Italic']
      case 'underline':
        return [mdiFormatUnderline, 'Underline']
      case 'overline':
        return [mdiFormatOverline, 'Overline']
      case 'superscript':
        return [mdiFormatSuperscript, 'Superscript']
      case 'subscript':
        return [mdiFormatSubscript, 'Subscript']
      case 'mlink':
        return [mdiTooltipAccount, 'M Link']
      case 'wlink':
        return [mdiAccountArrowRight, 'W Link']
      case 'gllink':
        return [mdiInformationOutline, 'Glossary Link']
      case 'aclink':
        return [mdiSchool, 'Society Link']
      case 'color':
        return [mdiPalette, 'Text Color']
      case 'big':
        return [mdiFormatFontSizeIncrease, 'Bigger']
      case 'small':
        return [mdiFormatFontSizeDecrease, 'Smaller']
      case 'code':
        return [mdiCodeNotEqualVariant, 'Code']

      case 'image':
        return [mdiImage, 'Add Image']
      case 'reference':
        return [mdiLinkVariant, 'Add Reference']
      case 'translation':
        return [mdiTranslate, 'Add Translation']
      case 'math':
        return [mdiMathSin, 'Add Formula']
      case 'anchor':
        return [mdiAnchor, 'Add Anchor']

      default:
        return [mdiFormatParagraph, 'Paragraph']
    }
  }

  onInlineClick (inline) {
    const { type, key, data } = inline
    let title, attribute, label
    switch (type) {
      case 'image':
        title = 'Edit Image'
        attribute = 'src'
        label = 'Image SRC'
        break
      case 'reference':
        title = 'Edit Reference'
        attribute = 'num'
        label = 'Reference Number'
        break
      case 'translation':
        title = 'Edit Translation'
        attribute = 'num'
        label = 'Translation Text'
        break
      case 'math':
        title = 'Edit Formula'
        attribute = 'math'
        label = 'KaTeX Formula'
        break
      case 'anchor':
        title = 'Edit Anchor'
        attribute = 'anchor'
        label = 'Anchor Name'
        break
    }

    dialogSystem.showDialog(EditorPopup, {
      value: data.get(attribute),
      removeBtn: 'Delete',
      addBtn: 'Update',
      update: value => {
        this.editor.setNodeByKey(inline.key, {
          data: {
            [attribute]: value
          }
        })
      },
      remove: () => {
        this.editor.removeNodeByKey(inline.key)
      },
      inner: InlineDialogContents,
      title: title,
      label: label,
      math: type === 'math'
    })
  }

  /**
   * Render.
   *
   * @return {Element}
   */

  render() {
    return (
      <div style={{paddingLeft: '20px', paddingRight: '20px', border: '1px solid #eeeeee'}}>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.css"/>
        {this.renderToolbar()}
        <div style={{paddingBottom: '16px'}}>
          <Editor
            autoFocus
            placeholder='Enter some text...'
            ref={this.ref}
            value={this.props.value}
            onChange={this.editorOnChange}
            onKeyDown={this.onKeyDown}
            renderBlock={RENDER_BLOCK}
            renderMark={RENDER_MARK}
            renderInline={RENDER_INLINE}
            spellCheck={false}
            schema={this.props.type === 'inline' ? inlineEditorSchema : blockEditorSchema}
            onInlineClick={this.onInlineClick}
          />
        </div>
      </div>
    )
  }

  renderBlockDropdown () {
    const selectedBlocks = this.props.value.blocks
    const headingType = selectedBlocks.first() ? selectedBlocks.first().type : this.DEFAULT_NODE
    const headingIcon = this.typeToIcon(headingType)[0]

    return (
      <div>
        <div className="btn-group">
          <button type="button" className="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <Icon path={headingIcon} size={0.8} />
            <span className="caret"></span>
          </button>
          <ul className="dropdown-menu">
            {this.renderBlockButton('paragraph')}
            {this.renderBlockButton('heading-one')}
            {this.renderBlockButton('heading-two')}
            {this.renderBlockButton('heading-three')}
            {this.renderBlockButton('heading-four')}
            {this.renderBlockButton('heading-five')}
            {this.renderBlockButton('heading-six')}
            {this.renderBlockButton('list-item')}
            {this.renderBlockButton('quote')}
            {this.renderBlockButton('center-paragraph')}
            {this.renderBlockButton('indent-paragraph')}
            {this.renderBlockButton('preformatted-paragraph')}
          </ul>
        </div>
        <span style={{width: '10px'}}></span>
      </div>
    )
  }

  renderToolbar () {
    const selectedBlocks = this.props.value.blocks
    const headingType = selectedBlocks.first() ? selectedBlocks.first().type : this.DEFAULT_NODE
    const headingIcon = this.typeToIcon(headingType)[0]

    return (
      <div>
        <div className="btn-toolbar" role="toolbar" style={{paddingTop: '16px'}}>
          {this.props.type !== 'inline' ? this.renderBlockDropdown() : ''}
          <div className="btn-group" role="group">
            {this.renderMarkButton('bold')}
            {this.renderMarkButton('italic')}
            {this.renderMarkButton('underline')}
            {this.renderMarkButton('overline')}
            {this.renderMarkButton('superscript')}
            {this.renderMarkButton('subscript')}
            {this.renderMarkButton('big')}
            {this.renderMarkButton('small')}
            {this.renderMarkButton('code')}
            <ColorButton
              tooltip='Text Color'
              icon={mdiPalette}
              value={this.props.value}
              editor={this.editor}
              markType='color'
              markAttribute='color'
            />
          </div>
          <span style={{width: '10px'}}></span>
          <div className="btn-group" role="group">
            <LinkButton
              value={this.props.value}
              editor={this.editor}
              markType='link'
              markAttribute='href'
              title='Add Link'
              label='Link URL'
              tooltip='Link'
              icon={mdiLink}
              useTextAsDefault={false}
            />
            <LinkButton
              value={this.props.value}
              editor={this.editor}
              markType='mlink'
              markAttribute='name'
              title='Add M Link'
              label='Mathematican Name'
              tooltip='M Link'
              icon={mdiTooltipAccount}
              useTextAsDefault={true}
            />
            <LinkButton
              value={this.props.value}
              editor={this.editor}
              markType='wlink'
              markAttribute='name'
              title='Add W Link'
              label='Mathematican Name'
              tooltip='W Link'
              icon={mdiAccountArrowRight}
              useTextAsDefault={true}
            />
            <LinkButton
              value={this.props.value}
              editor={this.editor}
              markType='gllink'
              markAttribute='file'
              title='Add Glossary Link'
              label='Glossary Name'
              tooltip='Glossary Link'
              icon={mdiInformationOutline}
              useTextAsDefault={false}
            />
            <LinkButton
              value={this.props.value}
              editor={this.editor}
              markType='aclink'
              markAttribute='name'
              title='Add Society Link'
              label='Society Name'
              tooltip='Society Link'
              icon={mdiSchool}
              useTextAsDefault={false}
            />
          </div>
          <span style={{width: '10px'}}></span>
          <div className="btn-group">
            <button type="button" className="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <Icon path={mdiPlus} size={0.8} />
              <span className="caret"></span>
            </button>
            <ul className="dropdown-menu">
              {this.renderInlineButton('image', mdiImage)}
              {this.renderInlineButton('reference', mdiLinkVariant)}
              {this.renderInlineButton('translation', mdiTranslate)}
              {this.renderInlineButton('math', mdiMathSin)}
              {this.renderInlineButton('anchor', mdiAnchor)}
            </ul>
          </div>
        </div>
        <hr/>
      </div>
    )
  }

  /**
   * Render a inline-creation toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderInlineButton (type) {
    const isActive = this.hasInline(type)
    const iconTooltip = this.typeToIcon(type)
    const icon = iconTooltip[0]
    const tooltip = iconTooltip[1]

    return (
      <li>
        <a href="#" onClick={event => this.onClickInline(event, type)}>
          <Icon path={icon} size={0.8} color={isActive ? BUTTON_ACTIVE_COLOR : BUTTON_INACTIVE_COLOR} />
        </a>
      </li>
    )
  }

  /**
   * Render a mark-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderMarkButton (type) {
    const isActive = this.hasMark(type)
    const iconTooltip = this.typeToIcon(type)
    const icon = iconTooltip[0]
    const tooltip = iconTooltip[1]

    return (
      <button type="button" className={isActive ? 'btn btn-sm btn-success' : 'btn btn-sm btn-default'} onClick={event => this.onClickMark(event, type)}>
        <Icon path={icon} size={0.8} color={isActive ? BUTTON_ACTIVE_COLOR : BUTTON_INACTIVE_COLOR} />
      </button>
    )
  }

  /**
   * Render a block-toggling toolbar button.
   *
   * @param {String} type
   * @param {String} icon
   * @return {Element}
   */

  renderBlockButton (type) {
    let isActive = this.hasBlock(type)

    if (type === 'list') {
      const { value: { document, blocks } } = this.props

      if (blocks.size > 0) {
        const parent = document.getParent(blocks.first().key)
        isActive = this.hasBlock('list-item') && parent && parent.type === type
      }
    }

    const iconTooltip = this.typeToIcon(type)
    const icon = iconTooltip[0]
    const tooltip = iconTooltip[1]

    return (
      <li>
        <a href="#" onClick={event => this.onClickBlock(event, type)}>
          <Icon path={icon} size={0.8} color={isActive ? BUTTON_ACTIVE_COLOR : BUTTON_INACTIVE_COLOR} />
        </a>
      </li>
    )
  }

  /**
   * On change, save the new `value`.
   *
   * @param {Editor} editor
   */

  editorOnChange ({ operations, value }) {
    //this.setState({ value })

    if (this.props.onChange) {
      //const out = bbcode.serialize(value)
      this.props.onChange(value)
    }
  }

  /**
   * On key down, if it's a formatting command toggle a mark.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @return {Change}
   */

  onKeyDown (event, editor, next) {
    let mark

    if (isBoldHotkey(event)) {
      mark = 'bold'
    } else if (isItalicHotkey(event)) {
      mark = 'italic'
    } else if (isUnderlinedHotkey(event)) {
      mark = 'underline'
    } else if (isCodeHotkey(event)) {
      mark = 'code'
    } else {
      return next()
    }

    event.preventDefault()
    editor.toggleMark(mark)
  }

  /**
   * When an inline button is clicked, add an inline at the current selection.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickInline (event, type) {
    event.preventDefault()

    let title, attribute, label, value
    value = ''
    switch (type) {
      case 'image':
        title = 'Edit Image'
        attribute = 'src'
        label = 'Image SRC'
        break
      case 'reference':
        title = 'Edit Reference'
        attribute = 'num'
        label = 'Reference Number'
        value = '1'
        break
      case 'translation':
        title = 'Edit Translation'
        attribute = 'num'
        label = 'Translation Text'
        break
      case 'math':
        title = 'Edit Formula'
        attribute = 'math'
        label = 'KaTeX Formula'
        break
      case 'anchor':
        title = 'Edit Anchor'
        attribute = 'anchor'
        label = 'Anchor Name'
        break
    }

    dialogSystem.showDialog(EditorPopup, {
      value: value,
      removeBtn: 'Cancel',
      addBtn: 'Add',
      update: value => {
        this.editor.insertInline({
          type: type,
          data: {
            [attribute]: value
          }
        }).focus()
      },
      remove: () => {},
      inner: InlineDialogContents,
      title: title,
      label: label,
      math: type === 'math'
    })
  }

  /**
   * When a mark button is clicked, toggle the current mark.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickMark (event, type) {
    event.preventDefault()
    this.editor.toggleMark(type)
  }

  /**
   * When a block button is clicked, toggle the block type.
   *
   * @param {Event} event
   * @param {String} type
   */

  onClickBlock (event, type) {
    event.preventDefault()

    const { editor } = this
    const { value } = editor
    const { document } = value

    // Handle everything but list buttons.
    if (type !== 'list') {
      const isActive = this.hasBlock(type)
      const isList = this.hasBlock('list-item')

      if (isList) {
        editor
          .setBlocks(isActive ? this.DEFAULT_NODE : type)
          //.unwrapBlock('bulleted-list')
          //.unwrapBlock('numbered-list')
      } else {
        editor.setBlocks(isActive ? this.DEFAULT_NODE : type)
      }
    } else {
      // Handle the extra wrapping required for list buttons.
      const isList = this.hasBlock('list-item')
      const isType = value.blocks.some(block => {
        return !!document.getClosest(block.key, parent => parent.type === type)
      })

      if (isList && isType) {
        editor
          .setBlocks(this.DEFAULT_NODE)
          .unwrapBlock('list')
      } else if (isList) {
        editor
          .unwrapBlock(
            type === 'bulleted-list' ? 'numbered-list' : 'bulleted-list'
          )
          .wrapBlock(type)
      } else {
        editor.setBlocks('list-item').wrapBlock(type)
      }
    }
  }
}

class ColorButton extends React.Component {
  constructor(props) {
    super(props)

    this.show = this.show.bind(this)
    this.update = this.update.bind(this)
    this.remove = this.remove.bind(this)
    this.initialValue = this.initialValue.bind(this)
    this.hasMark = this.hasMark.bind(this)
  }

  show () {
    dialogSystem.showDialog(EditorPopup, {
      value: this.initialValue(),
      removeBtn: 'Remove',
      addBtn: this.hasMark ? 'Update' : 'Add',
      update: this.update,
      remove: this.remove,
      inner: ColorDialogContents,
      title: 'Text Color'
    })
  }

  remove () {
    const value = this.props.value
    const selection = value.selection
    const editor = this.props.editor

    const isExpanded = selection.isExpanded
    if (!isExpanded) return

    const marks = value.marks.filter(mark => mark.type === this.props.markType)
    marks.map(mark => editor.removeMark(mark))
  }

  update (val) {
    const value = this.props.value
    const selection = value.selection
    const editor = this.props.editor

    this.remove()

    if (val !== '#000000') {
      editor.addMark({
        type: this.props.markType,
        data: {
          [this.props.markAttribute]: val
        }
      })
    }
  }

  hasMark () {
    const value = this.props.value
    const hasMark = value.marks.some(mark => mark.type === this.props.markType)
    return hasMark
  }

  initialValue () {
    const value = this.props.value

    const hasMark = this.hasMark()
    if (!hasMark) return '#000000'

    const marks = value.marks.filter(mark => mark.type === this.props.markType)
    return marks.first().data.get(this.props.markAttribute)
  }

  render() {
    return (
      <button type="button" className={this.hasMark() ? 'btn btn-sm btn-success' : 'btn btn-sm btn-default'} onClick={this.show}>
        <Icon path={this.props.icon} size={0.8} color={this.initialValue() === '#000000' ? BUTTON_INACTIVE_COLOR : this.initialValue()} />
      </button>
    )
  }
}


class EditorPopup extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      value: this.props.value
    }

    this.onChange = this.onChange.bind(this)
    this.update = this.update.bind(this)
    this.remove = this.remove.bind(this)
  }

  onChange (val) {
    this.setState({
      value: val
    })
  }

  update (e) {
    this.props.update(this.state.value)
    dialogSystem.dismissDialog()
  }

  remove () {
    this.props.remove(this.state.value)
    dialogSystem.dismissDialog()
  }

  render () {
    return (
      <SlideDialog hasCloseButton closeOnEscape title={this.props.title}>
        <div>
          <this.props.inner {...this.props} onChange={this.onChange} value={this.state.value} />
        </div>
        <div>
          { this.props.removeBtn ? <button type="button" className="btn btn-danger" onClick={this.remove}>{this.props.removeBtn}</button> : ''}
          { this.props.addBtn ? <button type="button" className="btn btn-success" onClick={this.update}>{this.props.addBtn}</button> : ''}
        </div>
      </SlideDialog>
    )
  }
}


class ColorDialogContents extends React.Component {
  render () {
    return (
      <div>
        <div style={{width: '100%', height: '24px', borderRadius: '4px', backgroundColor: this.props.value, textAlign: 'center', marginBottom: '10px'}}>{this.props.value}</div>
        <TwitterPicker
          className='modal-twitter-picker'
          onChangeComplete={color => {this.props.onChange(color.hex)}}
          colors={['#000000', '#0433FF', '#AA7942', '#00FDFF', '#00F900', '#FF40FF', '#FF9300', '#942192', '#FF2600', '#FFFB00']}
          style={{marginLeft: 'auto', marginRight: 'auto'}}
        />
      </div>
    )
  }
}

class LinkDialogContents extends React.Component {
  render () {
    return (
      <p>
        <label>
          {this.props.label}:
          <input type='text' placeholder={this.props.placeholder} value={this.props.value} onChange={event => {this.props.onChange(event.target.value)}} />
        </label>
      </p>
    )
  }
}


class InlineDialogContents extends React.Component {
  render () {
    return (
      <div>
        {
          this.props.math ?
          <p>
            Preview:
            <span className="math" dangerouslySetInnerHTML={{__html: katex.renderToString(this.props.value, {throwOnError: false})}}></span>
          </p>
          : ''
        }
        <p>
          <label>
            {this.props.label}:
            <input type={this.props.inputType} value={this.props.value} onChange={event => {this.props.onChange(event.target.value)}} />
          </label>
        </p>
      </div>
    )
  }
}


class LinkButton extends React.Component {
  constructor(props) {
    super(props)

    this.show = this.show.bind(this)
    this.update = this.update.bind(this)
    this.remove = this.remove.bind(this)
    this.initialValue = this.initialValue.bind(this)
    this.hasMark = this.hasMark.bind(this)
    this.getSelectionText = this.getSelectionText.bind(this)
  }

  show () {
    dialogSystem.showDialog(EditorPopup, {
      value: this.initialValue(),
      removeBtn: 'Remove',
      addBtn: this.hasMark() ? 'Update' : 'Add',
      update: this.update,
      remove: this.remove,
      placeholder: this.props.useTextAsDefault ? this.getSelectionText() : '',
      label: this.props.label,
      inner: LinkDialogContents,
      title: this.props.title
    })
  }

  remove () {
    const value = this.props.value
    const selection = value.selection
    const editor = this.props.editor

    const isExpanded = selection.isExpanded
    if (!isExpanded) return

    const marks = value.marks.filter(mark => mark.type === this.props.markType)
    marks.map(mark => editor.removeMark(mark))
  }

  update (val) {
    const value = this.props.value
    const selection = value.selection
    const editor = this.props.editor

    this.remove()

    if (val !== '') {
      editor.addMark({
        type: this.props.markType,
        data: {
          [this.props.markAttribute]: val
        }
      })
    } else if (this.props.useTextAsDefault) {
      editor.addMark({
        type: this.props.markType,
        data: {}
      })
    }
  }

  hasMark () {
    const value = this.props.value
    const hasMark = value.marks.some(mark => mark.type === this.props.markType)
    return hasMark
  }

  initialValue () {
    const value = this.props.value

    const hasMark = this.hasMark()
    if (!hasMark) return ''

    const marks = value.marks.filter(mark => mark.type === this.props.markType)
    return marks.first().data.get(this.props.markAttribute)
  }

  getSelectionText () {
    const value = this.props.value
    return value.fragment.text
  }

  render() {
    return (
      <button type="button" className={this.hasMark() ? 'btn btn-sm btn-success' : 'btn btn-sm btn-default'} onClick={this.show}>
        <Icon path={this.props.icon} size={0.8} color={this.hasMark() ? BUTTON_ACTIVE_COLOR : BUTTON_INACTIVE_COLOR} />
      </button>
    )
  }
}

BBCodeEditor.deserializeValue = value => {
  if (value.trim() === '') {
    value = '[p][/p]'
  }
  let deserialized = bbcode.deserialize(value, { type: 'block' })
  return Value.fromJSON(deserialized, { normalize: true })
}
BBCodeEditor.serializeValue = value => {
  const serialized = bbcode.serialize(value)
  return serialized
}

// mini class to create the two different editors
class BBCodeInlineEditor extends React.Component {
  render () {
    return (
      <BBCodeEditor {...this.props} type='inline' />
    )
  }
}

BBCodeInlineEditor.deserializeValue = value => {
  let deserialized = bbcode.deserialize(value, { type: 'inline' })
  deserialized.document.nodes = [
    {
      data: {},
      nodes: deserialized.document.nodes,
      object: 'block',
      type: 'inlineblock'
    }
  ]
  return Value.fromJSON(deserialized, { normalize: true })
}
BBCodeInlineEditor.serializeValue = BBCodeEditor.serializeValue

/**
 * Export.
 */

export {
  BBCodeEditor,
  BBCodeInlineEditor
}

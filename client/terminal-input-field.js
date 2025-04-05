import termkit from 'terminal-kit';
import { EventEmitter } from 'events';

const term = termkit.terminal;

export default class TerminalInputField extends EventEmitter {
  constructor(options = {}) {
    super();
    this.term = term;
    this.options = {
      x: options.x || 1,
      y: options.y || 5,
      width: options.width || 10,
      defaultContent: options.defaultContent || '',
      backendNodeId: options.backendNodeId, // For syncing with remote page
    };

    // State
    this.content = this.options.defaultContent;
    this.cursorPosition = this.content.length;
    this.isFocused = false;
    this.isVisible = true;

    // Initial render
    this.render();
  }

  render() {
    if (!this.isVisible) return;
    this.term.moveTo(this.options.x, this.options.y);
    this.term.bgWhite().black(' '.repeat(this.options.width)); // White background
    this.term.moveTo(this.options.x, this.options.y);

    if (this.isFocused) {
      const beforeCursor = this.content.slice(0, this.cursorPosition);
      const cursorChar = this.content[this.cursorPosition] || ' ';
      const afterCursor = this.content.slice(this.cursorPosition + 1);
      this.term.bgWhite().black(beforeCursor);
      this.term.bgBlack().brightWhite().bold(cursorChar);
      this.term.bgWhite().black(afterCursor.padEnd(this.options.width - beforeCursor.length - 1, ' '));
    } else {
      this.term.bgWhite().black(this.content.padEnd(this.options.width, ' '));
    }
  }

  handleKey(key) {
    if (!this.isFocused) return false;

    switch (key) {
      case 'ENTER':
        this.emit('submit', this.content);
        this.blur();
        return true;
      case 'ESCAPE':
        this.emit('cancel');
        this.hide();
        return true;
      case 'LEFT':
        if (this.cursorPosition > 0) this.cursorPosition--;
        this.render();
        return true;
      case 'RIGHT':
        if (this.cursorPosition < this.content.length) this.cursorPosition++;
        this.render();
        return true;
      case 'BACKSPACE':
        if (this.cursorPosition > 0) {
          this.content = this.content.slice(0, this.cursorPosition - 1) + this.content.slice(this.cursorPosition);
          this.cursorPosition--;
          this.render();
        }
        return true;
      case 'DELETE':
        if (this.cursorPosition < this.content.length) {
          this.content = this.content.slice(0, this.cursorPosition) + this.content.slice(this.cursorPosition + 1);
          this.render();
        }
        return true;
      default:
        if (key.length === 1) {
          this.content = this.content.slice(0, this.cursorPosition) + key + this.content.slice(this.cursorPosition);
          this.cursorPosition++;
          this.render();
          return true;
        }
        return false;
    }
  }

  focus() {
    this.isFocused = true;
    this.render();
  }

  blur() {
    this.isFocused = false;
    this.render();
  }

  show() {
    this.isVisible = true;
    this.render();
  }

  hide() {
    this.isVisible = false;
    this.term.moveTo(this.options.x, this.options.y);
    this.term.bgDefaultColor().defaultColor(' '.repeat(this.options.width));
  }

  getPosition() {
    return { x: this.options.x, y: this.options.y };
  }

  rebase(x, y) {
    this.options.x = x;
    this.options.y = y;
    this.render();
  }

  getContent() {
    return this.content;
  }
}

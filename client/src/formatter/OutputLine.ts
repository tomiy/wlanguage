import Output from "./Output";

export default class OutputLine {
    _parent: Output;
    _characterCount: number;
    _indentCount: number;
    _items: string[];

    constructor(parent: Output) {
        this._parent = parent;
        this._characterCount = 0;
        this._indentCount = -1;

        this._items = [];
    }

    cloneEmpty() {
        let line = new OutputLine(this._parent);
        line.setIndent(this._indentCount);

        return line;
    }

    setIndent(indent: number = 0) {
        if(this.isEmpty()) {
            this._indentCount = indent;
            this._characterCount = this._parent._indentCache.getIndentSize(this._indentCount);
        }
    }

    removeIndent() {
        if(this._indentCount > 0) {
            this._indentCount--;
            this._characterCount -= this._parent._indentCache._indentSize;
        }
    }

    push(item: string) {
        this._items.push(item);
        let lastNewLineIndex = item.lastIndexOf('\n');
        if(lastNewLineIndex !== -1) {
            this._characterCount = item.length - lastNewLineIndex;
        } else {
            this._characterCount += item.length;
        }
    }

    pop() {
        let item: string;
        if(!this.isEmpty()) {
            item = this._items.pop();
            this._characterCount -= item.length;
        }

        return item;
    }

    trim() {
        while(this.last() === ' ') {
            this._items.pop();
            this._characterCount--;
        }
    }

    last() {
        if(!this.isEmpty()) {
            return this._items[this._items.length - 1];
        }

        return null;
    }

    isEmpty() {
        return this._items.length === 0;
    }

    toString() {
        let result: string = '';

        if(!this.isEmpty()) {
            result = this._parent._indentCache.getIndentString(this._indentCount);
            result += this._items.join('');
        }

        return result;
    }
}
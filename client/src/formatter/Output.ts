import IndentStringCache from "./IndentStringCache";
import OutputLine from "./OutputLine";

export default class Output {
    _indentCache: IndentStringCache;
    _lines: OutputLine[];
    _previousLine: OutputLine;
    _currentLine: OutputLine;
    _nextLine: OutputLine;
    _spaceBeforeToken: boolean;

    constructor() {
        this._indentCache = new IndentStringCache();
        this._lines = [];
        this._nextLine = new OutputLine(this);
        this._spaceBeforeToken = false;

        this.addOutputLine();
    }

    addOutputLine() {
        this._previousLine = this._currentLine;
        this._currentLine = this._nextLine.cloneEmpty();
        this._lines.push(this._currentLine);
    }

    addToken(printableToken: string) {
        this.addSpaceBeforeToken();
        this._currentLine.push(printableToken);
        this._spaceBeforeToken = false;
    }

    addSpaceBeforeToken() {
        if(this._spaceBeforeToken && !this.justAddedNewLine()) {
            this._currentLine.push(' ');
        }
    }

    getCode() {
        this.trim(true);

        let lastItem = this._currentLine.pop();
        if(lastItem) {
            if(lastItem[lastItem.length - 1] === '\n') {
                lastItem = lastItem.replace(/\n+$/g, '');
            }

            this._currentLine.push(lastItem);
        }

        let formattedText = this._lines.join('\r\n');

        return formattedText;
    }

    trim(eatNewLines: boolean = false) {
        this._currentLine.trim();

        while(eatNewLines && this._lines.length > 1 && this._currentLine.isEmpty()) {
            this._lines.pop();
            this._currentLine = this._lines[this._lines.length - 1];
            this._currentLine.trim();
        }
    }

    isEmpty() {
        return !this._previousLine && this._currentLine.isEmpty();
    }

    justAddedNewLine() {
        return this._currentLine.isEmpty();
    }

    justAddedBlankLine() {
        return this.isEmpty() || (this._currentLine.isEmpty() && this._previousLine.isEmpty());
    }

    addNewLine(force: boolean) {
        if(this.isEmpty() || (!force && this.justAddedNewLine())) {
            return false;
        }

        this.addOutputLine();
        return true;
    }

    setIndent(indent: number = 0) {
        this._nextLine.setIndent(indent);

        if(this._lines.length > 1) {
            this._currentLine.setIndent(indent);
            return true;
        }

        this._currentLine.setIndent();
        return false;
    }

    getLineNumber() {
        return this._lines.length;
    }

    removeIndent(index: number) {
        let outputLength = this._lines.length;
        while(index < outputLength) {
            this._lines[index].removeIndent();
            index++;
        }
    }
}
export default class IndentStringCache {
    _cache: String[];
    _indentSize: number;
    _indentChar: string;
    _indentString: string;

    constructor() {
        this._cache = [''];
        this._indentSize = 4;
        this._indentChar = ' ';
        this._indentString = new Array(this._indentSize + 1).join(this._indentChar);
    }

    getIndentSize(indent: number, column: number = 0) {
        let result: number = 0;

        if(indent < 0) {
            indent = 0;
        }
        result += indent * this._indentSize;
        result += column;

        return result;
    }

    getIndentString(indent: number, column: number = 0) {
        let result: string = '';

        if(indent < 0) {
            indent = 0;
        }

        column += indent * this._indentSize;
        this.ensureCache(column);
        result += this._cache[column];

        return result;
    }

    ensureCache(column: number) {
        while(column >= this._cache.length) {
            this.addColumn();
        }
    }

    addColumn() {
        let column = this._cache.length;
        let indent = 0;
        let result = '';

        if(this._indentSize && column >= this._indentSize) {
            indent = Math.floor(column / this._indentSize);
            column -= indent * this._indentSize;
            result = new Array(indent + 1).join(this._indentString);
        }

        if(column) {
            result += new Array(column + 1).join(' ');
        }

        this._cache.push(result);
    }
}
import TokenStream from "./TokenStream";

export default class Token {
    type: string;
    text: string;
    _newlines: number;
    _whitespaceBefore: string;
    _commentsBefore: TokenStream;
    _parent: Token;
    _previous: Token;
    _next: Token;
    _opened: Token;
    _closed: Token;

    constructor(type: string, text: string, newlines: number = 0, whitespaceBefore: string = '') {
        this.type = type;
        this.text = text;
        this._newlines = newlines;
        this._whitespaceBefore = whitespaceBefore;
    }
}
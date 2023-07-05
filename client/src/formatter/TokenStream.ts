import Token from "./Token";

export default class TokenStream {
    _tokens: Token[];
    _position: number;
    _parentToken: Token;

    constructor(parentToken: Token = null) {
        this._tokens = [];
        this._position = 0;
        this._parentToken = parentToken;
    }

    restart() {
        this._position = 0;
    }

    isEmpty() {
        return this._tokens.length === 0;
    }

    hasNext() {
        return this._position < this._tokens.length;
    }

    next() {
        let val: Token;

        if(this.hasNext()) {
            val = this._tokens[this._position];
            this._position += 1;
        }

        return val;
    }

    peek(index: number = 0) {
        let val: Token;

        index += this._position;
        if(index >= 0 && index < this._tokens.length) {
            val = this._tokens[index];
        }

        return val;
    }

    add(token: Token) {
        if(this._parentToken) {
            token._parent = this._parentToken;
        }
        this._tokens.push(token);
    }
}
import InputScanner from "./InputScanner";
import Pattern from "./Pattern";
import Token from "./Token";
import TokenStream from "./TokenStream";
import WhitespacePattern from "./WhitespacePattern";
import { PATTERN, TOKEN } from "./constants";

export default class BaseTokenizer {
    _input: InputScanner;
    _tokens: TokenStream;
    _patterns: Map<string, Pattern>;

    constructor(inputString: string) {
        this._input = new InputScanner(inputString);

        this._patterns = new Map();
        this._patterns.set(PATTERN.WHITESPACE, new WhitespacePattern(this._input));
    }

    tokenize() {
        this._input.restart();
        this._tokens = new TokenStream();

        let current: Token;
        let previous: Token = new Token(TOKEN.START, '');
        let openToken: Token;
        let openStack: Token[] = [];
        let comments = new TokenStream();

        while(previous.type !== TOKEN.EOF) {
            current = this.getNextToken(previous, openToken);

            while(this.isComment(current)) {
                comments.add(current);
                current = this.getNextToken(previous, openToken);
            }

            if(!comments.isEmpty()) {
                current._commentsBefore = comments;
                comments = new TokenStream();
            }

            current._parent = openToken;

            if(this.isOpening(current)) {
                openStack.push(openToken);
                openToken = current;
            } else if(openToken && this.isClosing(current, openToken)) {
                current._opened = openToken;
                openToken._closed = current;
                openToken = openStack.pop();
                current._parent = openToken;
            }

            current._previous = previous;
            previous._next = current;

            this._tokens.add(current);

            previous = current;
        }

        return this._tokens;
    }

    getNextToken(previousToken: Token, openToken: Token) {
        this.readWhitespace();

        let resultingString: string = this._input.read(/.+/g);
        if(resultingString) {
            return this.createToken(TOKEN.RAW, resultingString);
        } else {
            return this.createToken(TOKEN.EOF, '');
        }
    }

    isComment(currentToken: Token) {
        return false;
    }

    isOpening(currentToken: Token) {
        return false;
    }

    isClosing(currentToken: Token, openToken: Token) {
        return false;
    }

    createToken(type: string, text: string) {
        let whiteSpacePattern: WhitespacePattern = this._patterns.get(PATTERN.WHITESPACE) as WhitespacePattern;
        let token: Token = new Token(type, text, whiteSpacePattern._newlineCount, whiteSpacePattern._whitespaceBeforeToken);

        return token;
    }

    readWhitespace() {
        this._patterns.get(PATTERN.WHITESPACE).read();
    }
}
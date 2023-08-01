import Token from "./Token";
import BaseTokenizer from "./BaseTokenizer";
import Pattern from "./Pattern";
import { PATTERN, REGEXP, TOKEN } from "./constants";

export default class Tokenizer extends BaseTokenizer {
    constructor(inputString: string) {
        super(inputString);

        let patternReader: Pattern = new Pattern(this._input);

        this._patterns.set(PATTERN.IDENTIFIER, patternReader.startingWith(REGEXP.IDENTIFIER).matching(REGEXP.IDENTIFIER_MATCH));
        this._patterns.set(PATTERN.NUMBER, patternReader.matching(REGEXP.NUMBER));
        this._patterns.set(PATTERN.PUNCT, patternReader.matching(REGEXP.PUNCT));
        this._patterns.set(PATTERN.COMMENT, patternReader.startingWith(/\/\//).until(/[\n\r]/));
        this._patterns.set(PATTERN.BLOCK_COMMENT, patternReader.startingWith(/\/\*/).untilAfter(/\*\//));
        this._patterns.set(PATTERN.SINGLE_QUOTE, patternReader.until(/['\\\n\r]/));
        this._patterns.set(PATTERN.DOUBLE_QUOTE, patternReader.until(/["\\\n\r]/));
    }

    isComment(currentToken: Token): boolean {
        return currentToken.type === TOKEN.COMMENT || currentToken.type === TOKEN.BLOCK_COMMENT || currentToken.type === TOKEN.UNKNOWN;
    }

    isOpening(currentToken: Token): boolean {
        return currentToken.type === TOKEN.START_EXPR;
    }

    isClosing(currentToken: Token, openToken: Token): boolean {
        return currentToken.type === TOKEN.END_EXPR;
    }

    getNextToken(previousToken: Token, openToken: Token): Token {
        let token: Token;
        this.readWhitespace();
        let c = this._input.peek();

        if(c === null) {
            return this.createToken(TOKEN.EOF, '');
        }

        token = token || this.readString(c);
        token = token || this.readWord(previousToken);
        token = token || this.readSingles(c);
        token = token || this.readComment(c);
        token = token || this.readPunctuation();
        token = token || this.createToken(TOKEN.UNKNOWN, this._input.next());

        return token;
    }

    readWord(previousToken: Token) {
        let resultingString: string;

        resultingString = this._patterns.get(PATTERN.IDENTIFIER).read();
        if(resultingString !== '') {
            resultingString = resultingString.replace(REGEXP.ALL_LINE_BREAKS, '\n');

            if(REGEXP.RESERVED.test(resultingString)) {
                return this.createToken(TOKEN.RESERVED, resultingString);
            }

            return this.createToken(TOKEN.WORD, resultingString);
        }

        resultingString = this._patterns.get(PATTERN.NUMBER).read();
        if(resultingString !== '') {
            return this.createToken(TOKEN.WORD, resultingString);
        }
    }

    readSingles(c: string) {
        let token: Token;
        if(c === '(' || c === '[' || c === '{') {
            token = this.createToken(TOKEN.START_EXPR, c);
        } else if(c === ')' || c === ']' || c === '}') {
            token = this.createToken(TOKEN.END_EXPR, c);
        } else if(c === '.' && REGEXP.DOT.test(this._input.peek(1))) {
            token = this.createToken(TOKEN.DOT, c);
        } else if(c === ',') {
            token = this.createToken(TOKEN.COMMA, c);
        }

        if(token) {
            this._input.next();
        }

        return token;
    }

    readPunctuation() {
        let resultingString: string = this._patterns.get(PATTERN.PUNCT).read();

        if(resultingString !== '') {
            if(resultingString === '=') {
                return this.createToken(TOKEN.EQUALS, resultingString);
            } else if(resultingString === '?.') {
                return this.createToken(TOKEN.DOT, resultingString);
            } else {
                return this.createToken(TOKEN.OPERATOR, resultingString);
            }
        }
    }

    readComment(c: string) {
        let token: Token;
        if(c === '/') {
            let comment: string = '';
            if(this._input.peek(1) === '*') {
                comment = this._patterns.get(PATTERN.BLOCK_COMMENT).read();
                comment = comment.replace(REGEXP.ALL_LINE_BREAKS, '\n');
                token = this.createToken(TOKEN.BLOCK_COMMENT, comment);
            } else if(this._input.peek(1) === '/') {
                comment = this._patterns.get(PATTERN.COMMENT).read();
                token = this.createToken(TOKEN.COMMENT, comment);
            }
        }

        return token;
    }

    readString(c: string) {
        if(c === '"' || c === '\'') {
            let resultingString: string = this._input.next();

            resultingString += this.readStringRecursive(c);

            if(this._input.peek() === c) {
                resultingString += this._input.next();
            }

            resultingString = resultingString.replace(REGEXP.ALL_LINE_BREAKS, '\n');

            return this.createToken(TOKEN.STRING, resultingString);
        }

        return null;
    }

    readStringRecursive(delimiter: string) {
        let currentChar: string;
        let pattern: Pattern;

        if(delimiter === '\'') {
            pattern = this._patterns.get(PATTERN.SINGLE_QUOTE);
        } else if(delimiter === '"') {
            pattern = this._patterns.get(PATTERN.DOUBLE_QUOTE);
        }

        let resultingString: string = pattern.read();
        let next: string = '';

        while(this._input.hasNext()) {
            next = this._input.next();

            if(next === delimiter) {
                this._input.back();
                break;
            }

            next += pattern.read();
            resultingString += next;
        }

        return resultingString;
    }
}
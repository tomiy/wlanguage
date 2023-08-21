import FormatterFlags from "./FormatterFlags";
import Output from "./Output";
import Token from "./Token";
import TokenStream from "./TokenStream";
import Tokenizer from "./Tokenizer";
import { REGEXP, TOKEN } from "./constants";

export default class Formatter {
    _sourceText: string;
    _output: Output;
    _tokens: TokenStream;
    _flags: FormatterFlags;

    _conditionalDepth: number;

    _variableDeclarationBlock: boolean;

    _caseBlock: boolean;
    _caseBody: boolean;
    _simpleCaseDeclaration: boolean;
    _caseDepth: number;

    _textBlockToken: Token;

    constructor(sourceText: string = '') {
        this._sourceText = sourceText;

        this._flags = new FormatterFlags();
        this._flags._indentLevel = 0;

        this._conditionalDepth = 0;
    }

    reset() {
        this._output = new Output();

        let tokenizer = new Tokenizer(this._sourceText);
        this._tokens = tokenizer.tokenize();
    }

    formatText() {
        let formattedText: string;
        this.reset();

        let currentToken = this._tokens.next();
        while(currentToken) {
            this.handleToken(currentToken);

            currentToken = this._tokens.next();
        }

        formattedText = this._output.getCode();

        return formattedText;
    }

    handleToken(currentToken: Token) {
        if(currentToken.type === TOKEN.START_EXPR) {
            this.handleStartExpr(currentToken);
        } else if(currentToken.type === TOKEN.END_EXPR) {
            this.handleEndExpr(currentToken);
        } else if(currentToken.type === TOKEN.RESERVED) {
            this.handleWord(currentToken);
        } else if(currentToken.type === TOKEN.WORD) {
            this.handleWord(currentToken);
        } else if(currentToken.type === TOKEN.STRING) {
            this.handleString(currentToken);
        } else if(currentToken.type === TOKEN.COMMA) {
            this.handleComma(currentToken);
        } else if(currentToken.type === TOKEN.EQUALS) {
            this.handleEquals(currentToken);
        } else if(currentToken.type === TOKEN.OPERATOR) {
            this.handleOperator(currentToken);
        } else if(currentToken.type === TOKEN.DOT) {
            this.handleDot(currentToken);
        } else if(currentToken.type === TOKEN.EOF) {
            this.handleEOF(currentToken);
        } else if(currentToken.type === TOKEN.BLOCK_COMMENT) {
            this.handleBlockComment(currentToken);
        } else if(currentToken.type === TOKEN.COMMENT) {
            this.handleComment(currentToken);
        }
    }

    pushFlags() {
        this._flags = this._flags.clone();
    }

    popFlags() {
        if(this._flags._parent) {
            this._flags = this._flags._parent;
        }
    }

    indent() {
        this._flags._indentLevel++;
        this._output.setIndent(this._flags._indentLevel);
    }

    deindent() {
        if(this._flags._indentLevel > 0 && (!this._flags._parent || this._flags._indentLevel > this._flags._parent._indentLevel)) {
            this._flags._indentLevel--;
            this._output.setIndent(this._flags._indentLevel);
        }
    }

    removeRedundantIndentation() {
        if(this._flags._indentLevel === this._output._currentLine._indentCount) {
            this._output.removeIndent(this._output.getLineNumber() - 1);
        }
    }

    reservedWord(token: Token, word: string) {
        return token && token.type === TOKEN.RESERVED && token.text.toUpperCase() === word.toUpperCase();
    }

    reservedArray(token: Token, words: string[]) {
        return token && token.type === TOKEN.RESERVED && words.map(w => w.toUpperCase()).includes(token.text.toUpperCase());
    }

    printNewLine(force: boolean = false) {
        this._output.addNewLine(force);
    }

    handleWhitespaceAndComments(currentToken: Token) {
        let newlines = currentToken._newlines;

        if(currentToken._commentsBefore) {
            let commentToken = currentToken._commentsBefore.next();
            while(commentToken) {
                this.handleWhitespaceAndComments(commentToken);
                this.handleToken(commentToken);
                commentToken = currentToken._commentsBefore.next();
            }
        }

        for(let i = 0; i < newlines; i++) {
            this.printNewLine(i > 0);
        }
    }

    handleStartExpr(currentToken: Token) {
        if(currentToken._previous.type === TOKEN.RESERVED && !currentToken._newlines) {
            this._output._spaceBeforeToken = true;
        }

        if(currentToken.text === '[' && currentToken._next._newlines > 0) {
            this._textBlockToken = currentToken;
        }

        this.handleWhitespaceAndComments(currentToken);
        this.printToken(currentToken);

        this.indent();
    }

    handleEndExpr(currentToken: Token) {
        if(this._textBlockToken === currentToken._opened) {
            this._textBlockToken = null;
        }

        this.handleWhitespaceAndComments(currentToken);
        this.removeRedundantIndentation();
        this.deindent();
        this.printToken(currentToken);
    }

    handleString(currentToken: Token) {
        this.handleWhitespaceAndComments(currentToken);

        if([TOKEN.RESERVED, TOKEN.WORD].includes(currentToken._previous.type)) {
            this._output._spaceBeforeToken = true;
        } else if(![TOKEN.COMMA, TOKEN.START_EXPR, TOKEN.EQUALS, TOKEN.OPERATOR].includes(currentToken._previous.type)) {
            this.printNewLine();
        }

        this.printToken(currentToken);
    }

    handleOperator(currentToken: Token) {
        this.handleWhitespaceAndComments(currentToken);

        let spaceBefore = true;
        let spaceAfter = true;

        if(currentToken.text === '*' && currentToken._next.text === ',') {
            spaceAfter = false;
        }

        if((['-', '+'].includes(currentToken.text) && (
            [TOKEN.START_EXPR, TOKEN.EQUALS, TOKEN.OPERATOR].includes(currentToken._previous.type) ||
            currentToken._previous.text === ',' || currentToken._previous.type === TOKEN.RESERVED
        ))) {
            spaceAfter = false;
        }

        if(currentToken._previous.type === TOKEN.START_EXPR) {
            spaceBefore = false;
        }

        if(['--', '++'].includes(currentToken.text) || (currentToken.text === ':' && !this._simpleCaseDeclaration)) {
            spaceBefore = false;
            spaceAfter = false;
        }

        if(currentToken.text === ':' && this._simpleCaseDeclaration) {
            this._simpleCaseDeclaration = false;
        }

        if(currentToken._previous.type === TOKEN.RESERVED) {
            spaceBefore = true;
        } else if(currentToken._previous.type === TOKEN.END_EXPR) {
            spaceBefore = !(currentToken._previous.text === ']' && (currentToken.text === '--' || currentToken.text === '++'));
        } else if(currentToken._previous.type === TOKEN.OPERATOR) {
            spaceBefore = ['--', '-', '++', '+'].includes(currentToken.text) && ['--', '-', '++', '+'].includes(currentToken._previous.text);

            if(['+', '-'].includes(currentToken.text) && ['--', '++'].includes(currentToken._previous.text)) {
                spaceAfter = true;
            }
        }

        this._output._spaceBeforeToken = spaceBefore;
        this.printToken(currentToken);
        this._output._spaceBeforeToken = spaceAfter;
    }

    handleEquals(currentToken: Token) {
        this.handleWhitespaceAndComments(currentToken);

        this._output._spaceBeforeToken = true;
        this.printToken(currentToken);
        this._output._spaceBeforeToken = true;
    }

    handleComma(currentToken: Token) {
        this.handleWhitespaceAndComments(currentToken);

        this.printToken(currentToken);
        this._output._spaceBeforeToken = true;
    }

    handleWord(currentToken: Token) {
        if(currentToken._newlines && (currentToken._previous.type !== TOKEN.OPERATOR || (currentToken._previous.text === '--' || currentToken._previous.text === '++'))) {
            this.handleWhitespaceAndComments(currentToken);
            this.printNewLine();
        } else {
            this.handleWhitespaceAndComments(currentToken);
        }

        if(currentToken._previous && ![TOKEN.START_EXPR, TOKEN.DOT, TOKEN.OPERATOR].includes(currentToken._previous.type)) {
            this._output._spaceBeforeToken = true;
        }

        // variable declaration blocks end when there are 2 newlines
        if(this._variableDeclarationBlock && this._output.justAddedBlankLine()) {
            this.popFlags();
            this.deindent();

            this._variableDeclarationBlock = false;
        }

        if(this.reservedWord(currentToken, 'FIN')) {
            this.popFlags();
            this.deindent();

            this._conditionalDepth--;

            // for case blocks, we deindent one more time since case blocks don't have obvious end statements
            //
            // SELON x
            //     CAS 1
            //         some code
            //
            //     CAS 2
            //         SI y ALORS
            //             some code
            //         FIN
            // FIN --> deindent twice
            if(this._caseBlock && this._caseDepth === this._conditionalDepth - 1) {
                this.popFlags();
                this.deindent();

                this._conditionalDepth--;
                this._caseBody = false;
                this._caseBlock = false;
            }
        }

        // temporarily deindent for else statement so the keyword is at the correct indentation level
        // if the statement is inline do nothing
        //
        // SI x ALORS
        //     some code
        // SINON --> deindent
        //     some code
        // FIN
        //
        // SI x ALORS some code SINON some code --> do nothing
        if(this.reservedWord(currentToken, 'SINON') && (currentToken._next._newlines > 0 || this.reservedWord(currentToken._next, 'SI'))) {
            this.popFlags();
            this.deindent();

            this._conditionalDepth--;
        }

        // check for complex case body
        //
        // SELON x
        //     CAS 1 : some code --> simple case body (inline statement with semicolon)
        //     CAS 2
        //         some code --> complex case body
        // FIN
        if(this.reservedWord(currentToken, 'CAS')) {
            let nextToken = currentToken._next;
            while(!nextToken._newlines) {
                if(nextToken.text === ':') {
                    this._simpleCaseDeclaration = true;
                    break;
                }

                nextToken = nextToken._next;
            }
        }

        // temporarily deindent for complex case body keyword unless it's the first one
        //
        // SELON x
        //     CAS 1 --> don't deindent here
        //         some code
        //     CAS 2 --> deindent here
        //         some code
        // FIN
        if(this.reservedWord(currentToken, 'CAS') && !this._simpleCaseDeclaration) {
            if(this._caseBody) {
                this.popFlags();

                this._conditionalDepth--;
                this._caseBody = false;
            }

            this.deindent();
        }

        this.printToken(currentToken);

        if(this.reservedArray(currentToken, ['BOUCLE', 'POUR', 'TANTQUE'])) {
            this.indent();
            this.pushFlags();

            this._conditionalDepth++;
        }

        // indent back to previous level in else block
        if(this.reservedWord(currentToken, 'SINON') && (currentToken._next._newlines > 0 || this.reservedWord(currentToken._next, 'SI'))) {
            this.indent();
            this.pushFlags();

            this._conditionalDepth++;
        }

        if(this.reservedWord(currentToken, 'ALORS') && currentToken._next._newlines > 0) {
            this.indent();
            this.pushFlags();

            this._conditionalDepth++;
        }

        // indent back to previous level in case body (or indent once in the first one)
        if(this.reservedWord(currentToken, 'CAS') && !this._simpleCaseDeclaration) {
            this.indent();
            this.pushFlags();

            this._conditionalDepth++;

            this._caseBody = true;
        }

        // indent if variable declaration block (LOCAL & GLOBAL can be used to define parameter scopes in function signatures)
        //
        // LOCAL
        //     some variable declaration --> indent here
        //
        // PROCEDURE x(LOCAL variable) --> ignore here
        if(this.reservedArray(currentToken, ['LOCAL', 'GLOBAL']) && currentToken._next._newlines > 0) {
            this.indent();
            this.pushFlags();

            this._variableDeclarationBlock = true;
        }

        if(this.reservedWord(currentToken, 'SELON')) {
            this.indent();
            this.pushFlags();

            this._caseDepth = this._conditionalDepth++;
            this._caseBlock = true;
        }
    }

    handleDot(currentToken: Token) {
        this.printToken(currentToken);
    }

    handleEOF(currentToken: Token) {
        this.handleWhitespaceAndComments(currentToken);
    }

    handleBlockComment(currentToken: Token) {
        if(!REGEXP.NEWLINE.test(currentToken.text) && !currentToken._newlines) {
            this._output._spaceBeforeToken = true;
            this.printToken(currentToken);
            this._output._spaceBeforeToken = true;

            return;
        } else {
            this.printBlockComment(currentToken);
        }
    }

    printBlockComment(currentToken: Token) {
        let lines = currentToken.text.split('\r\n');

        this.printNewLine(false);

        this.printTokenLineIndentation(currentToken);
        this._output.addToken(lines[0]);
        this.printNewLine(false);

        if(lines.length > 1) {
            lines = lines.slice(1);

            for (let i = 0; i < lines.length; i++) {
                this._output._currentLine.setIndent(-1);
                this._output.addToken(lines[i]);
            }
        }

        this.printNewLine(false);
    }

    handleComment(currentToken: Token) {
        if(currentToken._newlines) {
            this.printNewLine(false);
        } else {
            this._output.trim(true);
        }

        this._output._spaceBeforeToken = true;
        this.printToken(currentToken);
        this.printNewLine(false);
    }

    printToken(currentToken: Token) {
        this.printTokenLineIndentation(currentToken);

        if(REGEXP.CONTROL.test(currentToken.text)) {
            this._output.addToken(currentToken.text.toUpperCase());
        } else {
            this._output.addToken(currentToken.text);
        }
    }

    printTokenLineIndentation(currentToken: Token) {
        if(this._output.justAddedNewLine()) {
            if(this._textBlockToken) {
                this._output._currentLine.setIndent(-1);
                this._output._currentLine.push(currentToken._whitespaceBefore);
                this._output._spaceBeforeToken = false;
            } else {
                this._output.setIndent(this._flags._indentLevel);
            }
        }
    }
}

import InputScanner from "./InputScanner";
import Pattern from "./Pattern";

export default class WhitespacePattern extends Pattern {
    _lineRegexp: RegExp;
    _newlineCount: number;
    _whitespaceBeforeToken: string;
    _newlineRegexp: RegExp;

    constructor(inputScanner: InputScanner, parent: WhitespacePattern = null) {
        super(inputScanner, parent);

        if(parent) {
            this._lineRegexp = this._input.getRegexp(parent._lineRegexp);
        } else {
            this.setWhitespacePatterns('', '');
        }

        this._newlineCount = 0;
        this._whitespaceBeforeToken = '';
    }

    setWhitespacePatterns(whitespaceChars: string, newlineChars: string) {
        whitespaceChars += '\\t ';
        newlineChars += '\\n\\r';

        this._matchPattern = this._input.getRegexp(`[${whitespaceChars + newlineChars}]+`, true);
        this._newlineRegexp = this._input.getRegexp(`\\r\\n|[${newlineChars}]`);
    }

    read(): string {
        this._newlineCount = 0;
        this._whitespaceBeforeToken = '';

        let resultingString: string = this._input.read(this._matchPattern);

        if(resultingString === ' ') {
            this._whitespaceBeforeToken = ' ';
        } else if(resultingString) {
            let matches: string[] = this.split(this._newlineRegexp, resultingString);
            this._newlineCount = matches.length - 1;
            this._whitespaceBeforeToken = matches[this._newlineCount];
        }

        return resultingString;
    }

    split(regexp: RegExp, inputString: string) {
        regexp.lastIndex = 0;
        let startIndex: number = 0;
        let result: string[] = [];
        let nextMatch: RegExpExecArray = regexp.exec(inputString);

        while(nextMatch) {
            result.push(inputString.substring(startIndex, nextMatch.index));
            startIndex = nextMatch.index + nextMatch[0].length;
            nextMatch = regexp.exec(inputString);
        }

        if(startIndex < inputString.length) {
            result.push(inputString.substring(startIndex, inputString.length));
        } else {
            result.push('');
        }

        return result;
    }
}
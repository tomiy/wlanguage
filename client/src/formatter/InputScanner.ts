export default class InputScanner {
    _input: string;
    _position: number;

    constructor(inputString: string) {
        this._input = inputString;
        this._position = 0;
    }

    restart() {
        this._position = 0;
    }

    back() {
        if(this._position > 0) {
            this._position--;
        }
    }

    hasNext() {
        return this._position < this._input.length;
    }

    next() {
        let val: string = null;

        if(this.hasNext()) {
            val = this._input.charAt(this._position);
            this._position++;
        }

        return val;
    }

    peek(index: number = 0) {
        let val: string = null;

        index += this._position;
        if(index >= 0 && index < this._input.length) {
            val = this._input.charAt(index);
        }

        return val;
    }

    __match(pattern: RegExp, index: number = 0) {
        pattern.lastIndex = index;
        let patternMatch: RegExpExecArray = pattern.exec(this._input);

        if(patternMatch && !pattern.sticky && patternMatch.index !== index) {
            patternMatch = null;
        }

        return patternMatch;
    }

    match(pattern: RegExp) {
        let patternMatch: RegExpExecArray = this.__match(pattern, this._position);

        if(patternMatch) {
            this._position += patternMatch[0].length;
        } else {
            patternMatch = null;
        }

        return patternMatch;
    }

    read(startingPattern: RegExp, untilPattern: RegExp = null, untilAfter: boolean = false) {
        let val: string = '';
        let match: RegExpExecArray;

        if(startingPattern) {
            match = this.match(startingPattern);
            if(match) {
                val += match[0];
            }
        }

        if(untilPattern && (match || !startingPattern)) {
            val += this.readUntil(untilPattern, untilAfter);
        }

        return val;
    }

    readUntil(pattern: RegExp, untilAfter: boolean) {
        let val: string = '';
        let matchIndex: number = this._position;
        pattern.lastIndex = this._position;
        let patternMatch: RegExpExecArray = pattern.exec(this._input);

        if(patternMatch) {
            matchIndex = patternMatch.index;

            if(untilAfter) {
                matchIndex += patternMatch[0].length;
            }
        } else {
            matchIndex = this._input.length;
        }

        val = this._input.substring(this._position, matchIndex);
        this._position = matchIndex;

        return val;
    }

    getRegexp(pattern: RegExp|string, matchFrom: boolean = false) {
        let result: RegExp;
        let flags: string = 'g';
        if(matchFrom) {
            flags = 'y';
        }

        if(typeof pattern === 'string' && pattern !== '') {
            result = new RegExp(pattern, flags);
        } else if(pattern) {
            result = new RegExp(pattern.source, flags);
        }

        return result;
    }
}
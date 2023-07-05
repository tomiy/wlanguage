import InputScanner from "./InputScanner";

export default class Pattern {
    _input: InputScanner;
    _startingPattern: RegExp;
    _matchPattern: RegExp;
    _untilPattern: RegExp;
    _untilAfter: boolean;

    constructor(inputScanner: InputScanner, parent: Pattern = null) {
        this._input = inputScanner;
        this._untilAfter = false;

        if(parent) {
            this._startingPattern = this._input.getRegexp(parent._startingPattern, true);
            this._matchPattern = this._input.getRegexp(parent._matchPattern, true);
            this._untilPattern = this._input.getRegexp(parent._untilPattern);
            this._untilAfter = parent._untilAfter;
        }
    }

    read() {
        let result: string = this._input.read(this._startingPattern);

        if(!this._startingPattern || result) {
            result += this._input.read(this._matchPattern, this._untilPattern, this._untilAfter);
        }

        return result;
    }

    readMatch() {
        return this._input.read(this._matchPattern);
    }

    untilAfter(pattern: RegExp) {
        let result: Pattern = this.create();
        result._untilAfter = true;
        result._untilPattern = this._input.getRegexp(pattern);

        return result;
    }

    until(pattern: RegExp) {
        let result: Pattern = this.create();
        result._untilAfter = false;
        result._untilPattern = this._input.getRegexp(pattern);

        return result;
    }

    startingWith(pattern: RegExp) {
        let result: Pattern = this.create();
        result._startingPattern = this._input.getRegexp(pattern, true);

        return result;
    }

    matching(pattern: RegExp) {
        let result: Pattern = this.create();
        result._matchPattern = this._input.getRegexp(pattern, true);

        return result;
    }

    create(): Pattern {
        return new Pattern(this._input, this);
    }
}
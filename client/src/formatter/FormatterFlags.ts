export default class FormatterFlags {
    _parent: FormatterFlags;
    _indentLevel: number;

    clone() {
        let clone: FormatterFlags = new FormatterFlags();

        clone._parent = this;
        clone._indentLevel = this._indentLevel;

        return clone;
    }
}
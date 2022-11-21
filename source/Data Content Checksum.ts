declare type WHITESPACE_OPTION = 'none' | 'trim' | 'normalize' | 'ignore';
declare type NONALPHANUM_OPTION = 'none' | 'whitespace' | 'ignore';

declare interface ICrC64 {
    value0: number;
    value1: number;
    value2: number;
    value3: number;
    toString(): string;
}
declare interface ITransformedLine {
    source: string;
    transformed: string;
    crc?: ICrc;
}
declare interface IControlData {
    sourceText: string;
    lines: [ITransformedLine];
    charCount: number;
    wordCount: number;
    lineCount: number;
    crc: string;
    whiteSpaceOption: WHITESPACE_OPTION;
    ignoreCase: boolean;
    nonAlphaNumOption: NONALPHANUM_OPTION;
    multiline: boolean;
    ignoreBlankLines: boolean;
}
declare interface IController {
    data: IControlData;
    onMultiLineChanged: function(this: IController): void;
    onIgnoreBlankChanged: function(this: IController): void;
    onTextChanged: function(this: IController): void;
}

var api: { controller: function } = function() {
	/* widget controller */

    var crc64Table = [
        0x0000, 0x01b0, 0x0360, 0x02d0, 0x06c0, 0x0770, 0x05a0, 0x0410, 0x0d80, 0x0c30, 0x0ee0, 0x0f50, 0x0b40, 0x0af0, 0x0820, 0x0990,
        0x1b00, 0x1ab0, 0x1860, 0x19d0, 0x1dc0, 0x1c70, 0x1ea0, 0x1f10, 0x1680, 0x1730, 0x15e0, 0x1450, 0x1040, 0x11f0, 0x1320, 0x1290,
        0x3600, 0x37b0, 0x3560, 0x34d0, 0x30c0, 0x3170, 0x33a0, 0x3210, 0x3b80, 0x3a30, 0x38e0, 0x3950, 0x3d40, 0x3cf0, 0x3e20, 0x3f90,
        0x2d00, 0x2cb0, 0x2e60, 0x2fd0, 0x2bc0, 0x2a70, 0x28a0, 0x2910, 0x2080, 0x2130, 0x23e0, 0x2250, 0x2640, 0x27f0, 0x2520, 0x2490,
        0x6c00, 0x6db0, 0x6f60, 0x6ed0, 0x6ac0, 0x6b70, 0x69a0, 0x6810, 0x6180, 0x6030, 0x62e0, 0x6350, 0x6740, 0x66f0, 0x6420, 0x6590,
        0x7700, 0x76b0, 0x7460, 0x75d0, 0x71c0, 0x7070, 0x72a0, 0x7310, 0x7a80, 0x7b30, 0x79e0, 0x7850, 0x7c40, 0x7df0, 0x7f20, 0x7e90,
        0x5a00, 0x5bb0, 0x5960, 0x58d0, 0x5cc0, 0x5d70, 0x5fa0, 0x5e10, 0x5780, 0x5630, 0x54e0, 0x5550, 0x5140, 0x50f0, 0x5220, 0x5390,
        0x4100, 0x40b0, 0x4260, 0x43d0, 0x47c0, 0x4670, 0x44a0, 0x4510, 0x4c80, 0x4d30, 0x4fe0, 0x4e50, 0x4a40, 0x4bf0, 0x4920, 0x4890,
        0xd800, 0xd9b0, 0xdb60, 0xdad0, 0xdec0, 0xdf70, 0xdda0, 0xdc10, 0xd580, 0xd430, 0xd6e0, 0xd750, 0xd340, 0xd2f0, 0xd020, 0xd190,
        0xc300, 0xc2b0, 0xc060, 0xc1d0, 0xc5c0, 0xc470, 0xc6a0, 0xc710, 0xce80, 0xcf30, 0xcde0, 0xcc50, 0xc840, 0xc9f0, 0xcb20, 0xca90,
        0xee00, 0xefb0, 0xed60, 0xecd0, 0xe8c0, 0xe970, 0xeba0, 0xea10, 0xe380, 0xe230, 0xe0e0, 0xe150, 0xe540, 0xe4f0, 0xe620, 0xe790,
        0xf500, 0xf4b0, 0xf660, 0xf7d0, 0xf3c0, 0xf270, 0xf0a0, 0xf110, 0xf880, 0xf930, 0xfbe0, 0xfa50, 0xfe40, 0xfff0, 0xfd20, 0xfc90,
        0xb400, 0xb5b0, 0xb760, 0xb6d0, 0xb2c0, 0xb370, 0xb1a0, 0xb010, 0xb980, 0xb830, 0xbae0, 0xbb50, 0xbf40, 0xbef0, 0xbc20, 0xbd90,
        0xaf00, 0xaeb0, 0xac60, 0xadd0, 0xa9c0, 0xa870, 0xaaa0, 0xab10, 0xa280, 0xa330, 0xa1e0, 0xa050, 0xa440, 0xa5f0, 0xa720, 0xa690,
        0x8200, 0x83b0, 0x8160, 0x80d0, 0x84c0, 0x8570, 0x87a0, 0x8610, 0x8f80, 0x8e30, 0x8ce0, 0x8d50, 0x8940, 0x88f0, 0x8a20, 0x8b90,
        0x9900, 0x98b0, 0x9a60, 0x9bd0, 0x9fc0, 0x9e70, 0x9ca0, 0x9d10, 0x9480, 0x9530, 0x97e0, 0x9650, 0x9240, 0x93f0, 0x9120, 0x9090
    ];
    
    var zStr = '000';
    function zeroPad4(value: number) {
        var s = zStr + value.toString(16).toUpperCase();
        return s.substring(s.length - 4);
    }

    function crc64ToString(this: ICrC64): string { return zeroPad4(this.value3) + '-' + zeroPad4(this.value2) + '-' + zeroPad4(this.value1) + '-' + zeroPad4(this.value0)}

    function calculateCrc64(text?: string | null): ICrC64 {
        var crc = {
            value0: 0, value1: 0, value2: 0, value3: 0,
            toString(this: ICrC64): string { return crc64ToString.apply(this); }
        };
        if (typeof text === 'string')
            for (var i = 0; i < text.length; i++) {
                var idx = (text.charCodeAt(i) ^ crc.value0) & 0xff;
                crc.value0 = (crc.value0 >> 8) | ((crc.value1 & 0xff) << 8);
                crc.value1 = (crc.value1 >> 8) | ((crc.value2 & 0xff) << 8);
                crc.value2 = (crc.value2 >> 8) | ((crc.value3 & 0xff) << 8);
                crc.value3 = (crc.value3 >> 8) ^ crc64Table[idx];
            }
        return crc;
    }

    function aggregateCrc64(lines: [ITransformedLine]): ICrC64 {
        var crc = {
            value0: 0, value1: 0, value2: 0, value3: 0,
            toString(this: ICrC64): string { return crc64ToString.apply(this); }
        };
        var lineCrcs = lines.filter(function(value: ITransformedLine): boolean { return typeof value.crc !== 'undefined'; }).map(function(value: ITransformedLine): ICrC64 { return value.crc; });
        if (lineCrcs.length == 1) {
            crc.value0 = lineCrcs[0].value0;
            crc.value1 = lineCrcs[0].value1;
            crc.value2 = lineCrcs[0].value2;
            crc.value3 = lineCrcs[0].value3;
        } else if (lineCrcs.length > 1) {
            var idx = ((lineCrcs.length - 1) ^ crc.value0) & 0xff;
            crc.value0 = (crc.value0 >> 8) | ((crc.value1 & 0xff) << 8);
            crc.value1 = (crc.value1 >> 8) | ((crc.value2 & 0xff) << 8);
            crc.value2 = (crc.value2 >> 8) | ((crc.value3 & 0xff) << 8);
            crc.value3 = (crc.value3 >> 8) ^ crc64Table[idx];
            lineCrcs.forEach(function(this: ICrC64, value: ICrC64): void {
                [value.value3, value.value2, value.value1, value.value0].forEach(function(this: ICrC64, n: number): void {
                    var idx = (n ^ this.value0) & 0xff;
                    this.value0 = (this.value0 >> 8) | ((this.value1 & 0xff) << 8);
                    this.value1 = (this.value1 >> 8) | ((this.value2 & 0xff) << 8);
                    this.value2 = (this.value2 >> 8) | ((this.value3 & 0xff) << 8);
                    this.value3 = (this.value3 >> 8) ^ crc64Table[idx];
                }, this);
            }, crc);
        }
        return crc;
    }

	var c: IController = <IController>this;
	c.data.sourceText = '';
    c.data.lines = [{ source: '', transformed: '', crc: calculateCrc64() }];
	c.data.charCount = 0;
	c.data.wordCount = 0;
	c.data.lineCount = 1;
	c.data.crc = c.data.lines[0].crc.toString();
	c.data.whiteSpaceOption = 'none';
	c.data.ignoreCase = false;
	c.data.nonAlphaNumOption = 'none';
	c.data.multiline = false;
    c.data.ignoreBlankLines = false;

	function isNotEmptyString(s?: string | null): string { return typeof s == 'string' && s.length > 0; }

	// nonAlphaNumOption: none; whiteSpaceOption: none;
	// nonAlphaNumOption: whitespace; whiteSpaceOption: none;
	function nonAlphaNumWsToSpace(text: string): string { return text.replace(/[^a-zA-Z\d\s]+/g, ' '); }
	
	// nonAlphaNumOption: ignore; whiteSpaceOption: none;
	function stripNonAlphaNumWs(text: string): string { return text.replace(/[^a-zA-Z\d\s]+/g, ''); }
	
	// nonAlphaNumOption: whitespace; whiteSpaceOption: trim;
	function nonAlphaNumWsToSpaceAndTrim(text: string): string { return text.replace(/[^a-zA-Z\d\s]+/g, ' ').trim(); }
	
	// nonAlphaNumOption: ignore; whiteSpaceOption: trim;
	function stripNonAlphaNumWsAndTrim(text: string): string { return text.replace(/[^a-zA-Z\d\s]+/g, ''); }
	
	// nonAlphaNumOption: none; whiteSpaceOption: normalize;
	function normalizeWs(text: string): string { return ((text = text.trim()).length > 0) ? text.replace(/\s+/g, ' ') : text; }
	
	// nonAlphaNumOption: whitespace; whiteSpaceOption: normalize;
	function nonAlphaNumWsToSpaceAndNormalize(text: string): string { return text.replace(/[^a-zA-Z\d]+/g, ' ').trim(); }
	
	// nonAlphaNumOption: ignore; whiteSpaceOption: normalize;
	function stripNonAlphaNumWsAndNormalize(text: string): string { return ((text = text.replace(/[^a-zA-Z\d\s]+/g, '').trim()).length > 0) ? text.replace(/\s+/g, ' ') : text; }
	
	// nonAlphaNumOption: none; whiteSpaceOption: ignore;
	function stripWs(text: string): string { return ((text = text.trim()).length > 0) ? text.replace(/\s+/g, ' ') : text; }
	
	// nonAlphaNumOption: whitespace; whiteSpaceOption: ignore;
	// nonAlphaNumOption: ignore; whiteSpaceOption: ignore;
	function stripNonAlphaNum(text: string): string { return text.replace(/[^a-zA-Z\d]+/g, ''); }
    
	function getWordCount(text: string): number {
        var words = text.trim().split(/[^a-zA-Z\d]+/g);
        var wc = words.length;
        if (wc > 1)
            return (words[wc - 1].length > 0) ? ((words[0].length > 0) ? wc : wc - 1) : wc - ((words[0].length > 0) ? 1 : 2);
        return (words[0].length > 0) ? 1 : 0;
    }

    function applyMultiLineChange(this: IControlData): void {
		switch (this.whiteSpaceOption) {
			case 'ignore':
                if (this.nonAlphaNumOption == 'none')
                    this.lines.forEach(function(value: ITransformedLine) { value.transformed = stripWs(value.source); });
                else
                    this.lines.forEach(function(value: ITransformedLine) { value.transformed = stripNonAlphaNum(value.source); });
				break;
			case 'trim':
				switch (this.nonAlphaNumOption) {
					case 'whitespace':
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = nonAlphaNumWsToSpaceAndTrim(value.source); });
						break;
					case 'ignore':
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = stripNonAlphaNumWsAndTrim(value.source); });
						break;
					default:
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = value.source.trim(); });
						break;
				}
				break;
			case 'normalize':
				switch (this.nonAlphaNumOption) {
					case 'whitespace':
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = nonAlphaNumWsToSpaceAndNormalize(value.source); });
						break;
					case 'ignore':
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = stripNonAlphaNumWsAndNormalize(value.source); });
						break;
					default:
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = normalizeWs(value.source); })
						break;
				}
				break;
			default:
				switch (this.nonAlphaNumOption) {
					case 'whitespace':
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = nonAlphaNumWsToSpace(value.source); });
						break;
					case 'ignore':
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = stripNonAlphaNumWs(value.source); });
						break;
                    default:
                        this.lines.forEach(function(value: ITransformedLine) { value.transformed = value.source; });
                        break;
				}
				break;
		}
        var idx;
        if (this.ignoreBlankLines) {
            this.lines.filter(function(value: ITransformedLine): boolean {
                if (value.transformed.length > 0)
                    value.crc = calculateCrc64(value.transformed);
                else
                    value.crc = undefined;
            });
        } else {
            this.lineCount = this.lines.length;
            var line: ITransformedLine = this.lines[0];
            line.crc = calculateCrc64(line.transformed);
            crc.value0 - line.crc.value0;
            crc.value1 - line.crc.value1;
            crc.value2 - line.crc.value2;
            crc.value3 - line.crc.value3;
            for (idx = 1; idx < this.lines.length; idx++) {
                line: ITransformedLine = this.lines[idx];
                if (line.transformed.length > 0) {
                    this.lineCount++;
                    line.crc = calculateCrc64(line.transformed);
                }
                else
                    line.crc = undefined;
            }
        }
        this.crc = aggregateCrc64(this.lines).toString();
    }

    function applySingleLineChange(this: IControlData): void {
        var text = this.sourceText;
		if (text.length > 0) {
			this.wordCount = getWordCount(text);
			this.lines = [text];
			switch (this.whiteSpaceOption) {
				case 'ignore':
					text = (this.nonAlphaNumOption == 'none') ? stripWs(text) : stripNonAlphaNum(text);
							break;
				case 'trim':
					switch (this.nonAlphaNumOption) {
						case 'whitespace':
							text = nonAlphaNumWsToSpaceAndTrim(text);
							break;
						case 'ignore':
							text = stripNonAlphaNumWsAndTrim(text);
							break;
						default:
							text = text.trim();
							break;
					}
					break;
				case 'normalize':
					switch (this.nonAlphaNumOption) {
						case 'whitespace':
							text = nonAlphaNumWsToSpaceAndNormalize(text);
							break;
						case 'ignore':
							text = stripNonAlphaNumWsAndNormalize(text);
							break;
						default:
							text = normalizeWs(text);
							break;
					}
					break;
				default:
					switch (this.nonAlphaNumOption) {
						case 'whitespace':
							text = nonAlphaNumWsToSpace(text);
							break;
						case 'ignore':
							text = stripNonAlphaNumWs(text);
							break;
					}
					break;
			}
			if (text.length > 0) {
				this.crc = getCrcString(calculateCrc64(this.ignoreCase ? text.toLowerCase() : text));
				this.charCount = text.length;
				this.lineCount = 1;
				this.tranformedText = [text];
				return;
			}	
		} else
			this.wordCount = 0;
		this.charCount = 0;
		this.crc = EMPTY_CRC;
		if (this.ignoreBlankLines) {
			this.lineCount = 0;
			this.tranformedText = [];
            this.lineCrc = ['(ignored)'];
		} else {
			this.lineCount = 1;
			this.tranformedText = [''];
            this.lineCrc = [EMPTY_CRC];
		}
    }

    c.onMultiLineChanged = function(this: IController): void {
		if (this.data.multiline)
            applyMultiLineChange.apply(this.data);
		else {
			if (this.data.lines.length > 1)
				this.data.sourceText = this.data.lines[0];
            applySingleLineChange.apply(this.data);
		}
    };

    c.onIgnoreBlankChanged = function(this: IController): void {
		if (this.multiline) {
			if (this.data.ignoreBlankLines)
				this.data.lineCount = (this.data.tranformedText = this.data.tranformedText.filter(isNotEmptyString)).length;
			else
                applyMultiLineChange.apply(this.data);
		}
    };

    c.onTextChanged = function(this: IController): void {
		if (this.data.multiline) {
			this.data.wordCount = getWordCount(this.data.sourceText);
			this.data.lines = this.data.sourceText.split(/[\r\n]/g);
            applyMultiLineChange.apply(this.data);
		} else
            applySingleLineChange.apply(this.data);
    };
};
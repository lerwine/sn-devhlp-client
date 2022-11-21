declare type WHITESPACE_OPTION = 'none' | 'trim' | 'normalize' | 'ignore';
declare type NONALPHANUM_OPTION = 'none' | 'whitespace' | 'ignore';

declare interface ICrc64 {
    buffer: Int8Array & { length: 8 };
    toString(): string;
}
declare interface ITransformedLine {
    lineNumber: string;
    source: string;
    transformed: string;
    crc?: ICrc64;
}
declare interface IControlData {
    singleLineText: string;
    multiLineText: string;
    lines: ITransformedLine[];
    lineCrc: ILineCrc[];
    charCount: number;
    wordCount: number;
    lineCount: number;
    crc: string;
    whiteSpaceOption: WHITESPACE_OPTION;
    ignoreCase: boolean;
    nonAlphaNumOption: NONALPHANUM_OPTION;
    isMultiLine: boolean;
    ignoreBlankLines: boolean;
}
declare interface IController {
    data: IControlData;
    onIsMultiLineChanged: function(this: IController): void;
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
    
    function zeroPad2(value: number): string { return (value < -9 || value > 9) ? value.toString(16) : '0' + value.toString(16); }

    function crc64ToString(buffer: Int8Array & { length: 8 }): string {
        return zeroPad2(buffer[7]) + zeroPad2(buffer[6]) + '-' + zeroPad2(buffer[5]) + zeroPad2(buffer[4]) +
            '-' + zeroPad2(buffer[3]) + zeroPad2(buffer[2]) + '-' + zeroPad2(buffer[1]) + zeroPad2(buffer[0]);
    }

    function calculateNextCrc64(buffer: Int8Array & { length: 8 }, value: number): void {
        var v = crc64Table[(value ^ crc.buffer[0]) & 0xff];
        crc.buffer[0] = crc.buffer[1];
        crc.buffer[1] = crc.buffer[2];
        crc.buffer[2] = crc.buffer[3];
        crc.buffer[3] = crc.buffer[4];
        crc.buffer[4] = crc.buffer[5];
        crc.buffer[5] = crc.buffer[6];
        crc.buffer[6] = crc.buffer[7] ^ (v & 0xff);
        crc.buffer[7] = v >> 8;
    }

    function calculateCrc64(text?: string | null) : ICrc64 {
        var crc = {
            buffer: new Int8Array(8),
            toString: function(this: ICrc64): string { return crc64ToString(this.buffer); }
        };
        crc.buffer[0] = 0;
        crc.buffer[1] = 0;
        crc.buffer[2] = 0;
        crc.buffer[3] = 0;
        crc.buffer[4] = 0;
        crc.buffer[5] = 0;
        crc.buffer[6] = 0;
        crc.buffer[7] = 0;
        if (typeof text === 'string')
            for (var i = 0; i < text.length; i++)
                calculateNextCrc64(crc.buffer, text.charCodeAt(i));
        return crc;
    }

    function aggregateCrc64(inputCrcs: ICrC64[]): ICrC64 {
        var crc: ICrC64;
        if (inputCrcs.length == 1) {
            var crc = {
                buffer: new Int8Array(8),
                toString: function(this: ICrc64): string { return crc64ToString(this.buffer); }
            };
            firstCrc = inputCrcs[0];
            crc.buffer[0] = firstCrc.buffer[0];
            crc.buffer[1] = firstCrc.buffer[1];
            crc.buffer[2] = firstCrc.buffer[2];
            crc.buffer[3] = firstCrc.buffer[3];
            crc.buffer[4] = firstCrc.buffer[4];
            crc.buffer[5] = firstCrc.buffer[5];
            crc.buffer[6] = firstCrc.buffer[6];
            crc.buffer[7] = firstCrc.buffer[7];
        } else {
            crc = calculateCrc64();
            if (inputCrcs.length > 1) {
                calculateNextCrc64(crc.buffer, inputCrcs.length - 1);
                inputCrcs.forEach(function(this: ICrc64, value: ICrc64): void {
                    value.buffer.forEach(function(this: ICrc64, n: number): void { calculateNextCrc64(this.buffer, n); }, this);
                }, crc);
            }
        } 
        return crc;
    }

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

    function onTextChanged(this: IControlData): void {
        switch (this.nonAlphaNumOption) {
            case "ignore":
                this.lines.forEach(function(value: ITransformedLine): void { value.transformed = value.source.replace(/[^A-Za-z\d\s]+/g, ''); });
                break;
            case "whitespace":
                this.lines.forEach(function(value: ITransformedLine): void { value.transformed = value.source.replace(/[^A-Za-z\d\s]+/g, ' '); });
                break;
            default:
                this.lines.forEach(function(value: ITransformedLine): void { value.transformed = value.source; });
                break;
        }
        switch (this.whiteSpaceOption) {
            case "ignore":
                this.lines.forEach(function(value: ITransformedLine): void { value.transformed = value.transformed.replace(/\s+/g, ''); });
                break;
            case "normalize":
                this.lines.forEach(function(value: ITransformedLine): void { value.transformed = value.transformed.trim().replace(/\s+/g, ' '); });
                break;
            case "trim":
                this.lines.forEach(function(value: ITransformedLine): void { value.transformed = value.transformed.trim(); });
                break;
        }
        this.lineCount = 0;
        if (this.ignoreBlankLines) {
            if (this.ignoreCase)
                this.crc = aggregateCrc64(this.lines.filter(function(this: IControlData, value: ITransformedLine): boolean {
                    if (value.transformed.length > 0) {
                        value.crc = calculateCrc64(value.transformed.toLowerCase());
                        this.lineCount++;
                        value.lineNumber = this.lineCount.toString();
                        this.charCount += value.transformed.length;
                        return true;
                    }
                    value.lineNumber = '';
                    return false;
                }, this).map(function(value: ITransformedLine): ICrc64 { return value.crc; })).toString();
            else
                this.crc = aggregateCrc64(this.lines.filter(function(this: IControlData, value: ITransformedLine): boolean {
                    if (value.transformed.length > 0) {
                        value.crc = calculateCrc64(value.transformed);
                        this.lineCount++;
                        value.lineNumber = this.lineCount.toString();
                        this.charCount += value.transformed.length;
                        return true;
                    }
                    value.lineNumber = '';
                    return false;
                }, this).map(function(value: ITransformedLine): ICrc64 { return value.crc; })).toString();
        } if (this.ignoreCase)
            this.crc = aggregateCrc64(this.lines.map(function(this: IControlData, value: ITransformedLine): ICrc64 {
                this.charCount += value.transformed.length;
                value.crc = calculateCrc64(value.transformed.toLowerCase());
                this.lineCount++;
                value.lineNumber = this.lineCount.toString();
                return value.crc;
            }, this)).toString();
        else
            this.crc = aggregateCrc64(this.lines.map(function(this: IControlData, value: ITransformedLine): ICrc64 {
                this.charCount += value.transformed.length;
                value.crc = calculateCrc64(value.transformed);
                this.lineCount++;
                value.lineNumber = this.lineCount.toString();
                return value.crc;
            }, this)).toString();
    }

	var c: IController = <IController>this;
	c.data.singleLineText = '';
	c.data.multiLineText = '';
    c.data.lines = [{ lineNumber: 1, source: '', transformed: '', crc: calculateCrc64() }];
	c.data.crc = c.data.lines[0].crc.toString();
	c.data.charCount = 0;
	c.data.wordCount = 0;
	c.data.lineCount = 1;
	c.data.whiteSpaceOption = 'none';
	c.data.ignoreCase = false;
	c.data.nonAlphaNumOption = 'none';
	c.data.isMultiLine = false;
    c.data.ignoreBlankLines = false;

    c.onIsMultiLineChanged = function(this: IController): void {
		if (this.data.isMultiLine) {
            this.data.multiLineText = this.data.singleLineText;
            this.data.lines = this.data.multiLineText.split(/\r\n?|\n/g).map(function(value: string): ITransformedLine { return <ITransformedLine>{ source: value }; });
            onTextChanged.apply(this.data);
        } else {
            var firstLine: ITransformedLine = this.data.lines[0];
			this.data.singleLineText = firstLine.source;
            if (this.data.lines.length > 1) {
                this.data.lines = [firstLine];
                this.data.lineCount = 1;
                this.data.crc = this.crc = aggregateCrc64((typeof firstLine.crc === 'undefined') ? [] : [firstLine.crc]).toString();
            }
		}
    };

    c.onIgnoreBlankChanged = function(this: IController): void {
        this.data.lineCount = 0;
        this.lineCount = 0;
        if (this.ignoreBlankLines)
            this.crc = aggregateCrc64(this.lines.filter(function(this: IControlData, value: ITransformedLine): boolean {
                if (value.transformed.length == 0) {
                    this.lineCount++;
                    value.lineNumber = this.lineCount.toString();
                    return true;
                }
                value.lineNumber = '';
                value.crc = undefined;
                return false;
            }, this).map(function(value: ITransformedLine): ICrc64 { return value.crc; })).toString();
        else
            this.crc = aggregateCrc64(this.lines.map(function(this: IControlData, value: ITransformedLine): ICrc64 {
                if (value.transformed.length == 0)
                    value.crc = calculateCrc64();
                this.lineCount++;
                value.lineNumber = this.lineCount.toString();
                return value.crc;
            }, this)).toString();
    };

    c.onSingleLineTextChanged = function(this: IController): void {
        if (this.data.isMultiLine)
            return;
        this.wordCount = getWordCount(this.data.singleLineText);
        this.data.lines = <ITransformedLine[]>[{ source: this.data.singleLineText }];
        onTextChanged.apply(this.data);
    };

    c.onMultiLineTextChanged = function(this: IController): void {
        if (!this.data.isMultiLine)
            return;
        this.wordCount = getWordCount(this.data.multiLineText);
        this.data.lines = this.data.multiLineText.split(/\r\n?|\n/g).map(function(value: string): ITransformedLine { return <ITransformedLine>{ source: value }; });
        onTextChanged.apply(this.data);
    };
};
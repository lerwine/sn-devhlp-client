declare type CLASSIFICATION_PM = 'U' | 'C' | 'S' | 'TS';
declare type SYSTEM_OPTION = 'none' | 'JCON' | 'BLK' | 'DEV' | 'RED' | 'MEDIA';

declare interface IDissemMarking {
    portionMarking: string;
    display: string;
    level: number;
}

declare interface IClassificationOption {
    display: string;
    level: number;
    dissemMarkings: IClassifictionName[];
}

declare interface IClassificationMapping { [key: CLASSIFICATION_PM]: IClassificationOption; }

declare interface IClassificationItem {
    key: CLASSIFICATION_PM;
    display: string;
}

declare interface ISystemOption {
    key: SYSTEM_OPTION;
    display: string;
    classification?: CLASSIFICATION_PM;
}

declare interface ISystemMapping { [key: SYSTEM_OPTION]: ISystemOption; }

declare interface ISystemItem {
    key: SYSTEM_OPTION;
    display: string;
}

declare type MIME_TYPE = 'application' | 'audio' | 'example' | 'font' | 'image' | 'model' | 'text' | 'video' | 'message' | 'multipart';

declare interface IMimeSubTypeDefinition {
    description: string;
    extensions: string[];
}

declare interface IMimeTypeMapping { [key: MIME_TYPE]: { [key: string]: IMimeSubTypeDefinition }; };

declare interface IExtensionMapItem {
    type: MIME_TYPE;
    subType: string;
    requireHash: boolean;
    description?: string;
}

declare interface IExtensionMapping { [key: string]: IExtensionMapItem; };

declare interface ISourceFile {
    extension: string;
    baseName: string;
    directory: string;
    sizeBytes: number;
    sizeDisplay: string;
    classification: {
        display: string;
        portionMarking: CLASSIFICATION_PM;
        dissemination: IDissemMarking;
        caveat: string;
    }
    mime: {
        type: MIME_TYPE;
        subType: string;
        display: string;
    };
    hash: string;
}

declare interface IFtrData {
    systemOptions: ISystemItem[];
    selectedSourceSystem: ISystemItem;
    selectedTargetSystem: ISystemItem;
    isRoutineRequest: boolean;
    smeReviewerName: string;
    justification: string;
    stagingFolderPath: string;
    sourceFiles: ISourceFile[];
}

declare interface IFtrController {
    data: IFtrData;
    onSelectedSourceSystemChanged: function;
    onSelectedTargetSystemChanged: function;
}

declare var api: { controller: function };

api.controller = function(this: IFtrController) {
    const classificationsMap: IClassificationMapping = {
        U: { display: 'UNCLASSIFIED', level: 0,
            dissemMarkings: [
                { display: 'CONTROLLED UNCLASSIFIED INFORMATION', pm: 'CUI', level: 0 },
                { display: 'LAW ENFORCEMENT SENSITIVE', pm: 'LES', level: 1 }
            ]
        },
        C: { display: 'CONFIDENTIAL', level: 0, dissemMarkings: [] },
        S: { display: 'SECRET', level: 1,
            dissemMarkings: [
                { display: 'NOFORN', pm: 'NF', level: 1 }
            ]
        },
        TS: {display: 'TOP SECRET', level: 2, dissemMarkings: [] }
    };
    const systemsMap: ISystemMapping = {
        none: { display: '' },
        JCON: { display: 'JCON', classification: 'UNCLASSIFIED' },
        BLK: { display: 'BLK', classification: 'UNCLASSIFIED' },
        DEV: { display: 'DEV', classification: 'SECRET' },
        RED: { display: 'RED', classification: 'SECRET' },
        MEDIA: { display: 'MEDIA' }
    };
    
    const mimeTypeMap: IMimeTypeMapping = {
        'application': {
            'epub+zip': {
                description: 'Electronic publication file',
                extensions: ['epub']
            },
            'gzip': {
                description: 'GZip Compressed archive',
                extensions: ['gz']
            },
            'java-archive': {
                description: 'Java archive',
                extensions: ['jar']
            },
            'json': {
                description: 'JSON file',
                extensions: ['json']
            },
            'ld+json': {
                description: 'JSON-LD file',
                extensions: ['jsonld']
            },
            'msword': {
                description: 'Microsoft Word document',
                extensions: ['doc', 'dot']
            },
            'octet-stream': {
                description: 'Binary data file',
                extensions: ['bin', 'com', 'dll', 'msi']
            },
            'ogg': {
                description: 'OGG audio/video file',
                extensions: ['ogx']
            },
            'pdf': {
                description: 'Adobe portable document',
                extensions: ['pdf']
            },
            'pkcs10': {
                description: 'PKCS #10 - Certification Request Standard file',
                extensions: ['p10']
            },
            'pkcs7-mime': {
                description: 'PKCS #7 - Cryptographic Message Syntax Standard file',
                extensions: ['p7m']
            },
            'pkcs7-signature': {
                description: 'PKCS #7 Signature file',
                extensions: ['p7s']
            },
            'pkcs8': {
                description: 'PKCS #8 - Private-Key Information Syntax Standard',
                extensions: ['p8']
            },
            'pkix-cert': {
                description: 'Internet Public Key Infrastructure Certificate file',
                extensions: ['cer']
            },
            'pkixcmp': {
                description: 'Internet Public Key Infrastructure Certificate Management Protocol file',
                extensions: ['pki']
            },
            'postscript': {
                description: 'Adobe PostScript document',
                extensions: ['ai']
            },
            'rtf': {
                description: 'Rich Text Format (RTF) document',
                extensions: ['rtf']
            },
            'vnd.amazon.ebook': {
                description: 'Amazon Kindle eBook document',
                extensions: ['azw']
            },
            'vnd.android.package-archive': {
                description: 'Android Package archive',
                extensions: ['apk']
            },
            'vnd.apple.installer+xml': {
                description: 'Apple Installer Package',
                extensions: ['mpkg']
            },
            'vnd.mozilla.xul+xml': {
                description: 'XUL file',
                extensions: ['xul']
            },
            'vnd.ms-cab-compressed': {
                description: 'Microsoft Cabinet file',
                extensions: ['cab']
            },
            'vnd.ms-excel': {
                description: 'Microsoft Excel document',
                extensions: ['xls']
            },
            'vnd.ms-fontobject': {
                description: 'MS Embedded OpenType font file',
                extensions: ['eot']
            },
            'vnd.ms-htmlhelp': {
                description: 'Microsoft Html Help file',
                extensions: ['chm']
            },
            'vnd.ms-powerpoint': {
                description: 'Microsoft PowerPoint document',
                extensions: ['pps', 'ppt', 'ppz']
            },
            'vnd.ms-powerpoint.addin.macroenabled.12': {
                description: 'Microsoft PowerPoint - Add-in file',
                extensions: ['ppam']
            },
            'vnd.ms-powerpoint.presentation.macroenabled.12': {
                description: 'Microsoft PowerPoint - Macro-Enabled Presentation document',
                extensions: ['pptm']
            },
            'vnd.ms-powerpoint.slide.macroenabled.12': {
                description: 'Microsoft PowerPoint - Macro-Enabled Open XML Slide document',
                extensions: ['sldm']
            },
            'vnd.ms-powerpoint.slideshow.macroenabled.12': {
                description: 'Microsoft PowerPoint - Macro-Enabled Slide Show document',
                extensions: ['ppsm']
            },
            'vnd.ms-powerpoint.template.macroenabled.12': {
                description: 'Microsoft PowerPoint - Macro-Enabled Template document',
                extensions: ['potm']
            },
            'vnd.ms-project': {
                description: 'Microsoft Project document',
                extensions: ['mpp']
            },
            'vnd.ms-word.document.macroenabled.12': {
                description: 'Microsoft Word - Macro-Enabled document',
                extensions: ['docm']
            },
            'vnd.ms-word.template.macroenabled.12': {
                description: 'Microsoft Word - Macro-Enabled template',
                extensions: ['dotm']
            },
            'vnd.ms-xpsdocument': {
                description: 'Microsoft XML Paper Specification document',
                extensions: ['xps']
            },
            'vnd.oasis.opendocument.chart': {
                description: 'OpenDocument Chart document',
                extensions: ['odc']
            },
            'vnd.oasis.opendocument.chart-template': {
                description: 'OpenDocument Chart Template document',
                extensions: ['otc']
            },
            'vnd.oasis.opendocument.database': {
                description: 'OpenDocument database',
                extensions: ['odb']
            },
            'vnd.oasis.opendocument.formula': {
                description: 'OpenDocument Formula document',
                extensions: ['odf']
            },
            'vnd.oasis.opendocument.formula-template': {
                description: 'OpenDocument Formula Template document',
                extensions: ['odft']
            },
            'vnd.oasis.opendocument.graphics': {
                description: 'OpenDocument Graphics document',
                extensions: ['odg']
            },
            'vnd.oasis.opendocument.graphics-template': {
                description: 'OpenDocument Graphics Template document',
                extensions: ['otg']
            },
            'vnd.oasis.opendocument.image': {
                description: 'OpenDocument Image document',
                extensions: ['odi']
            },
            'vnd.oasis.opendocument.image-template': {
                description: 'OpenDocument Image Template document',
                extensions: ['oti']
            },
            'vnd.oasis.opendocument.presentation': {
                description: 'OpenDocument presentation document',
                extensions: ['odp']
            },
            'vnd.oasis.opendocument.presentation-template': {
                description: 'OpenDocument Presentation Template document',
                extensions: ['otp']
            },
            'vnd.oasis.opendocument.spreadsheet': {
                description: 'OpenDocument spreadsheet document',
                extensions: ['ods']
            },
            'vnd.oasis.opendocument.spreadsheet-template': {
                description: 'OpenDocument Spreadsheet Template document',
                extensions: ['ots']
            },
            'vnd.oasis.opendocument.text': {
                description: 'OpenDocument text document',
                extensions: ['odt']
            },
            'vnd.oasis.opendocument.text-master': {
                description: 'OpenDocument Text Master document',
                extensions: ['odm']
            },
            'vnd.oasis.opendocument.text-template': {
                description: 'OpenDocument Text Template document',
                extensions: ['ott']
            },
            'vnd.openxmlformats-officedocument.presentationml.presentation': {
                description: 'Microsoft PowerPoint document',
                extensions: ['pptx']
            },
            'vnd.openxmlformats-officedocument.presentationml.slide': {
                description: 'Microsoft Office - OOXML - Slide Show document',
                extensions: ['sldx']
            },
            'vnd.openxmlformats-officedocument.presentationml.slideshow': {
                description: 'Microsoft Office - OOXML - Slide Show document',
                extensions: ['ppsx']
            },
            'vnd.openxmlformats-officedocument.presentationml.template': {
                description: 'Microsoft Office - OOXML - Presentation Template document',
                extensions: ['potx']
            },
            'vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
                description: 'Microsoft Excel (OpenXML) document',
                extensions: ['xlsx']
            },
            'vnd.openxmlformats-officedocument.spreadsheetml.template': {
                description: 'Microsoft Office - OOXML - Spreadsheet Template document',
                extensions: ['xltx']
            },
            'vnd.openxmlformats-officedocument.wordprocessingml.document': {
                description: 'Microsoft Word (OpenXML) document',
                extensions: ['docx']
            },
            'vnd.openxmlformats-officedocument.wordprocessingml.template': {
                description: 'Microsoft Office - OOXML - Word Document Template document',
                extensions: ['dotx']
            },
            'vnd.rar': {
                description: 'RAR archive',
                extensions: ['rar']
            },
            'vnd.sun.xml.calc': {
                description: 'OpenOffice - Calc document',
                extensions: ['sxc']
            },
            'vnd.sun.xml.calc.template': {
                description: 'OpenOffice - Calc Template document',
                extensions: ['stc']
            },
            'vnd.sun.xml.draw': {
                description: 'OpenOffice - Draw document',
                extensions: ['sxd']
            },
            'vnd.sun.xml.draw.template': {
                description: 'OpenOffice - Draw Template document',
                extensions: ['std']
            },
            'vnd.sun.xml.impress': {
                description: 'OpenOffice - Impress document',
                extensions: ['sxi']
            },
            'vnd.sun.xml.impress.template': {
                description: 'OpenOffice - Impress Template document',
                extensions: ['sti']
            },
            'vnd.sun.xml.math': {
                description: 'OpenOffice - Math document',
                extensions: ['sxm']
            },
            'vnd.sun.xml.writer': {
                description: 'OpenOffice - Writer document',
                extensions: ['sxw']
            },
            'vnd.sun.xml.writer.global': {
                description: 'OpenOffice - Writer document',
                extensions: ['sxg']
            },
            'vnd.sun.xml.writer.template': {
                description: 'OpenOffice - Writer Template document',
                extensions: ['stw']
            },
            'vnd.visio': {
                description: 'Microsoft Visio document',
                extensions: ['vsd']
            },
            'vnd.visio2013': {
                description: 'Microsoft Visio 2013 document',
                extensions: ['vsdx']
            },
            'vnd.wap.wmlscriptc': {
                description: 'Wireless Markup Language script',
                extensions: ['wmlsc']
            },
            'winhlp': {
                description: 'WinHelp file',
                extensions: ['hlp']
            },
            'wsdl+xml': {
                description: 'Web Services Description Language file',
                extensions: ['wsdl']
            },
            'x-7z-compressed': {
                description: '7-zip archive',
                extensions: ['7z']
            },
            'x-abiword': {
                description: 'AbiWord document',
                extensions: ['abw']
            },
            'x-bittorrent': {
                description: 'BitTorrent document',
                extensions: ['torrent']
            },
            'x-bsh': {
                description: 'Unix bash script file',
                extensions: ['bsh']
            },
            'x-bzip': {
                description: 'BZip archive',
                extensions: ['bz']
            },
            'x-bzip2': {
                description: 'BZip2 archive',
                extensions: ['bz2']
            },
            'x-cdf': {
                description: 'CD audio file',
                extensions: ['cda']
            },
            'x-csh': {
                description: 'C-Shell script',
                extensions: ['csh']
            },
            'x-freearc': {
                description: 'Multi-file Archive document',
                extensions: ['arc']
            },
            'x-httpd-php': {
                description: 'Hypertext Preprocessor (Personal Home Page) file',
                extensions: ['php']
            },
            'x-java-class': {
                description: 'Java Bytecode file',
                extensions: ['class']
            },
            'xhtml+xml': {
                description: 'Extended HyperText Markup Language document',
                extensions: ['xhtm', 'xhtml']
            },
            'xml': {
                description: 'XML file',
                extensions: ['xml', 'xsd']
            },
            'x-msaccess': {
                description: 'Microsoft Access database',
                extensions: ['mdb']
            },
            'x-msdownload': {
                description: 'Microsoft Application',
                extensions: ['exe']
            },
            'x-mspublisher': {
                description: 'Microsoft Publisher document',
                extensions: ['pub']
            },
            'x-pkcs12': {
                description: 'PKCS #12 - Personal Information Exchange Syntax Standard file',
                extensions: ['p12']
            },
            'x-pkcs7-certificates': {
                description: 'PKCS #7 Certificates file',
                extensions: ['p7b']
            },
            'x-pkcs7-certreqresp': {
                description: 'PKCS #7 Certificate Request Response file',
                extensions: ['p7r']
            },
            'x-sh': {
                description: 'Bourne shell script',
                extensions: ['sh']
            },
            'x-shockwave-flash': {
                description: 'Adobe Flash',
                extensions: ['swf']
            },
            'xslt+xml': {
                description: 'XML Transformation file',
                extensions: ['xslt']
            },
            'x-tar': {
                description: 'Tape archive',
                extensions: ['tar']
            },
            'x-x509-ca-cert': {
                description: 'X.509 Certificate',
                extensions: ['der']
            },
            'zip': {
                description: 'ZIP archive',
                extensions: ['zip']
            }
        },
        'audio': {
            '3gpp': { description: '3GPP audio container file' },
            '3gpp2': { description: '3GPP2 audio container file' },
            'aac': {
                description: 'AAC audio file',
                extensions: ['aac']
            },
            'midi': {
                description: 'Musical Instrument Digital Interface file',
                extensions: ['mid', 'midi']
            },
            'mpeg': {
                description: 'MP3 audio file',
                extensions: ['mp3']
            },
            'ogg': {
                description: 'OGG audio file',
                extensions: ['oga']
            },
            'opus': {
                description: 'Opus audio file',
                extensions: ['opus']
            },
            'wav': {
                description: 'Waveform audio file',
                extensions: ['wav']
            },
            'webm': {
                description: 'WEBM audio file',
                extensions: ['weba']
            },
            'x-midi': {
                description: 'Musical Instrument Digital Interface file',
                extensions: ['mid', 'midi']
            }
        },
        'font': {
            'otf': {
                description: 'OpenType font file',
                extensions: ['otf']
            },
            'ttf': {
                description: 'TrueType font file',
                extensions: ['ttf']
            },
            'woff': {
                description: 'Web Open Font file',
                extensions: ['woff']
            },
            'woff2': {
                description: 'Web Open Font file',
                extensions: ['woff2']
            }
        },
        'image': {
            'avif': {
                description: 'AVIF image file',
                extensions: ['avif']
            },
            'bmp': {
                description: 'Windows OS/2 Bitmap graphic file',
                extensions: ['bmp']
            },
            'gif': {
                description: 'Graphics Interchange Format image file',
                extensions: ['gif']
            },
            'jpeg': {
                description: 'JPEG image file',
                extensions: ['jpeg', 'jpg']
            },
            'png': {
                description: 'Portable network graphic file',
                extensions: ['png']
            },
            'svg+xml': {
                description: 'Scalable Vector Graphics file',
                extensions: ['svg']
            },
            'tiff': {
                description: 'Tagged image file',
                extensions: ['tif', 'tiff']
            },
            'vnd.microsoft.icon': {
                description: 'Icon file',
                extensions: ['ico']
            },
            'webp': {
                description: 'WEBP image file',
                extensions: ['webp']
            },
            'x-xbitmap': {
                description: 'X BitMap image file',
                extensions: ['xbm']
            },
            'x-xpixmap': {
                description: 'X PixMap image file',
                extensions: ['xpm']
            }
        },
        'text': {
            'calendar': {
                description: 'iCalendar file',
                extensions: ['ics']
            },
            'css': {
                description: 'Cascading Style Sheet file',
                extensions: ['css']
            },
            'csv': {
                description: 'Comma-separated values file',
                extensions: ['csv']
            },
            'html': {
                description: 'HyperText Markup Language document',
                extensions: ['htm', 'html']
            },
            'javascript': {
                description: 'JavaScript file',
                extensions: ['js', 'mjs']
            },
            'plain': {
                description: 'Plain text file',
                extensions: ['bat', 'cmd', 'log', 'md', 'ps1', 'psd1', 'psm1', 'txt']
            },
            'richtext': {
                description: 'Rich Text Format file',
                extensions: ['rtx']
            },
            'tab-separated-values': {
                description: 'Tab Seperated Values file',
                extensions: ['tsv']
            },
            'vnd.wap.wml': {
                description: 'Wireless Markup Language file',
                extensions: ['wml']
            },
            'vnd.wap.wmlscript': {
                description: 'Wireless Markup Language script',
                extensions: ['wmls']
            },
            'x-java-source': {
                description: 'Java Source file',
                extensions: ['java']
            },
            'x-sgml': {
                description: 'Standard Generalized Markup Language file',
                extensions: ['sgm', 'sgml']
            },
            'xml': {
                description: 'XML file',
                extensions: ['xml', 'xsd']
            },
            'yaml': {
                description: '&quot;Yet Another Markup Language&quot; file',
                extensions: ['yaml']
            }
        },
        'video': {
            '3gpp': {
                description: '3GPP audio/video container file',
                extensions: ['3gp']
            },
            '3gpp2': {
                description: '3GPP2 audio/video container file',
                extensions: ['3g2']
            },
            'mp2t': {
                description: 'MPEG transport stream file',
                extensions: ['ts']
            },
            'mp4': {
                description: 'MP4 video file',
                extensions: ['mp4']
            },
            'mpeg': {
                description: 'MPEG Video file',
                extensions: ['mpeg']
            },
            'ogg': {
                description: 'OGG video file',
                extensions: ['ogv']
            },
            'webm': {
                description: 'WEBM video file',
                extensions: ['webm']
            },
            'x-msvideo': {
                description: 'Microsoft Audio/Video file',
                extensions: ['avi']
            }
        },
        'message': {
            'rfc822': {
                description: 'Email message',
                extensions: ['mhtm', 'mhtml']
            }
        }
    };

    const extensionMap: IExtensionMapping = {
        '3g2': { type: 'video', subType: '3gpp2', requireHash: false },
        '3gp': { type: 'video', subType: '3gpp', requireHash: false },
        '7z': { type: 'application', subType: 'x-7z-compressed', requireHash: false },
        'aac': { type: 'audio', subType: 'aac', requireHash: false },
        'abw': { type: 'application', subType: 'x-abiword', requireHash: false },
        'ai': { type: 'application', subType: 'postscript', requireHash: false },
        'apk': { type: 'application', subType: 'vnd.android.package-archive', requireHash: false },
        'arc': { type: 'application', subType: 'x-freearc', requireHash: false },
        'avi': { type: 'video', subType: 'x-msvideo', requireHash: false },
        'avif': { type: 'image', subType: 'avif', requireHash: false },
        'azw': { type: 'application', subType: 'vnd.amazon.ebook', requireHash: false },
        'bat': { type: 'text', subType: 'plain', requireHash: false, description: 'Windows Batch file' },
        'bin': { type: 'application', subType: 'octet-stream', requireHash: false },
        'bmp': { type: 'image', subType: 'bmp', requireHash: false },
        'bsh': { type: 'application', subType: 'x-bsh', requireHash: false },
        'bz': { type: 'application', subType: 'x-bzip', requireHash: false },
        'bz2': { type: 'application', subType: 'x-bzip2', requireHash: false },
        'cab': { type: 'application', subType: 'vnd.ms-cab-compressed', requireHash: false },
        'cda': { type: 'application', subType: 'x-cdf', requireHash: false },
        'cer': { type: 'application', subType: 'pkix-cert', requireHash: false },
        'chm': { type: 'application', subType: 'vnd.ms-htmlhelp', requireHash: false },
        'class': { type: 'application', subType: 'x-java-class', requireHash: false },
        'cmd': { type: 'text', subType: 'plain', requireHash: false, description: 'Windows Batch file' },
        'com': { type: 'application', subType: 'octet-stream', requireHash: true, description: 'MS-DOS Application file' },
        'csh': { type: 'application', subType: 'x-csh', requireHash: false },
        'css': { type: 'text', subType: 'css', requireHash: false },
        'csv': { type: 'text', subType: 'csv', requireHash: false },
        'der': { type: 'application', subType: 'x-x509-ca-cert', requireHash: false },
        'dll': { type: 'application', subType: 'octet-stream', requireHash: true, description: 'Windows Dynamically Linked Library file' },
        'doc': { type: 'application', subType: 'msword', requireHash: false },
        'docm': { type: 'application', subType: 'vnd.ms-word.document.macroenabled.12', requireHash: false },
        'docx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.wordprocessingml.document', requireHash: false },
        'dot': { type: 'application', subType: 'msword', requireHash: false },
        'dotm': { type: 'application', subType: 'vnd.ms-word.template.macroenabled.12', requireHash: false },
        'dotx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.wordprocessingml.template', requireHash: false },
        'eot': { type: 'application', subType: 'vnd.ms-fontobject', requireHash: false },
        'epub': { type: 'application', subType: 'epub+zip', requireHash: false },
        'exe': { type: 'application', subType: 'x-msdownload', requireHash: true, description: 'Windows Executable' },
        'gif': { type: 'image', subType: 'gif', requireHash: false },
        'gz': { type: 'application', subType: 'gzip', requireHash: false },
        'hlp': { type: 'application', subType: 'winhlp', requireHash: false },
        'htm': { type: 'text', subType: 'html', requireHash: false },
        'html': { type: 'text', subType: 'html', requireHash: false },
        'ico': { type: 'image', subType: 'vnd.microsoft.icon', requireHash: false },
        'ics': { type: 'text', subType: 'calendar', requireHash: false },
        'jar': { type: 'application', subType: 'java-archive', requireHash: false },
        'java': { type: 'text', subType: 'x-java-source', requireHash: false },
        'jpeg': { type: 'image', subType: 'jpeg', requireHash: false },
        'jpg': { type: 'image', subType: 'jpeg', requireHash: false },
        'js': { type: 'text', subType: 'javascript', requireHash: false },
        'json': { type: 'application', subType: 'json', requireHash: false },
        'jsonld': { type: 'application', subType: 'ld+json', requireHash: false },
        'log': { type: 'text', subType: 'plain', requireHash: false, description: 'Log file' },
        'md': { type: 'text', subType: 'plain', requireHash: false, description: 'Markdown document' },
        'mdb': { type: 'application', subType: 'x-msaccess', requireHash: false },
        'mhtm': { type: 'message', subType: 'rfc822', requireHash: false },
        'mhtml': { type: 'message', subType: 'rfc822', requireHash: false },
        'mid': { type: 'audio', subType: 'x-midi', requireHash: false },
        'midi': { type: 'audio', subType: 'x-midi', requireHash: false },
        'mjs': { type: 'text', subType: 'javascript', requireHash: false },
        'mp3': { type: 'audio', subType: 'mpeg', requireHash: false },
        'mp4': { type: 'video', subType: 'mp4', requireHash: false },
        'mpeg': { type: 'video', subType: 'mpeg', requireHash: false },
        'mpkg': { type: 'application', subType: 'vnd.apple.installer+xml', requireHash: false },
        'mpp': { type: 'application', subType: 'vnd.ms-project', requireHash: false },
        'msi': { type: 'application', subType: 'octet-stream', requireHash: true, description: 'Microsoft Installer file' },
        'odb': { type: 'application', subType: 'vnd.oasis.opendocument.database', requireHash: false },
        'odc': { type: 'application', subType: 'vnd.oasis.opendocument.chart', requireHash: false },
        'odf': { type: 'application', subType: 'vnd.oasis.opendocument.formula', requireHash: false },
        'odft': { type: 'application', subType: 'vnd.oasis.opendocument.formula-template', requireHash: false },
        'odg': { type: 'application', subType: 'vnd.oasis.opendocument.graphics', requireHash: false },
        'odi': { type: 'application', subType: 'vnd.oasis.opendocument.image', requireHash: false },
        'odm': { type: 'application', subType: 'vnd.oasis.opendocument.text-master', requireHash: false },
        'odp': { type: 'application', subType: 'vnd.oasis.opendocument.presentation', requireHash: false },
        'ods': { type: 'application', subType: 'vnd.oasis.opendocument.spreadsheet', requireHash: false },
        'odt': { type: 'application', subType: 'vnd.oasis.opendocument.text', requireHash: false },
        'oga': { type: 'audio', subType: 'ogg', requireHash: false },
        'ogv': { type: 'video', subType: 'ogg', requireHash: false },
        'ogx': { type: 'application', subType: 'ogg', requireHash: false },
        'opus': { type: 'audio', subType: 'opus', requireHash: false },
        'otc': { type: 'application', subType: 'vnd.oasis.opendocument.chart-template', requireHash: false },
        'otf': { type: 'font', subType: 'otf', requireHash: false },
        'otg': { type: 'application', subType: 'vnd.oasis.opendocument.graphics-template', requireHash: false },
        'oti': { type: 'application', subType: 'vnd.oasis.opendocument.image-template', requireHash: false },
        'otp': { type: 'application', subType: 'vnd.oasis.opendocument.presentation-template', requireHash: false },
        'ots': { type: 'application', subType: 'vnd.oasis.opendocument.spreadsheet-template', requireHash: false },
        'ott': { type: 'application', subType: 'vnd.oasis.opendocument.text-template', requireHash: false },
        'p10': { type: 'application', subType: 'pkcs10', requireHash: false },
        'p12': { type: 'application', subType: 'x-pkcs12', requireHash: false },
        'p7b': { type: 'application', subType: 'x-pkcs7-certificates', requireHash: false },
        'p7m': { type: 'application', subType: 'pkcs7-mime', requireHash: false },
        'p7r': { type: 'application', subType: 'x-pkcs7-certreqresp', requireHash: false },
        'p7s': { type: 'application', subType: 'pkcs7-signature', requireHash: false },
        'p8': { type: 'application', subType: 'pkcs8', requireHash: false },
        'pdf': { type: 'application', subType: 'pdf', requireHash: false },
        'php': { type: 'application', subType: 'x-httpd-php', requireHash: false },
        'pki': { type: 'application', subType: 'pkixcmp', requireHash: false },
        'png': { type: 'image', subType: 'png', requireHash: false },
        'potm': { type: 'application', subType: 'vnd.ms-powerpoint.template.macroenabled.12', requireHash: false },
        'potx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.presentationml.template', requireHash: false },
        'ppam': { type: 'application', subType: 'vnd.ms-powerpoint.addin.macroenabled.12', requireHash: false },
        'pps': { type: 'application', subType: 'vnd.ms-powerpoint', requireHash: false },
        'ppsm': { type: 'application', subType: 'vnd.ms-powerpoint.slideshow.macroenabled.12', requireHash: false },
        'ppsx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.presentationml.slideshow', requireHash: false },
        'ppt': { type: 'application', subType: 'vnd.ms-powerpoint', requireHash: false },
        'pptm': { type: 'application', subType: 'vnd.ms-powerpoint.presentation.macroenabled.12', requireHash: false },
        'pptx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.presentationml.presentation', requireHash: false },
        'ppz': { type: 'application', subType: 'vnd.ms-powerpoint', requireHash: false },
        'ps1': { type: 'text', subType: 'plain', requireHash: false, description: 'PowerShell Script' },
        'psd1': { type: 'text', subType: 'plain', requireHash: false, description: 'PowerShell Module Manifest' },
        'psm1': { type: 'text', subType: 'plain', requireHash: false, description: 'PowerShell Module Script' },
        'pub': { type: 'application', subType: 'x-mspublisher', requireHash: false },
        'rar': { type: 'application', subType: 'vnd.rar', requireHash: false },
        'rtf': { type: 'application', subType: 'rtf', requireHash: false },
        'rtx': { type: 'text', subType: 'richtext', requireHash: false },
        'sgm': { type: 'text', subType: 'x-sgml', requireHash: false },
        'sgml': { type: 'text', subType: 'x-sgml', requireHash: false },
        'sh': { type: 'application', subType: 'x-sh', requireHash: false },
        'sldm': { type: 'application', subType: 'vnd.ms-powerpoint.slide.macroenabled.12', requireHash: false },
        'sldx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.presentationml.slide', requireHash: false },
        'stc': { type: 'application', subType: 'vnd.sun.xml.calc.template', requireHash: false },
        'std': { type: 'application', subType: 'vnd.sun.xml.draw.template', requireHash: false },
        'sti': { type: 'application', subType: 'vnd.sun.xml.impress.template', requireHash: false },
        'stw': { type: 'application', subType: 'vnd.sun.xml.writer.template', requireHash: false },
        'svg': { type: 'image', subType: 'svg+xml', requireHash: false },
        'swf': { type: 'application', subType: 'x-shockwave-flash', requireHash: false },
        'sxc': { type: 'application', subType: 'vnd.sun.xml.calc', requireHash: false },
        'sxd': { type: 'application', subType: 'vnd.sun.xml.draw', requireHash: false },
        'sxg': { type: 'application', subType: 'vnd.sun.xml.writer.global', requireHash: false },
        'sxi': { type: 'application', subType: 'vnd.sun.xml.impress', requireHash: false },
        'sxm': { type: 'application', subType: 'vnd.sun.xml.math', requireHash: false },
        'sxw': { type: 'application', subType: 'vnd.sun.xml.writer', requireHash: false },
        'tar': { type: 'application', subType: 'x-tar', requireHash: false },
        'tif': { type: 'image', subType: 'tiff', requireHash: false },
        'tiff': { type: 'image', subType: 'tiff', requireHash: false },
        'torrent': { type: 'application', subType: 'x-bittorrent', requireHash: false },
        'ts': { type: 'video', subType: 'mp2t', requireHash: false },
        'tsv': { type: 'text', subType: 'tab-separated-values', requireHash: false },
        'ttf': { type: 'font', subType: 'ttf', requireHash: false },
        'txt': { type: 'text', subType: 'plain', requireHash: false },
        'vsd': { type: 'application', subType: 'vnd.visio', requireHash: false },
        'vsdx': { type: 'application', subType: 'vnd.visio2013', requireHash: false },
        'wav': { type: 'audio', subType: 'wav', requireHash: false },
        'weba': { type: 'audio', subType: 'webm', requireHash: false },
        'webm': { type: 'video', subType: 'webm', requireHash: false },
        'webp': { type: 'image', subType: 'webp', requireHash: false },
        'wml': { type: 'text', subType: 'vnd.wap.wml', requireHash: false },
        'wmls': { type: 'text', subType: 'vnd.wap.wmlscript', requireHash: false },
        'wmlsc': { type: 'application', subType: 'vnd.wap.wmlscriptc', requireHash: false },
        'woff': { type: 'font', subType: 'woff', requireHash: false },
        'woff2': { type: 'font', subType: 'woff2', requireHash: false },
        'wsdl': { type: 'application', subType: 'wsdl+xml', requireHash: false },
        'xbm': { type: 'image', subType: 'x-xbitmap', requireHash: false },
        'xhtm': { type: 'application', subType: 'xhtml+xml', requireHash: false },
        'xhtml': { type: 'application', subType: 'xhtml+xml', requireHash: false },
        'xls': { type: 'application', subType: 'vnd.ms-excel', requireHash: false },
        'xlsx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet', requireHash: false },
        'xltx': { type: 'application', subType: 'vnd.openxmlformats-officedocument.spreadsheetml.template', requireHash: false },
        'xml': { type: 'text', subType: 'xml', requireHash: false },
        'xpm': { type: 'image', subType: 'x-xpixmap', requireHash: false },
        'xps': { type: 'application', subType: 'vnd.ms-xpsdocument', requireHash: false },
        'xsd': { type: 'text', subType: 'xml', requireHash: false, description: 'XML Schema Definitionn file' },
        'xslt': { type: 'application', subType: 'xslt+xml', requireHash: false },
        'xul': { type: 'application', subType: 'vnd.mozilla.xul+xml', requireHash: false },
        'yaml': { type: 'text', subType: 'yaml', requireHash: false },
        'zip': { type: 'application', subType: 'zip', requireHash: false }
    };
    
    var c = this;
    c.data.systemOptions = ['none', 'JCON', 'BLK', 'DEV', 'RED', 'MEDIA'].map(function(value: SYSTEM_OPTION): ISystemItem {
        return { key: value, display: systemsMap[pm].display };
    });
    c.data.selectedSourceSystem = c.data.systemOptions[0];
    c.data.selectedTargetSystem = c.data.systemOptions[0];
    c.data.isRoutineRequest = false;
    c.data.smeReviewerName = '';
    c.data.justification = '';
    c.data.stagingFolderPath = '';
    for (var sysOptKey in systemOptions) {
        c.data.sourceSystems.push(systemOptions[i]);
        c.data.targetSystems.push(systemOptions[i]);
    }
    c.data.sourceFiles = [];

    c.onSelectedSourceSystemChanged = function(this: IFtrController): void {
    };

    c.onSelectedTargetSystemChanged = function(this: IFtrController): void {
    };

    c.onJustificationChanged = function(this: IFtrController): void {
    };

    c.onStagingFolderChanged = function(this: IFtrController): void {
    };
};
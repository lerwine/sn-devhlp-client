<#
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#>
<#
Add-Type -TypeDefinition @'
// Copyright (c) Damien Guard.  All rights reserved.
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. 
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Originally published at http://damieng.com/blog/2007/11/19/calculating-crc-64-in-c-and-net

namespace DamienG.Security.Cryptography
{
    using System;
    using System.Collections.Generic;
    using System.Security.Cryptography;

    /// <summary>
    /// Implements a 64-bit CRC hash algorithm for a given polynomial.
    /// </summary>
    /// <remarks>
    /// For ISO 3309 compliant 64-bit CRC's use Crc64Iso.
    /// </remarks>
    public class Crc64 : HashAlgorithm
    {
        public const UInt64 DefaultSeed = 0x0;

        readonly UInt64[] table;

        readonly UInt64 seed;
        UInt64 hash;

        public Crc64(UInt64 polynomial)
            :  this(polynomial, DefaultSeed)
        {
        }

        public Crc64(UInt64 polynomial, UInt64 seed)
        {
            if (!BitConverter.IsLittleEndian)
                throw new PlatformNotSupportedException("Not supported on Big Endian processors");

            table = InitializeTable(polynomial);
            this.seed = hash = seed;
        }

        public override void Initialize()
        {
            hash = seed;
        }

        protected override void HashCore(byte[] array, int ibStart, int cbSize)
        {
            hash = CalculateHash(hash, table, array, ibStart, cbSize);
        }

        protected override byte[] HashFinal()
        {
            var hashBuffer = UInt64ToBigEndianBytes(hash);
            HashValue = hashBuffer;
            return hashBuffer;
        }

        public override int HashSize { get { return 64; } }

        protected static UInt64 CalculateHash(UInt64 seed, UInt64[] table, IList<byte> buffer, int start, int size)
        {
            var hash = seed;
            for (var i = start; i < start + size; i++)
                unchecked
                {
                    hash = (hash >> 8) ^ table[(buffer[i] ^ hash) & 0xff];
                }
            return hash;
        }

        static byte[] UInt64ToBigEndianBytes(UInt64 value)
        {
            var result = BitConverter.GetBytes(value);

            if (BitConverter.IsLittleEndian)
                Array.Reverse(result);

            return result;
        }

        static UInt64[] InitializeTable(UInt64 polynomial)
        {
            if (polynomial == Crc64Iso.Iso3309Polynomial && Crc64Iso.Table != null)
                return Crc64Iso.Table;

            var createTable = CreateTable(polynomial);

            if (polynomial == Crc64Iso.Iso3309Polynomial)
                Crc64Iso.Table = createTable;

            return createTable;
        }

        protected static ulong[] CreateTable(ulong polynomial)
        {
            var createTable = new UInt64[256];
            for (var i = 0; i < 256; ++i)
            {
                var entry = (UInt64) i;
                for (var j = 0; j < 8; ++j)
                    if ((entry & 1) == 1)
                        entry = (entry >> 1) ^ polynomial;
                    else
                        entry >>= 1;
                createTable[i] = entry;
            }
            return createTable;
        }
    }

    public class Crc64Iso : Crc64
    {
        internal static UInt64[] Table;

        public static List<UInt64> GetTable() { return new List<UInt64>(Table); }

        public const UInt64 Iso3309Polynomial = 0xD800000000000000;

        public Crc64Iso()
            : base(Iso3309Polynomial)
        {
        }

        public Crc64Iso(UInt64 seed)
            : base(Iso3309Polynomial, seed)
        {
        }

        public static UInt64 Compute(byte[] buffer)
        {
            return Compute(DefaultSeed, buffer);
        }

        public static UInt64 Compute(UInt64 seed, byte[] buffer)
        {
            if (Table == null)
                Table = CreateTable(Iso3309Polynomial);

            return CalculateHash(seed, Table, buffer, 0, buffer.Length);
        }
    }
}
'@ -ErrorAction Stop;
#>

Function Get-Crc64Hash {
    Param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Text
    )
    if ($null -eq $Script:__Get_Crc64Hash_Table) {
        $Script:__Get_Crc64Hash_Table = New-Object -TypeName 'UInt16[]' -ArgumentList 256;
        for ($i = 0; $i -lt 256; ++$i) {
            $entry = [UInt16]$i;
            for ($j = 0; $j -lt 8; ++$j) {
                if (($entry -band 1) -eq 1) {
                    $entry = ($entry -shr 1) -bxor [Crc64Hash]::Iso3309Polynomial;
                } else {
                    $entry = $entry -shr 1;
                }
            }
            $Script:__Get_Crc64Hash_Table[$i] = $entry;
        }
    }
    
    [byte[]]$buffer = @($Text.ToCharArray());
    [byte[]]$Hash = @(0, 0, 0, 0, 0, 0, 0, 0);
    foreach ($c in $Text.ToCharArray()) {
        $idx = ([UInt32]$c -band 0xff) -bxor $Hash[0];
        $v = $Script:__Get_Crc64Hash_Table[$idx];
        $Hash = $Hash[1..6] + @(($Hash[7] -bxor ($v -band 0xff)), ($v -shr 8));
    }
    return [BitConverter]::ToUInt64($Hash, 0);
}

$NonAlphaNumCaption = 'Whitespace Option';
$NonAlphaNumPrompt = 'Select non-aplha-numeric option or "Q" to exit.';
$NonAlphaNumChoices = [System.Collections.ObjectModel.Collection[System.Management.Automation.Host.ChoiceDescription]]::new([System.Management.Automation.Host.ChoiceDescription[]]@(
    [System.Management.Automation.Host.ChoiceDescription]::new('None'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Whitespace'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Ignore'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Q')
));

$WhiteSpaceCaption = 'Whitespace Option';
$WhiteSpacePrompt = 'Select white-space option or "Q" to exit.';
$WhiteSpaceChoices = [System.Collections.ObjectModel.Collection[System.Management.Automation.Host.ChoiceDescription]]::new([System.Management.Automation.Host.ChoiceDescription[]]@(
    [System.Management.Automation.Host.ChoiceDescription]::new('None'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Trim'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Normalize'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Ignore'),
    [System.Management.Automation.Host.ChoiceDescription]::new('Q')
));
$IgnoreCaseCaption = 'Case';
$IgnoreCasePrompt = 'Ignore Case?';
$YesNoChoices = [System.Collections.ObjectModel.Collection[System.Management.Automation.Host.ChoiceDescription]]::new([System.Management.Automation.Host.ChoiceDescription[]]@(
    [System.Management.Automation.Host.ChoiceDescription]::new('Yes'),
    [System.Management.Automation.Host.ChoiceDescription]::new('No')
));
$IgnoreCaseCaption = 'NonAlphaNum';
$IgnoreCasePrompt = 'Ignore Case ("Q" to exit)?';

$NonAlphaNumOption = $Host.UI.PromptForChoice($NonAlphaNumCaption, $NonAlphaNumPrompt, $NonAlphaNumChoices, 0);
if ($NonAlphaNumOption -gt 2) { return }
$IgnoreCase = $Host.UI.PromptForChoice($IgnoreCaseCaption, $IgnoreCasePrompt, $YesNoChoices, 1) -eq 0;
$WhiteSpaceOption = $Host.UI.PromptForChoice($WhiteSpaceCaption, $WhiteSpacePrompt, $WhiteSpaceChoices, 0);

while ($WhiteSpaceOption -lt 4) {
    $InputPrompt = 'Source Text (blank to quit)';
    $str = Read-Host -Prompt $InputPrompt;
    while (-not [string]::IsNullOrEmpty($str)) {
        switch ($NonAlphaNumOption) {
            1 { # Whitespace
                $str = [System.Text.RegularExpressions.Regex]::Replace($str, '[^a-zA-Z\d\s]+', ' ');
                break;
            }
            2 { # Ignore
                $str = [System.Text.RegularExpressions.Regex]::Replace($str, '[^a-zA-Z\d\s]+', '');
                break;
            }
        }
        switch ($WhiteSpaceOption) {
            1 { # Trim
                $str = $str.Trim();
                break;
            }
            2 { # Normalize
                $str = [System.Text.RegularExpressions.Regex]::Replace($str.Trim(), '\s+', ' ');
                break;
            }
            3 { # Ignore
                $str = [System.Text.RegularExpressions.Regex]::Replace($str.Trim(), '\s+', '');
                break;
            }
        }
        if ($IgnoreCase) { $str = $str.ToLower() }
        $C = (Get-Crc64Hash -Text $str).ToString('x16');
        "$($C.Subtring(0, 4))-$($C.Subtring(4, 4))-$($C.Subtring(8, 4))-$($C.Subtring(12))";
        $str = Read-Host -Prompt $InputPrompt;
    }
    $NonAlphaNumOption = $Host.UI.PromptForChoice($NonAlphaNumCaption, $NonAlphaNumPrompt, $NonAlphaNumChoices, 0);
    if ($NonAlphaNumOption -gt 2) { break }
    $IgnoreCase = $Host.UI.PromptForChoice($IgnoreCaseCaption, $IgnoreCasePrompt, $YesNoChoices, 1) -eq 0;
    $WhiteSpaceOption = $Host.UI.PromptForChoice($WhiteSpaceCaption, $WhiteSpacePrompt, $WhiteSpaceChoices, 0);
} 
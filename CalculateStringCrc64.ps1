﻿<#
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
#>
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

class JsHash {
    static [UInt16]$Iso3309Polynomial = 0xD800;
    hidden static [UInt16[]]$Table;
    static [UInt64] CalculateHash([UInt64]$seed, [UInt16[]]$table, [System.Collections.Generic.IList[byte]]$buffer, [int]$start, [int]$size) {
        [UInt16]$w0 = $seed -band 0xffff;
        [UInt16]$w1 = ($seed -shr 16) -band 0xffff;
        [UInt16]$w2 = ($seed -shr 32) -band 0xffff;
        [UInt16]$w3 = ($seed -shr 48) -band 0xffff;
        for ($i = $start; $i -lt $start + $size; $i++) {
            $idx = ($buffer[$i] -bxor $w0) -band 0xff;
            $w0 = ($w0 -shr 8) -bor (($w1 -band 0xff) -shl 8);
            $w1 = ($w1 -shr 8) -bor (($w2 -band 0xff) -shl 8);
            $w2 = ($w2 -shr 8) -bor (($w3 -band 0xff) -shl 8);
            $w3 = ($w3 -shr 8) -bxor $table[$idx];
        }
        return ([UInt64]$w0) -bor (([UInt64]$w1) -shl 16) -bor (([UInt64]$w2) -shl 32) -bor (([UInt64]$w3) -shl 48);
    }

    static [UInt64] GetHash([string]$Text) {
        [byte[]]$Bytes = @($Text.ToCharArray());
        return [JsHash]::Compute($Bytes);
    }

    static [UInt64] Compute([byte[]]$buffer) {
        if ($null -eq [JsHash]::Table) {
            [JsHash]::Table = New-Object -TypeName 'UInt16[]' -ArgumentList 256;
            for ($i = 0; $i -lt 256; ++$i) {
                $entry = [UInt16]$i;
                for ($j = 0; $j -lt 8; ++$j) {
                    if (($entry -band 1) -eq 1) {
                        $entry = ($entry -shr 1) -bxor [JsHash]::Iso3309Polynomial;
                    } else {
                        $entry = $entry -shr 1;
                    }
                }
                [JsHash]::Table[$i] = $entry;
            }
        }
        return [JsHash]::CalculateHash(0x0, [JsHash]::Table, $buffer, 0, $buffer.Length);
    }
}
class Hash64 {
    static [UInt64]$Iso3309Polynomial = (([UInt64]0xD800) -shl 48);
    hidden static [UInt64[]]$Table;
    static [UInt64] CalculateHash([UInt64]$seed, [UInt64[]]$table, [System.Collections.Generic.IList[byte]]$buffer, [int]$start, [int]$size) {
        $h = $seed;
        for ($i = $start; $i -lt $start + $size; $i++) {
            $h = ($h -shr 8) -bxor $table[($buffer[$i] -bxor $h) -band 0xff];
        }
        return $h;
    }

    static [byte[]] UInt64ToBigEndianBytes([UInt64]$value)
    {
        $result = [BitConverter]::GetBytes($value);

        if ([BitConverter]::IsLittleEndian) { [Array]::Reverse($result) }
        return $result;
    }

    static [UInt64] GetHash([string]$Text) {
        [byte[]]$Bytes = @($Text.ToCharArray());
        return [Hash64]::Compute($Bytes);
    }

    static [UInt64] Compute([byte[]]$buffer) {
        if ($null -eq [Hash64]::Table) {
            [Hash64]::Table = New-Object -TypeName 'UInt64[]' -ArgumentList 256;
            for ($i = 0; $i -lt 256; ++$i) {
                $entry = [UInt64]$i;
                for ($j = 0; $j -lt 8; ++$j) {
                    if (($entry -band 1) -eq 1) {
                        $entry = ($entry -shr 1) -bxor [Hash64]::Iso3309Polynomial;
                    } else {
                        $entry = $entry -shr 1;
                    }
                }
                [Hash64]::Table[$i] = $entry;
            }
        }
        return [Hash64]::CalculateHash(0x0, [Hash64]::Table, $buffer, 0, $buffer.Length);
    }
    <#

    #>
}
<#
$IsoCompliantTable = New-Object -TypeName 'System.UInt64[]' -ArgumentList 256;
$polynomial = ([System.UInt64]0xD800) -shl 48;
$polynomial = [System.UInt64]0xD800;
for ($i = 0; $i -lt 256; $i++)
{
    [UInt64]$entry = $i;
    for ($j = 0; $j -lt 8; ++$j) {
        if (($entry -band 1) -eq 1) {
            $entry = ($entry -shr 1) -bxor $polynomial;
        } else {
            $entry = $entry -shr 1;
        }
    }
    $IsoCompliantTable[$i] = $entry;
}
#>
[int[]]$crcTable0 = @(
    0x00000000, 0xA9EA3693, 0x53D46D26, 0xFA3E5BB5, 0x0E42ECDF, 0xA7A8DA4C, 0x5D9681F9, 0xF47CB76A, 
	0x1C85D9BE, 0xB56FEF2D, 0x4F51B498, 0xE6BB820B, 0x12C73561, 0xBB2D03F2, 0x41135847, 0xE8F96ED4, 
	0x90E185EF, 0x390BB37C, 0xC335E8C9, 0x6ADFDE5A, 0x9EA36930, 0x37495FA3, 0xCD770416, 0x649D3285, 
	0x8C645C51, 0x258E6AC2, 0xDFB03177, 0x765A07E4, 0x8226B08E, 0x2BCC861D, 0xD1F2DDA8, 0x7818EB3B, 
	0x21C30BDE, 0x88293D4D, 0x721766F8, 0xDBFD506B, 0x2F81E701, 0x866BD192, 0x7C558A27, 0xD5BFBCB4, 
	0x3D46D260, 0x94ACE4F3, 0x6E92BF46, 0xC77889D5, 0x33043EBF, 0x9AEE082C, 0x60D05399, 0xC93A650A, 
	0xB1228E31, 0x18C8B8A2, 0xE2F6E317, 0x4B1CD584, 0xBF6062EE, 0x168A547D, 0xECB40FC8, 0x455E395B, 
	0xADA7578F, 0x044D611C, 0xFE733AA9, 0x57990C3A, 0xA3E5BB50, 0x0A0F8DC3, 0xF031D676, 0x59DBE0E5, 
	0xEA6C212F, 0x438617BC, 0xB9B84C09, 0x10527A9A, 0xE42ECDF0, 0x4DC4FB63, 0xB7FAA0D6, 0x1E109645, 
	0xF6E9F891, 0x5F03CE02, 0xA53D95B7, 0x0CD7A324, 0xF8AB144E, 0x514122DD, 0xAB7F7968, 0x02954FFB, 
	0x7A8DA4C0, 0xD3679253, 0x2959C9E6, 0x80B3FF75, 0x74CF481F, 0xDD257E8C, 0x271B2539, 0x8EF113AA, 
	0x66087D7E, 0xCFE24BED, 0x35DC1058, 0x9C3626CB, 0x684A91A1, 0xC1A0A732, 0x3B9EFC87, 0x9274CA14, 
	0xCBAF2AF1, 0x62451C62, 0x987B47D7, 0x31917144, 0xC5EDC62E, 0x6C07F0BD, 0x9639AB08, 0x3FD39D9B, 
	0xD72AF34F, 0x7EC0C5DC, 0x84FE9E69, 0x2D14A8FA, 0xD9681F90, 0x70822903, 0x8ABC72B6, 0x23564425, 
	0x5B4EAF1E, 0xF2A4998D, 0x089AC238, 0xA170F4AB, 0x550C43C1, 0xFCE67552, 0x06D82EE7, 0xAF321874, 
	0x47CB76A0, 0xEE214033, 0x141F1B86, 0xBDF52D15, 0x49899A7F, 0xE063ACEC, 0x1A5DF759, 0xB3B7C1CA, 
	0x7D3274CD, 0xD4D8425E, 0x2EE619EB, 0x870C2F78, 0x73709812, 0xDA9AAE81, 0x20A4F534, 0x894EC3A7, 
	0x61B7AD73, 0xC85D9BE0, 0x3263C055, 0x9B89F6C6, 0x6FF541AC, 0xC61F773F, 0x3C212C8A, 0x95CB1A19, 
	0xEDD3F122, 0x4439C7B1, 0xBE079C04, 0x17EDAA97, 0xE3911DFD, 0x4A7B2B6E, 0xB04570DB, 0x19AF4648, 
	0xF156289C, 0x58BC1E0F, 0xA28245BA, 0x0B687329, 0xFF14C443, 0x56FEF2D0, 0xACC0A965, 0x052A9FF6, 
	0x5CF17F13, 0xF51B4980, 0x0F251235, 0xA6CF24A6, 0x52B393CC, 0xFB59A55F, 0x0167FEEA, 0xA88DC879, 
	0x4074A6AD, 0xE99E903E, 0x13A0CB8B, 0xBA4AFD18, 0x4E364A72, 0xE7DC7CE1, 0x1DE22754, 0xB40811C7, 
	0xCC10FAFC, 0x65FACC6F, 0x9FC497DA, 0x362EA149, 0xC2521623, 0x6BB820B0, 0x91867B05, 0x386C4D96, 
	0xD0952342, 0x797F15D1, 0x83414E64, 0x2AAB78F7, 0xDED7CF9D, 0x773DF90E, 0x8D03A2BB, 0x24E99428, 
	0x975E55E2, 0x3EB46371, 0xC48A38C4, 0x6D600E57, 0x991CB93D, 0x30F68FAE, 0xCAC8D41B, 0x6322E288, 
	0x8BDB8C5C, 0x2231BACF, 0xD80FE17A, 0x71E5D7E9, 0x85996083, 0x2C735610, 0xD64D0DA5, 0x7FA73B36, 
	0x07BFD00D, 0xAE55E69E, 0x546BBD2B, 0xFD818BB8, 0x09FD3CD2, 0xA0170A41, 0x5A2951F4, 0xF3C36767, 
	0x1B3A09B3, 0xB2D03F20, 0x48EE6495, 0xE1045206, 0x1578E56C, 0xBC92D3FF, 0x46AC884A, 0xEF46BED9, 
	0xB69D5E3C, 0x1F7768AF, 0xE549331A, 0x4CA30589, 0xB8DFB2E3, 0x11358470, 0xEB0BDFC5, 0x42E1E956, 
	0xAA188782, 0x03F2B111, 0xF9CCEAA4, 0x5026DC37, 0xA45A6B5D, 0x0DB05DCE, 0xF78E067B, 0x5E6430E8, 
	0x267CDBD3, 0x8F96ED40, 0x75A8B6F5, 0xDC428066, 0x283E370C, 0x81D4019F, 0x7BEA5A2A, 0xD2006CB9, 
	0x3AF9026D, 0x931334FE, 0x692D6F4B, 0xC0C759D8, 0x34BBEEB2, 0x9D51D821, 0x676F8394, 0xCE85B507
);
[int[]]$crcTable1 = @(
    0x00000000, 0x42F0E1EB, 0x85E1C3D7, 0xC711223C, 0x49336645, 0x0BC387AE, 0xCCD2A592, 0x8E224479, 
	0x9266CC8A, 0xD0962D61, 0x17870F5D, 0x5577EEB6, 0xDB55AACF, 0x99A54B24, 0x5EB46918, 0x1C4488F3, 
	0x663D78FF, 0x24CD9914, 0xE3DCBB28, 0xA12C5AC3, 0x2F0E1EBA, 0x6DFEFF51, 0xAAEFDD6D, 0xE81F3C86, 
	0xF45BB475, 0xB6AB559E, 0x71BA77A2, 0x334A9649, 0xBD68D230, 0xFF9833DB, 0x388911E7, 0x7A79F00C, 
	0xCC7AF1FF, 0x8E8A1014, 0x499B3228, 0x0B6BD3C3, 0x854997BA, 0xC7B97651, 0x00A8546D, 0x4258B586, 
	0x5E1C3D75, 0x1CECDC9E, 0xDBFDFEA2, 0x990D1F49, 0x172F5B30, 0x55DFBADB, 0x92CE98E7, 0xD03E790C, 
	0xAA478900, 0xE8B768EB, 0x2FA64AD7, 0x6D56AB3C, 0xE374EF45, 0xA1840EAE, 0x66952C92, 0x2465CD79, 
	0x3821458A, 0x7AD1A461, 0xBDC0865D, 0xFF3067B6, 0x711223CF, 0x33E2C224, 0xF4F3E018, 0xB60301F3, 
	0xDA050215, 0x98F5E3FE, 0x5FE4C1C2, 0x1D142029, 0x93366450, 0xD1C685BB, 0x16D7A787, 0x5427466C, 
	0x4863CE9F, 0x0A932F74, 0xCD820D48, 0x8F72ECA3, 0x0150A8DA, 0x43A04931, 0x84B16B0D, 0xC6418AE6, 
	0xBC387AEA, 0xFEC89B01, 0x39D9B93D, 0x7B2958D6, 0xF50B1CAF, 0xB7FBFD44, 0x70EADF78, 0x321A3E93, 
	0x2E5EB660, 0x6CAE578B, 0xABBF75B7, 0xE94F945C, 0x676DD025, 0x259D31CE, 0xE28C13F2, 0xA07CF219, 
	0x167FF3EA, 0x548F1201, 0x939E303D, 0xD16ED1D6, 0x5F4C95AF, 0x1DBC7444, 0xDAAD5678, 0x985DB793, 
	0x84193F60, 0xC6E9DE8B, 0x01F8FCB7, 0x43081D5C, 0xCD2A5925, 0x8FDAB8CE, 0x48CB9AF2, 0x0A3B7B19, 
	0x70428B15, 0x32B26AFE, 0xF5A348C2, 0xB753A929, 0x3971ED50, 0x7B810CBB, 0xBC902E87, 0xFE60CF6C, 
	0xE224479F, 0xA0D4A674, 0x67C58448, 0x253565A3, 0xAB1721DA, 0xE9E7C031, 0x2EF6E20D, 0x6C0603E6, 
	0xF6FAE5C0, 0xB40A042B, 0x731B2617, 0x31EBC7FC, 0xBFC98385, 0xFD39626E, 0x3A284052, 0x78D8A1B9, 
	0x649C294A, 0x266CC8A1, 0xE17DEA9D, 0xA38D0B76, 0x2DAF4F0F, 0x6F5FAEE4, 0xA84E8CD8, 0xEABE6D33, 
	0x90C79D3F, 0xD2377CD4, 0x15265EE8, 0x57D6BF03, 0xD9F4FB7A, 0x9B041A91, 0x5C1538AD, 0x1EE5D946, 
	0x02A151B5, 0x4051B05E, 0x87409262, 0xC5B07389, 0x4B9237F0, 0x0962D61B, 0xCE73F427, 0x8C8315CC, 
	0x3A80143F, 0x7870F5D4, 0xBF61D7E8, 0xFD913603, 0x73B3727A, 0x31439391, 0xF652B1AD, 0xB4A25046, 
	0xA8E6D8B5, 0xEA16395E, 0x2D071B62, 0x6FF7FA89, 0xE1D5BEF0, 0xA3255F1B, 0x64347D27, 0x26C49CCC, 
	0x5CBD6CC0, 0x1E4D8D2B, 0xD95CAF17, 0x9BAC4EFC, 0x158E0A85, 0x577EEB6E, 0x906FC952, 0xD29F28B9, 
	0xCEDBA04A, 0x8C2B41A1, 0x4B3A639D, 0x09CA8276, 0x87E8C60F, 0xC51827E4, 0x020905D8, 0x40F9E433, 
	0x2CFFE7D5, 0x6E0F063E, 0xA91E2402, 0xEBEEC5E9, 0x65CC8190, 0x273C607B, 0xE02D4247, 0xA2DDA3AC, 
	0xBE992B5F, 0xFC69CAB4, 0x3B78E888, 0x79880963, 0xF7AA4D1A, 0xB55AACF1, 0x724B8ECD, 0x30BB6F26, 
	0x4AC29F2A, 0x08327EC1, 0xCF235CFD, 0x8DD3BD16, 0x03F1F96F, 0x41011884, 0x86103AB8, 0xC4E0DB53, 
	0xD8A453A0, 0x9A54B24B, 0x5D459077, 0x1FB5719C, 0x919735E5, 0xD367D40E, 0x1476F632, 0x568617D9, 
	0xE085162A, 0xA275F7C1, 0x6564D5FD, 0x27943416, 0xA9B6706F, 0xEB469184, 0x2C57B3B8, 0x6EA75253, 
	0x72E3DAA0, 0x30133B4B, 0xF7021977, 0xB5F2F89C, 0x3BD0BCE5, 0x79205D0E, 0xBE317F32, 0xFCC19ED9, 
	0x86B86ED5, 0xC4488F3E, 0x0359AD02, 0x41A94CE9, 0xCF8B0890, 0x8D7BE97B, 0x4A6ACB47, 0x089A2AAC, 
	0x14DEA25F, 0x562E43B4, 0x913F6188, 0xD3CF8063, 0x5DEDC41A, 0x1F1D25F1, 0xD80C07CD, 0x9AFCE626
);

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
        [JsHash]::GetHash($str).ToString('x16');
        [byte[]]$Bytes = @($str.ToCharArray());
        $Crc64Iso = [DamienG.Security.Cryptography.Crc64Iso]::Compute($Bytes);
        $Crc64Iso.ToUInt64($null).ToString('x16');
        $str = Read-Host -Prompt $InputPrompt;
    }
    $NonAlphaNumOption = $Host.UI.PromptForChoice($NonAlphaNumCaption, $NonAlphaNumPrompt, $NonAlphaNumChoices, 0);
    if ($NonAlphaNumOption -gt 2) { break }
    $IgnoreCase = $Host.UI.PromptForChoice($IgnoreCaseCaption, $IgnoreCasePrompt, $YesNoChoices, 1) -eq 0;
    $WhiteSpaceOption = $Host.UI.PromptForChoice($WhiteSpaceCaption, $WhiteSpacePrompt, $WhiteSpaceChoices, 0);
} 
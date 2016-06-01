// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Missing less used formats

wmsx.SlotFormats = {

    "Empty": {
        name: "Empty",
        desc: "Empty Slot",
        priority: 1001,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (!rom || !rom.content || rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return wmsx.SlotEmpty.singleton;
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotEmpty.singleton;
        }
    },

    "Expanded": {
        name: "Expanded",
        desc: "Expanded Slot",
        priority: 1002,
        tryFormat: function (rom) {
            // Not Possible to load Expanded Slots
            return null;
        },
        createFromROM: null,
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotExpanded.recreateFromSaveState(state, previousSlot);
        }
    },

    "BIOS": {
        name: "BIOS",
        desc: "Main BIOS",
        priority: 206,
        tryFormat: function (rom) {
            // Any 16K or 32K content starting with "F3 C3" (DI; JP) or "F3 18" (DI; JR)
            if ((rom.content.length === 16384 || rom.content.length === 32768) && rom.content[0x0000] === 0xF3
                    && (rom.content[0x0001] === 0xC3 || rom.content[0x0001] === 0x18)) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotBIOS(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotBIOS.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSX2BIOSExt": {
        name: "MSX2BIOSExt",
        desc: "MSX2/2+ BIOS Extension",
        priority: 207,
        tryFormat: function (rom) {
            // Any multiple of 16K content starting with the BIOS Extension identifier "CD"
            if (rom.content.length ^ 16384 === 0 && rom.content[0] === 67 && rom.content[1] === 68)
                return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotMSX2BIOSExt(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotMSX2BIOSExt.recreateFromSaveState(state, previousSlot);
        }
    },

    "RAM64K": {
        name: "RAM64K",
        desc: "RAM 64K",
        priority: 1011,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotRAM64K(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAM64K.recreateFromSaveState(state, previousSlot);
        }
    },

    "RAMMapper": {
        name: "RAMMapper",
        desc: "Standard RAM Mapper",
        priority: 1021,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotRAMMapper(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotRAMMapper.recreateFromSaveState(state, previousSlot);
        }
    },

    // Disk Interfaces

    "DiskPatched": {
        name: "DiskPatched",
        desc: "Generic Patched Disk BIOS",
        priority: 1301,
        tryFormat: function (rom) {
            // Only DiskPatched 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskWD": {
        name: "DiskWD",
        desc: "WD 2793 based Disk BIOS (Patched)",
        priority: 1302,
        tryFormat: function (rom) {
            // Only DiskWD 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskFujitsu": {
        name: "DiskFujitsu",
        desc: "Fujitsu MB8877A based Disk BIOS (Patched)",
        priority: 1303,
        tryFormat: function (rom) {
            // Only DiskFujitsu 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskToshiba": {
        name: "DiskToshiba",
        desc: "Toshiba TC8566AF based Disk BIOS (Patched)",
        priority: 1304,
        tryFormat: function (rom) {
            // Only DiskToshiba 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskMicrosol": {
        name: "DiskMicrosol",
        desc: "Microsol WD2793 based Disk BIOS (Patched)",
        priority: 1305,
        tryFormat: function (rom) {
            // Only DiskMicrosol 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    "DiskSVI": {
        name: "DiskSVI",
        desc: "SVI 738 based Disk BIOS (Patched)",
        priority: 1306,
        tryFormat: function (rom) {
            // Only DiskSVI 16K content. Must be selected via info format hint
            if (rom.content.length === 16384 && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDiskPatched(rom, this);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDiskPatched.recreateFromSaveState(state, previousSlot);
        }
    },

    // Special Expansion Cartridges

    "SCCExpansion": {
        name: "SCCExpansion",
        desc: "SCC Expansion Cartridge",
        priority: 1551,
        tryFormat: function (rom) {
            // Only 0K content. Must be selected via info format hint
            if (rom.content.length === 0) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCExpansion(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "SCCIExpansion": {
        name: "SCCIExpansion",
        desc: "SCC-I (SCC+) Expansion Cartridge",
        priority: 1552,
        tryFormat: function (rom) {
            // 0K, 64K or 128K content. Must be selected via info format hint
            if (rom.content.length === 0 || rom.content.length === 65536 || rom.content.length === 131072) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeSCCIExpansion(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeSCCIExpansion.recreateFromSaveState(state, previousSlot);
        }
    },

    "MSXMUSIC": {
        name: "MSXMUSIC",
        desc: "MSX-MUSIC Extension",
        priority: 1553,
        tryFormat: function (rom) {
            // Only 16K content. Must be selected via info format hint
            if (rom.content.length === 16384) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeMSXMUSIC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeMSXMUSIC.recreateFromSaveState(state, previousSlot);
        }
    },

    "FMPAC": {
        name: "FMPAC",
        desc: "FM-PAC Sound Cartridge",
        priority: 1554,
        tryFormat: function (rom) {
            // Only 64K content. Must be selected via info format hint
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeFMPAC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeFMPAC.recreateFromSaveState(state, previousSlot);
        }
    },

    "DOS2": {
        name: "DOS2",
        desc: "MSX-DOS 2 ROM Mapper",
        priority: 1555,
        tryFormat: function (rom) {
            // Only 64K content. Must be selected via info format hint
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeDOS2(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeDOS2.recreateFromSaveState(state, previousSlot);
        }
    },

    // Common formats used in titles

    "Normal": {
        name: "Normal",
        desc: "Normal ROM",
        priority: 901,
        tryFormat: function (rom) {
            // Any 8K or 16K content starting with the Cartridge identifier "AB"
            if ((rom.content.length === 8192 || rom.content.length === 16384)
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
            // Any 32K with the Cartridge identifier "AB" at 0x0000 or 0x4000
            if (rom.content.length === 32768
                && ((rom.content[0] === 65 && rom.content[1] === 66)
                || (rom.content[0x4000] === 65 && rom.content[0x4001] === 66))) return this;
            // Any 64K or 48K content, with the Cartridge identifier "AB" at 0x4000 or 0x8000
            if ((rom.content.length === 65536 || rom.content.length === 49152)
                && ((rom.content[0x4000] === 65 && rom.content[0x4001] === 66)
                || (rom.content[0x8000] === 65 && rom.content[0x8001] === 66))) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.SlotNormal(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.SlotNormal.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII8": {
        name: "ASCII8",
        desc: "ASCII 8K Mapper Cartridge",
        priority: 931,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII8K(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII8K.recreateFromSaveState(state, previousSlot);
        }
    },

    "ASCII16": {
        name: "ASCII16",
        desc: "ASCII 16K Mapper Cartridge",
        priority: 932,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 16K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 16384) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeASCII16K(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeASCII16K.recreateFromSaveState(state, previousSlot);
        }
    },

    "Konami": {
        name: "Konami",
        desc: "Konami Mapper Cartridge",
        priority: 933,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonami(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeKonami.recreateFromSaveState(state, previousSlot);
        }
    },

    "KonamiSCC": {
        name: "KonamiSCC",
        desc: "KonamiSCC Mapper Cartridge",
        priority: 934,
        tryFormat: function (rom) {
            // Any >32K content, multiple of 8K, starting with the Cartridge identifier "AB"
            if (rom.content.length > 32768 && (rom.content.length % 8192) === 0
                && rom.content[0] === 65 && rom.content[1] === 66) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeKonamiSCC(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeKonamiSCC.recreateFromSaveState(state, previousSlot);
        }
    },

    "RType": {
        name: "RType",
        desc: "R-Type Mapper Cartridge",
        priority: 1951,
        tryFormat: function (rom) {
            // Only R-Type 384K content. Must be selected via info format hint
            if (rom.content.length === 393216) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeRType(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeRType.recreateFromSaveState(state, previousSlot);
        }
    },

    "CrossBlaim": {
        name: "CrossBlaim",
        desc: "CrossBlaim Mapper Cartridge",
        priority: 1952,
        tryFormat: function (rom) {
            // Only CrossBlaim 64K content. Must be selected via info format hint
            if (rom.content.length === 65536) return this;
        },
        createFromROM: function (rom) {
            return new wmsx.CartridgeCrossBlaim(rom);
        },
        recreateFromSaveState: function (state, previousSlot) {
            return wmsx.CartridgeCrossBlaim.recreateFromSaveState(state, previousSlot);
        }
    }

};

// Synonyms

wmsx.SlotFormats.Snatcher = wmsx.SlotFormats.SCCIExpansion;
wmsx.SlotFormats.SDSnatcher = wmsx.SlotFormats.SCCIExpansion;

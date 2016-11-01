// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// TODO Remove unstable UNICODE chars (Paste, Arrows)
// TODO Remove "Center" rounding problems as possible
// TODO Wrong Bar Menu position in FF
// TODO Fullscreen on FF mobile
// TODO Menu is closing if other menu tries to open via touch

wmsx.CanvasDisplay = function(mainElement) {
"use strict";

    var self = this;

    function init() {
        setupCSS();
        setupMain();
        setupBar();
        setupFullscreen();
        monitor = new wmsx.Monitor(self);
    }

    this.connect = function(pVideoSignal, pMachineControlsSocket, pMachineTypeSocket, pExtensionsSocket, pCartridgeSocket, pControllersSocket) {
        monitor.connect(pVideoSignal);
        machineControlsSocket = pMachineControlsSocket;
        controllersSocket = pControllersSocket;
        cartridgeSocket = pCartridgeSocket;
        extensionsSocket = pExtensionsSocket;
        machineTypeSocket = pMachineTypeSocket;
    };

    this.connectPeripherals = function(fileLoader, pFileDownloader, pPeripheralControls, pControllersHub, pDiskDrive) {
        fileLoader.registerForDnD(fsElement);
        fileLoader.registerForFileInputElement(fsElement);
        fileDownloader = pFileDownloader;
        fileDownloader.registerForDownloadElement(fsElement);
        peripheralControls = pPeripheralControls;
        controllersHub = pControllersHub;
        controllersHub.setKeyInputElement(fsElement);
        controllersHub.setMouseInputElement(fsElement);
        diskDrive = pDiskDrive;
    };

    this.powerOn = function() {
        if (FULLSCREEN_MODE === 1 && isBrowserStandalone) this.setFullscreen(true);
        else monitor.setDefaults();
        updateLogo();
        document.documentElement.classList.add("wmsx-started");
        this.focus();
    };

    this.powerOff = function() {
        document.documentElement.remove("wmsx-started");
    };

    this.start = function(aStartAction) {
        // Show the logo messages or start automatically
        startAction = aStartAction;

        if (wmsx.Util.isMobileDevice() && !isFullscreen) {
            if (!fullscreenAPIEnterMethod && !isBrowserStandalone) setLogoMessage(1);
            else setLogoMessage(2);
        } else
            startAction();
    };

    this.refresh = function(image, sourceWidth, sourceHeight) {
        // Hide mouse cursor if not moving for some time
        if (cursorShowing)
            if (--cursorHideFrameCountdown < 0) hideCursor();

        // If needed, turn signal on and hide logo
        if (!signalIsOn) {
            signalIsOn = true;
            updateLogo();
        }

        // Update frame
        canvasContext.drawImage(
            image,
            0, 0, sourceWidth, sourceHeight,
            0, 0, targetWidth, targetHeight
        );
    };

    this.videoSignalOff = function() {
        signalIsOn = false;
        updateLogo();
    };

    this.mousePointerLocked = function(state) {
        mousePointerLocked = state;
        if (mousePointerLocked) hideBar();
        else showBar();
    };

    this.openHelp = function() {
        self.openSettings("GENERAL");
        return false;
    };

    this.openAbout = function() {
        self.openSettings("ABOUT");
        return false;
    };

    this.openSettings = function(page) {
        if (!settingsDialog) settingsDialog = new wmsx.SettingsDialog(fsElementCenter, controllersHub);
        if (pasteDialog) pasteDialog.hide();
        settingsDialog.show(page);
    };

    this.openDiskSelectDialog = function(drive, inc, altPower) {
        if (!diskSelectDialog) diskSelectDialog = new wmsx.DiskSelectDialog(fsElementCenter, diskDrive, peripheralControls);
        if (pasteDialog) pasteDialog.hide();
        diskSelectDialog.show(drive, inc, altPower);
    };

    this.openMachineSelectDialog = function() {
        if (!machineSelectDialog) machineSelectDialog = new wmsx.MachineSelectDialog(fsElementCenter, machineTypeSocket);
        if (pasteDialog) pasteDialog.hide();
        machineSelectDialog.show();
    };

    this.openTouchConfigDialog = function() {
        if (!touchConfigDialog) touchConfigDialog = new wmsx.TouchConfigDialog(fsElement, canvasOuter, controllersHub);
        if (pasteDialog) pasteDialog.hide();
        touchConfigDialog.show();
    };

    this.openLoadFileDialog = function() {
        peripheralControls.controlActivated(wmsx.PeripheralControls.AUTO_LOAD_FILE);
        return false;
    };

    this.executeTextCopy = function() {
        if (!signalIsOn) return this.showOSD("Screen Text Copy only available when Power is ON!", true, true);

        if (!document.queryCommandSupported || !document.queryCommandSupported('copy'))
            return this.showOSD("Copy to Clipboard not supported by the browser!", true, true);

        var text = monitor.getScreenText();

        if (!text) return this.showOSD("Screen Text Copy not available in this Screen!", true, true);

        if (!copyTextArea) setupCopyTextArea();
        copyTextArea.innerHTML = text;
        copyTextArea.select();

        if (document.execCommand("copy"))
            this.showOSD("Screen text copied to Clipboard", true);
        else
            this.showOSD("Copy to Clipboard not supported by the browser!", true, true);

        this.focus();
    };

    this.toggleTextPasteDialog = function() {
        if (!signalIsOn) return this.showOSD("Text Paste only available when Power is ON!", true, true);

        if (!pasteDialog) pasteDialog = new wmsx.PasteDialog(canvasOuter, this, controllersHub.getKeyboard());
        pasteDialog.toggle();
        return false;
    };

    this.toggleVirtualKeyboard = function() {
        setVirtualKeyboard(!virtualKeyboardActive);
    };

    this.getScreenCapture = function() {
        if (!signalIsOn) return;
        return canvas.toDataURL('image/png');
    };

    this.saveScreenCapture = function() {
        var cap = this.getScreenCapture();
        if (cap) fileDownloader.startDownloadURL("WMSX Screen", cap, "Screen Capture");
    };

    this.displayMetrics = function (pTargetWidth, pTargetHeight) {
        // No need to resize display if target size is unchanged
        if (targetWidth === pTargetWidth && targetHeight === pTargetHeight) return;

        targetWidth = pTargetWidth;
        targetHeight = pTargetHeight;
        updateCanvasContentSize();
        if (isFullscreen) this.requestReadjust(true);
        else updateScale();
    };

    this.displayPixelMetrics = function (pPixelWidth, pPixelHeight) {
        if (pixelWidth === pPixelWidth && pixelHeight === pPixelHeight) return;

        pixelWidth = pPixelWidth;
        pixelHeight = pPixelHeight;
        if (controllersHub) controllersHub.setScreenPixelScale(pixelWidth * scaleY * aspectX, pixelHeight * scaleY);
    };

    this.displayScale = function(pAspectX, pScaleY) {
        aspectX = pAspectX;
        scaleY = pScaleY;
        updateScale();
        if (controllersHub) controllersHub.setScreenPixelScale(pixelWidth * scaleY * aspectX, pixelHeight * scaleY);
    };

    this.displayCenter = function() {
        this.focus();
    };

    this.getMonitor = function() {
        return monitor;
    };

    this.showOSD = function(message, overlap, error) {
        if (osdTimeout) clearTimeout(osdTimeout);
        if (!message) {
            osd.style.transition = "all 0.15s linear";
            osd.style.top = "-29px";
            osd.style.opacity = 0;
            osdShowing = false;
            return;
        }
        if (overlap || !osdShowing) {
            osd.innerHTML = message;
            osd.style.color = error ? "rgb(255, 60, 40)" : "rgb(0, 255, 0)";
        }
        osd.style.transition = "none";
        osd.style.top = "15px";
        osd.style.opacity = 1;
        osdShowing = true;
        osdTimeout = setTimeout(hideOSD, OSD_TIME);
    };

    function hideOSD() {
        osd.style.transition = "all 0.15s linear";
        osd.style.top = "-29px";
        osd.style.opacity = 0;
        osdShowing = false;
    }

    this.setDebugMode = function(boo) {
        debugMode = !!boo;
        updateImageComposition();
    };

    this.crtFilterToggle = function() {
        var newLevel = (crtFilter + 1) % 4;
        setCRTFilter(newLevel);
        this.showOSD(newLevel === 0 ? "CRT filter: OFF" : "CRT filter level: " + newLevel, true);
    };

    this.crtFilterSetDefault = function() {
        setCRTFilter(WMSX.SCREEN_FILTER_MODE);
    };

    this.crtModeToggle = function() {
        var newMode = (crtMode + 1) % 2;
        setCRTMode(newMode);
        this.showOSD("CRT mode: " + (crtMode === 1 ? "Phosphor" : "OFF"), true);
    };

    this.crtModeSetDefault = function() {
        setCRTMode(WMSX.SCREEN_CRT_MODE);
    };

    this.displayToggleFullscreen = function() {                 // Only and Always user initiated
        if (FULLSCREEN_MODE === -1) return;

        setLogoMessage(0);

        // If FullScreenAPI supported but not active, enter full screen by API regardless of previous state
        if (fullscreenAPIEnterMethod && !isFullScreenByAPI()) {
            enterFullScreenByAPI();
            return;
        }

        // If not, toggle complete full screen state
        this.setFullscreen(!isFullscreen);
    };

    this.setFullscreen = function(mode) {
        isFullscreen = mode;

        if (mode) {
            setViewport();
            document.documentElement.classList.add("wmsx-full-screen");
            if (fullScreenByHack) document.documentElement.classList.add("wmsx-full-screen-hack");
            controllersHub.setupTouchControlsIfNeeded(fsElementCenter);
            enterFullScreenByAPI();
            if (fullScreenByHack) setScrollMessage(true);
        } else {
            restoreViewport();
            document.documentElement.classList.remove("wmsx-full-screen");
            document.documentElement.classList.remove("wmsx-full-screen-hack");
            exitFullScreenByAPI();
        }

        self.requestReadjust();
    };

    this.focus = function() {
        canvas.focus();
    };

    this.powerStateUpdate = function(power) {
        powerButton.style.backgroundPosition = "" + powerButton.wmsxBX + "px " + (mediaButtonBackYOffsets[power ? 2 : 1]) + "px";
        powerButton.wmsxMenu[1].disabled = powerButton.wmsxMenu[4].disabled = !power;
    };

    this.diskDrivesMediaStateUpdate = function(drive) {
        var button = drive === 1 ? diskBButton : diskAButton;
        var stack = diskDrive.getDriveStack(drive);
        button.title = diskDrive.getCurrentDiskDesc(drive);
        button.wmsxMenu[1].disabled = stack.length === 0 || stack.length >= wmsx.FileDiskDrive.MAX_STACK;
        button.wmsxMenu[6].disabled = button.wmsxMenu[7].disabled = button.wmsxMenu[8].disabled = stack.length === 0;
        button.wmsxMenu[8].label = "Remove " + (stack.length > 1 ? "Stack" : "Disk");
        if (diskSelectDialog) diskSelectDialog.diskDrivesMediaStateUpdate(drive);
    };

    this.diskDrivesMotorStateUpdate = function(diskA, diskAMotor, diskB, diskBMotor) {
        diskAButton.style.backgroundPosition = "" + diskAButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskAMotor ? 2 : ( diskA ? 1 : 0 ))]) + "px";
        diskBButton.style.backgroundPosition = "" + diskBButton.wmsxBX + "px " + (mediaButtonBackYOffsets[(diskBMotor ? 2 : ( diskB ? 1 : 0 ))]) + "px";
    };

    this.extensionsAndCartridgesStateUpdate = function() {
        var cart1 = cartridgeSocket.inserted(0);
        var cart2 = cartridgeSocket.inserted(1);
        cartridge1Button.title = "Cartridge 1" + ( cart1 ? ": " + (cart1.rom.source || "<Unknown>") + "  [" + cart1.format.name + "]" : "" );
        cartridge2Button.title = "Cartridge 2" + ( cart2 ? ": " + (cart2.rom.source || "<Unknown>") + "  [" + cart2.format.name + "]" : "" );
        cartridge1Button.style.backgroundPosition = "" + cartridge1Button.wmsxBX + "px " + (mediaButtonBackYOffsets[(cart1 ? 1 : 0)]) + "px";
        cartridge2Button.style.backgroundPosition = "" + cartridge2Button.wmsxBX + "px " + (mediaButtonBackYOffsets[(cart2 ? 1 : 0)]) + "px";
        var dataDesc = cart1 && cart1.getDataDesc();
        cartridge1Button.wmsxMenu[1].disabled = cartridge1Button.wmsxMenu[2].disabled = !dataDesc;
        cartridge1Button.wmsxMenu[1].label = "Load " + (dataDesc || "Data");
        cartridge1Button.wmsxMenu[2].label = "Save " + (dataDesc || "Data");
        cartridge1Button.wmsxMenu[3].disabled = !cart1;
        dataDesc = cart2 && cart2.getDataDesc();
        cartridge2Button.wmsxMenu[1].disabled = cartridge2Button.wmsxMenu[2].disabled = !dataDesc;
        cartridge2Button.wmsxMenu[1].label = "Load " + (dataDesc || "Data");
        cartridge2Button.wmsxMenu[2].label = "Save " + (dataDesc || "Data");
        cartridge2Button.wmsxMenu[3].disabled = !cart2;
        refreshSettingsMenuForExtensions();
    };

    this.tapeStateUpdate = function(name, motor) {
        tapeButton.title = "Cassette Tape" + ( name ? ": " + name : "" );
        tapeButton.style.backgroundPosition = "" + tapeButton.wmsxBX + "px " + (mediaButtonBackYOffsets[motor ? 2 : ( name ? 1 : 0 )]) + "px";
        tapeButton.wmsxMenu[2].disabled = tapeButton.wmsxMenu[3].disabled = tapeButton.wmsxMenu[4].disabled = tapeButton.wmsxMenu[5].disabled = !name;
    };

    this.machineTypeStateUpdate = function() {
        refreshSettingsMenuForMachineType();
    };

    this.keyboardSettingsStateUpdate = function() {
        if(settingsDialog) settingsDialog.keyboardSettingsStateUpdate();
    };

    this.controllersSettingsStateUpdate = function () {
        if(settingsDialog) settingsDialog.controllersSettingsStateUpdate();
        if(touchConfigDialog) touchConfigDialog.controllersSettingsStateUpdate();
    };

    this.mouseActiveCursorStateUpdate = function(boo) {
        cursorType = boo ? 'url("' + wmsx.Images.urls.mouseCursor + '") -10 -10, auto' : "auto";
        showCursor(true);
    };

    this.touchControlsActiveUpdate = function(active) {
        if (touchControlsActive === active) return;

        touchControlsActive = active;
        if (isFullscreen) {
            if (touchControlsActive) controllersHub.setupTouchControlsIfNeeded(fsElementCenter);
            this.requestReadjust();
        }
    };

    this.setLoading = function(state) {
        isLoading = state;
        updateLoading();
        if (!state) {
            machineControlsSocket.addPowerStateListener(this);
            machineTypeSocket.addMachineTypeStateListener(this);
            extensionsSocket.addExtensionsAndCartridgesStateListener(this);
        }
    };

    this.requestReadjust = function(now) {
        if (now)
            readjustAll(true);
        else {
            readjustRequestTime = wmsx.Util.performanceNow();
            if (!readjustInterval) readjustInterval = setInterval(readjustAll, 50);
        }
    };


    function setVirtualKeyboard(active) {
        if (virtualKeyboardActive === active) return;

        if (active) {
            if (!wmsx.Util.isTouchDevice()) return self.showOSD("Virtual Keyboard unavailable. Not a touch device!", true, true);
            if (!virtualKeyboardElement) setupVirtualKeyboard();
            document.documentElement.classList.add("wmsx-virtual-keyboard-active");
        } else
            document.documentElement.classList.remove("wmsx-virtual-keyboard-active");

        virtualKeyboardActive = active;
        self.requestReadjust(true);
    }

    function releaseControllersOnLostFocus(e) {
        controllersSocket.releaseControllers();
    }

    function hideCursor() {
        cursorShowing = false;
        updateCursor();
        hideBar();
    }

    function showCursor(force) {
        if (!cursorShowing || force) {
            cursorShowing = true;
            updateCursor();
        }
        cursorHideFrameCountdown = CURSOR_HIDE_FRAMES;
    }

    function updateCursor() {
        fsElement.style.cursor = cursorShowing ? cursorType : "none";
    }

    function fullscreenByAPIChanged() {
        self.setFullscreen(isFullScreenByAPI());
    }

    function isFullScreenByAPI() {
        return document[fullScreenAPIQueryProp];
    }

    function enterFullScreenByAPI() {
        if (fullscreenAPIEnterMethod) try {
            fullscreenAPIEnterMethod.call(fsElement);
        } catch (e) {
            /* give up */
        }
    }

    function exitFullScreenByAPI() {
        if (fullScreenAPIExitMethod) try {
            fullScreenAPIExitMethod.call(document);
        } catch (e) {
            /* give up */
        }
    }

    function updateScale() {
        var canvasWidth = Math.round(targetWidth * scaleY * aspectX);
        var canvasHeight = Math.round(targetHeight * scaleY);
        canvas.style.width = "" + canvasWidth + "px";
        canvas.style.height = "" + canvasHeight + "px";
        updateBarWidth(canvasWidth);
    }

    function updateBarWidth(canvasWidth) {
        var finalWidth = buttonsBarDesiredWidth > 0 ? buttonsBarDesiredWidth : canvasWidth;

        buttonsBar.style.width = buttonsBarDesiredWidth === -1 ? "100%" : "" + finalWidth + "px";

        if (finalWidth < NARROW_WIDTH) buttonsBar.classList.add("wmsx-narrow");
        else buttonsBar.classList.remove("wmsx-narrow");
    }

    function updateKeyboardWidth(viewportWidth) {
        var width = Math.min(1024, viewportWidth);
        var scale = width / VIRTUAL_KEYBOARD_WIDTH;

        if (virtualKeyboardActive)
            virtualKeyboardElement.style.transform = "translateX(-50%) scale(" + scale.toFixed(8) + ")";

        return { w: width, h: Math.ceil(VIRTUAL_KEYBOARD_HEIGHT * scale) };
    }

    function updateCanvasContentSize() {
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Prepare Context used to draw frame
        canvasContext = canvas.getContext("2d");

        updateImageComposition();
        updateImageSmoothing();
    }

    function setCRTFilter(level) {
        crtFilter = level;
        updateImageSmoothing();
    }

    function setCRTMode(mode) {
        crtMode = mode;
        updateImageComposition();
    }

    function updateLogo() {
        if (signalIsOn) {
            logo.style.display = "none";
        } else {
            if (pasteDialog) pasteDialog.hide();
            showBar();
            showCursor(true);
            canvasContext.clearRect(0, 0, canvas.width, canvas.height);
            logo.style.display = "block";
        }
    }

    function updateLoading() {
        if (isLoading /* && loadingImage.isLoaded */) loadingImage.style.display = "block";
        else loadingImage.style.display = "none";
    }

    function updateImageComposition() {
        if (crtMode > 0 && !debugMode) {
            canvasContext.globalCompositeOperation = "source-over";
            canvasContext.globalAlpha = 0.8;
        } else {
            canvasContext.globalCompositeOperation = "copy";
            canvasContext.globalAlpha = 1;
        }
    }

    function updateImageSmoothing() {
        canvas.style.imageRendering = (crtFilter === 1 || crtFilter === 3) ? "initial" : canvasImageRenderingValue;

        var smoothing = crtFilter >= 2;
        if (canvasContext.imageSmoothingEnabled !== undefined)
            canvasContext.imageSmoothingEnabled = smoothing;
        else {
            canvasContext.webkitImageSmoothingEnabled = smoothing;
            canvasContext.mozImageSmoothingEnabled = smoothing;
            canvasContext.msImageSmoothingEnabled = smoothing;
        }
    }

    function onMouseDown(element, handler) {
        element.addEventListener("mousedown", handler);
    }

    function onMouseUp(element, handler) {
        element.addEventListener("mouseup", handler);
    }


    function blockEvent(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    function suppressContextMenu(element) {
        element.addEventListener("contextmenu", blockEvent);
    }

    function preventDrag(element) {
        element.ondragstart = blockEvent;
    }

    function setupMain() {
        mainElement.innerHTML = wmsx.ScreenGUI.html();
        delete wmsx.ScreenGUI.html;

        fsElement = document.getElementById("wmsx-screen-fs");
        fsElementCenter = document.getElementById("wmsx-screen-fs-center");
        canvasOuter = document.getElementById("wmsx-screen-canvas-outer");
        canvas = document.getElementById("wmsx-screen-canvas");
        osd = document.getElementById("wmsx-osd");
        logo = document.getElementById("wmsx-logo");
        logoImage = document.getElementById("wmsx-logo-image");
        logoMessageYes = document.getElementById("wmsx-logo-message-yes");
        logoMessageNo =  document.getElementById("wmsx-logo-message-no");
        logoMessageOk =  document.getElementById("wmsx-logo-message-ok");
        loadingImage = document.getElementById("wmsx-loading-icon");
        scrollMessage = document.getElementById("wmsx-screen-scroll-message");

        suppressContextMenu(mainElement);
        suppressContextMenu(fsElement);
        preventDrag(logoImage);
        preventDrag(loadingImage);

        updateCanvasContentSize();

        // Try to determine correct value for image-rendering for the canvas filter modes
        switch (wmsx.Util.browserInfo().name) {
            case "CHROME":
            case "EDGE":
            case "OPERA":   canvasImageRenderingValue = "pixelated"; break;
            case "FIREFOX": canvasImageRenderingValue = "-moz-crisp-edges"; break;
            case "SAFARI":  canvasImageRenderingValue = "-webkit-optimize-contrast"; break;
            default:        canvasImageRenderingValue = "pixelated";
        }

        fsElement.addEventListener("mousemove", function() {
            showCursor();
            showBar();
        });

        if ("onblur" in document) fsElement.addEventListener("blur", releaseControllersOnLostFocus, true);
        else fsElement.addEventListener("focusout", releaseControllersOnLostFocus, true);

        window.addEventListener("orientationchange", function() {
            if (isFullscreen) self.requestReadjust();
        });

        onMouseDown(logoMessageYes,logoMessageYesClicked);    // User Initiated Gesture required
        onMouseDown(logoMessageNo,logoMessageNoClicked);
        onMouseDown(logoMessageOk,logoMessageOkClicked);
    }

    function setupVirtualKeyboard() {
        virtualKeyboardElement = document.createElement('div');
        virtualKeyboardElement.id = "wmsx-virtual-keyboard";
        fsElementCenter.appendChild(virtualKeyboardElement);
        virtualKeyboard = new wmsx.DOMVirtualKeyboard(virtualKeyboardElement, controllersHub.getKeyboard());
    }

    function setupBar() {
        buttonsBar = document.getElementById("wmsx-bar");
        buttonsBarInner = document.getElementById("wmsx-bar-inner");

        if (BAR_AUTO_HIDE) {
            document.documentElement.classList.add("wmsx-bar-auto-hide");
            fsElement.addEventListener("mouseleave", hideBar);
            hideBar();
        }

        var menu = [
            { label: "Power",              clickModif: 0, control: wmsx.PeripheralControls.MACHINE_POWER_TOGGLE },
            { label: "Reset",              clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.MACHINE_POWER_RESET },
            { label: "",                   divider: true },
            { label: "Load State File",    clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.MACHINE_LOAD_STATE_FILE },
            { label: "Save State File",    clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.MACHINE_SAVE_STATE_FILE, disabled: true }
        ];
        menu.menuTitle = "System";
        powerButton = addPeripheralControlButton("wmsx-bar-power", -120, -29, "System Power", null, menu);

        menu = [
            { label: "Load from Files",    clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES },
            { label: "Add from Files",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISK_ADD_FILES, disabled: true },
            { label: 'Load "Files as Disk"',           control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK },
            { label: 'Load "ZIP as Disk"',             control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK },
            { label: "Blank 720KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_720 },
            { label: "Blank 360KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_360 },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, disabled: true },
            { label: "Save Disk File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, disabled: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, disabled: true },
            {                              clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY }
        ];
        menu.menuTitle = "Drive A:";
        diskAButton = addPeripheralControlButton("wmsx-bar-diska", -237, -54, "Disk A:", null, menu);

        menu = [
            { label: "Load from Files",    clickModif: 0, control: wmsx.PeripheralControls.DISK_LOAD_FILES, secSlot: true },
            { label: "Add from Files",     clickModif: KEY_SHIFT_MASK, control: wmsx.PeripheralControls.DISK_ADD_FILES, secSlot: true, disabled: true },
            { label: 'Load "Files as Disk"',           control: wmsx.PeripheralControls.DISK_LOAD_FILES_AS_DISK, secSlot: true },
            { label: 'Load "ZIP as Disk"',             control: wmsx.PeripheralControls.DISK_LOAD_ZIP_AS_DISK, secSlot: true },
            { label: "Blank 720KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_720, secSlot: true },
            { label: "Blank 360KB Disk",               control: wmsx.PeripheralControls.DISK_EMPTY_360, secSlot: true },
            { label: "Select Disk",                    control: wmsx.PeripheralControls.DISK_SELECT, secSlot: true, disabled: true },
            { label: "Save Disk File",     clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_SAVE_FILE, secSlot: true, disabled: true },
            { label: "Remove Disk",        clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.DISK_REMOVE, secSlot: true, disabled: true },
            {                              clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.DISK_EMPTY, secSlot: true }
        ];
        menu.menuTitle = "Drive B:";
        diskBButton = addPeripheralControlButton("wmsx-bar-diskb", -266, -54, "Disk B:", null, menu);

        menu = [
            { label: "Load from File",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE },
            { label: "Load Data",          clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, disabled: true },
            { label: "Save Data",          clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cartridge 1";
        cartridge1Button = addPeripheralControlButton("wmsx-bar-cart1", -150, -54, "Cartridge 1", null, menu);

        menu = [
            { label: "Load from File",     clickModif: 0, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_FILE, secSlot: true },
            { label: "Load Data",          clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.CARTRIDGE_LOAD_DATA_FILE, secSlot: true, disabled: true },
            { label: "Save Data",          clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_SAVE_DATA_FILE, secSlot: true, disabled: true },
            { label: "Remove Cartridge",   clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.CARTRIDGE_REMOVE, secSlot: true, disabled: true }
        ];
        menu.menuTitle = "Cartridge 2";
        cartridge2Button = addPeripheralControlButton("wmsx-bar-cart2", -179, -54, "Cartridge 2", null, menu);

        menu = [
            { label: "Load form File", clickModif: 0, control: wmsx.PeripheralControls.TAPE_LOAD_FILE },
            { label: "New Blank Tape", clickModif: KEY_CTRL_MASK, control: wmsx.PeripheralControls.TAPE_EMPTY },
            { label: "Rewind Tape",                control: wmsx.PeripheralControls.TAPE_REWIND, disabled: true },
            { label: "Run Program",    clickModif: KEY_SHIFT_MASK | KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_AUTO_RUN, disabled: true },
            { label: "Save Tape File", clickModif: KEY_CTRL_MASK | KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_SAVE_FILE, disabled: true },
            { label: "Remove Tape",    clickModif: KEY_ALT_MASK, control: wmsx.PeripheralControls.TAPE_REMOVE, disabled: true }
        ];
        menu.menuTitle = "Cassette Tape";
        tapeButton = addPeripheralControlButton("wmsx-bar-tape", -208, -54, "Cassette Tape", null, menu);

        menu = createSettingsMenuOptions();
        menu.menuTitle = "Settings";
        settingsButton = addPeripheralControlButton("wmsx-bar-settings", -96, -4, "Settings", null, menu);

        if (FULLSCREEN_MODE !== -1)
            fullscreenButton = addPeripheralControlButton("wmsx-bar-full-screen", -71, -4, "Full Screen", wmsx.PeripheralControls.SCREEN_FULLSCREEN);

        if (!WMSX.SCREEN_RESIZE_DISABLED) {
            scaleUpButton = addPeripheralControlButton("wmsx-bar-scale-plus", -48, -4, "Increase Screen", wmsx.PeripheralControls.SCREEN_SCALE_PLUS);
            scaleUpButton.classList.add("wmsx-full-screen-hidden");
            scaleDownButton = addPeripheralControlButton("wmsx-bar-scale-minus", -26, -4, "Decrease Screen", wmsx.PeripheralControls.SCREEN_SCALE_MINUS);
            scaleDownButton.classList.add("wmsx-full-screen-hidden");
        }

        var keyboardButton = addPeripheralControlButton("wmsx-bar-keyboard", -68, -27, "Toggle Virtual Keyboard", wmsx.PeripheralControls.SCREEN_TOGGLE_VIRTUAL_KEYBOARD);
        keyboardButton.classList.add("wmsx-full-screen-only");

        logoButton = addPeripheralControlButton("wmsx-bar-logo", -8, -26, "About WebMSX", wmsx.PeripheralControls.SCREEN_OPEN_ABOUT);
        logoButton.classList.add("wmsx-full-screen-hidden");
        logoButton.classList.add("wmsx-narrow-hidden");

        // Mouse buttons perform the various actions
        onMouseDown(buttonsBar, peripheralControlButtonMouseDown);
    }

    function createSettingsMenuOptions() {
        var menu = [ ];

        var extConfig = WMSX.EXTENSIONS_CONFIG;
        for (var ext in extConfig) {
            var conf = extConfig[ext];
            if (conf.desc) {            // Only show extensions with descriptions
                var opt = { label: conf.desc, extension: ext, toggle: true, checked: false };
                menu.push(opt);
            }
        }
        menu.push({ label: "",            divider: true });

        menu.push({ label: "Select Machine",                 control: wmsx.PeripheralControls.MACHINE_SELECT });
        menu.push({ label: "Help & Settings", clickModif: 0, control: wmsx.PeripheralControls.SCREEN_OPEN_SETTINGS,     fullScreenHidden: true });
        if (isTouchDevice)
        menu.push({ label: "Touch Controls",                 control: wmsx.PeripheralControls.SCREEN_OPEN_TOUCH_CONFIG });
        menu.push({ label: "Defaults",                       control: wmsx.PeripheralControls.SCREEN_DEFAULTS,          fullScreenHidden: true });
        return menu;
    }

    function refreshSettingsMenuForExtensions() {
        var menu = settingsButton.wmsxMenu;
        for (var i = 0; i < menu.length; ++i) {
            var opt = menu[i];
            if (opt.extension) {
                opt.hidden = !extensionsSocket.isValid(opt.extension);
                opt.checked = extensionsSocket.isActiveAnySlot(opt.extension);
            }
        }
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function refreshSettingsMenuForMachineType() {
        var menu = settingsButton.wmsxMenu;
        menu.menuTitle = (WMSX.MACHINES_CONFIG[machineTypeSocket.getMachine()].desc.split("(")[0] || "Settings").trim();
        if (barMenuActive === menu) refreshBarMenu(menu);
    }

    function addPeripheralControlButton(id, bx, by, tooltip, control, menu) {
        var but = document.createElement('div');
        but.id = id;
        but.classList.add("wmsx-bar-button");
        but.wmsxControl = control;
        but.wmsxMenu = menu;
        but.style.backgroundPosition = "" + bx + "px " + by + "px";
        but.wmsxBX = bx;
        if (tooltip) but.title = tooltip;

        // Mouse hover switch menus if already open
        but.addEventListener("mouseenter", peripheralControlButtonMouseEnter);

        buttonsBarInner.appendChild(but);
        return but;
    }

    function peripheralControlButtonMouseDown(e) {
        blockEvent(e);

        // Single option, only left click
        if (e.target.wmsxControl) {
            hideBarMenu();
            if (!e.button) peripheralControls.controlActivated(e.target.wmsxControl);
            return;
        }

        var menu = e.target.wmsxMenu;
        if (!menu) {
            hideBarMenu();
            return;
        }

        var modifs = 0 | (e.altKey && KEY_ALT_MASK) | (e.ctrlKey && KEY_CTRL_MASK) | (e.shiftKey && KEY_SHIFT_MASK);

        // Open/close menu with left-click if no modifiers
        if (modifs === 0 && !e.button) {
            if (barMenuActive !== menu) showBarMenu(menu, e.target, true);
            else hideBarMenu();
            return;
        }

        // Modifier options for left, middle or right click
        for (var i = 0; i < menu.length; ++i)
            if (menu[i].clickModif === modifs) peripheralControls.controlActivated(menu[i].control, e.button === 1, menu[i].secSlot); // altPower for middleClick
    }

    function peripheralControlButtonMouseEnter(e) {
        if (barMenuActive && e.target.wmsxMenu) showBarMenu(e.target.wmsxMenu, e.target, true);
    }

    function setupCopyTextArea() {
        copyTextArea = document.createElement("textarea");
        copyTextArea.id = "wmsx-copy-texarea";
        fsElement.appendChild(copyTextArea);
    }

    function setupFullscreen() {
        fullscreenAPIEnterMethod = fsElement.requestFullscreen || fsElement.webkitRequestFullscreen || fsElement.webkitRequestFullScreen || fsElement.mozRequestFullScreen;
        fullScreenAPIExitMethod =  document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
        if ("fullscreenElement" in document) fullScreenAPIQueryProp = "fullscreenElement";
        else if ("webkitFullscreenElement" in document) fullScreenAPIQueryProp = "webkitFullscreenElement";
        else if ("mozFullScreenElement" in document) fullScreenAPIQueryProp = "mozFullScreenElement";

        if (!fullscreenAPIEnterMethod && wmsx.Util.isMobileDevice() && !isBrowserStandalone) fullScreenByHack = true;

        if ("onfullscreenchange" in document)            document.addEventListener("fullscreenchange", fullscreenByAPIChanged);
        else if ("onwebkitfullscreenchange" in document) document.addEventListener("webkitfullscreenchange", fullscreenByAPIChanged);
        else if ("onmozfullscreenchange" in document)    document.addEventListener("mozfullscreenchange", fullscreenByAPIChanged);

        // Prevent scroll & zoom in fullscreen if not touching on the screen (canvas) or scroll message in hack mode
        if (!fullscreenAPIEnterMethod) fsElement.addEventListener("touchmove", function preventTouchMoveInFullscreenByHack(e) {
            if (isFullscreen) {
                if (!fullScreenByHack || (e.target !== canvas && e.target !== scrollMessage))
                    return blockEvent(e);
                else
                    if (scrollMessageActive) setScrollMessage(false);
            }
        });
    }

    function showBar() {
        if (!mousePointerLocked) buttonsBar.classList.remove("wmsx-hidden");
    }

    function hideBar() {
        if ((BAR_AUTO_HIDE || isFullscreen) && !barMenuActive && !virtualKeyboardActive) {
            hideBarMenu();
            buttonsBar.classList.add("wmsx-hidden");
        }
    }

    function showBarMenu(menu, refElement, redefine) {
        if (barMenuActive && !redefine) return;
        if (!menu) return;

        if (!barMenu) {
            setupBarMenu();
            setTimeout(function() {
                showBarMenu(menu, refElement, redefine);
            }, 1);
            return;
        }

        // Define items
        refreshBarMenu(menu);

        // Position
        if (refElement) {
            var p;
            p = (refElement.offsetLeft + refElement.clientWidth / 2 - wmsx.ScreenGUI.BAR_MENU_WIDTH / 2) | 0;
            if (p + wmsx.ScreenGUI.BAR_MENU_WIDTH > refElement.parentElement.clientWidth) {
                barMenu.style.right = 0;
                barMenu.style.left = "auto";
            } else {
                if (p < 0) p = 0;
                barMenu.style.left = "" + p + "px";
                barMenu.style.right = "auto";
            }
        } else {
            barMenu.style.left = barMenu.style.right = 0;
        }

        // Show
        barMenuActive = menu;
        barMenu.style.transition = redefine ? "none" : BAR_MENU_TRANSITION;
        barMenu.wmsxTitle.focus();
    }

    function refreshBarMenu(menu) {
        barMenu.wmsxTitle.innerHTML = menu.menuTitle;

        var it = 0;
        var item;
        var maxShown = Math.min(menu.length, BAR_MENU_MAX_ITEMS);
        for (var op = 0; op < maxShown; ++op) {
            if (menu[op].label !== undefined) {
                item = barMenu.wmsxItems[it];
                item.firstChild.textContent = menu[op].label;
                item.wmsxMenuOption = menu[op];

                if (menu[op].hidden || (isFullscreen && menu[op].fullScreenHidden)) {
                    item.style.display = "none";
                } else {
                    item.style.display = "block";

                    // Disabled ?
                    if (menu[op].disabled) item.classList.add("wmsx-bar-menu-item-disabled");
                    else item.classList.remove("wmsx-bar-menu-item-disabled");

                    // Divider?
                    if (menu[op].divider) item.classList.add("wmsx-bar-menu-item-divider");
                    else item.classList.remove("wmsx-bar-menu-item-divider");

                    // Toggle option?
                    if (menu[op].toggle !== undefined) {
                        item.classList.add("wmsx-bar-menu-item-toggle");
                        if (menu[op].checked) item.classList.add("wmsx-bar-menu-item-toggle-checked");
                        else item.classList.remove("wmsx-bar-menu-item-toggle-checked");
                    } else {
                        item.classList.remove("wmsx-bar-menu-item-toggle");
                    }
                }

                ++it;
            }
        }
        for (var r = it; r < BAR_MENU_MAX_ITEMS; ++r) {
            item = barMenu.wmsxItems[r];
            item.firstChild.textContent = "";
            item.style.display = "none";
            item.wmsxMenuOption = null;
        }

        barMenu.style.height = "auto";
    }

    function hideBarMenu() {
        if (!barMenuActive) return;

        barMenuActive = null;
        barMenu.style.transition = BAR_MENU_TRANSITION;
        barMenu.style.height = 0;
        self.focus();
    }

    function setupBarMenu() {
        barMenu = document.createElement('div');
        barMenu.id = "wmsx-bar-menu";

        var inner = document.createElement('div');
        inner.id = "wmsx-bar-menu-inner";
        barMenu.appendChild(inner);

        var title = document.createElement('button');
        title.id = "wmsx-bar-menu-title";
        title.innerHTML = "Menu Title";
        inner.appendChild(title);
        barMenu.wmsxTitle = title;

        var itemMouseEntered = function (e) {
            e.target.classList.add("wmsx-hover");
        };
        var itemMouseLeft = function (e) {
            e.target.classList.remove("wmsx-hover");
        };

        barMenu.wmsxItems = new Array(BAR_MENU_MAX_ITEMS);
        for (var i = 0; i < BAR_MENU_MAX_ITEMS; ++i) {
            var item = document.createElement('button');
            item.classList.add("wmsx-bar-menu-item");
            item.style.display = "none";
            item.innerHTML = "Menu Item " + i;
            item.addEventListener("mouseenter", itemMouseEntered);
            item.addEventListener("mouseleave", itemMouseLeft);
            var check = document.createElement('div');
            check.classList.add("wmsx-bar-menu-item-check");
            item.appendChild(check);
            inner.appendChild(item);
            barMenu.wmsxItems[i] = item;
        }

        // Block keys and hide with ESC
        barMenu.addEventListener("keydown", function(e) {
            if (e.keyCode === wmsx.DOMKeys.VK_ESCAPE.c) hideBarMenu();
            return blockEvent(e);
        });

        var fireItem = function(e) {
            if (e.target.wmsxMenuOption && !e.target.wmsxMenuOption.disabled) {
                var altPower = e.button === 1;
                var secSlot;
                if (e.target.wmsxMenuOption.machine) {
                    machineTypeSocket.changeMachine(e.target.wmsxMenuOption.machine);
                } else if (e.target.wmsxMenuOption.extension) {
                    secSlot = e.shiftKey;
                    extensionsSocket.toggleExtension(e.target.wmsxMenuOption.extension, altPower, secSlot);
                } else if (e.target.wmsxMenuOption.control) {
                    secSlot = e.target.wmsxMenuOption.secSlot;
                    hideBarMenu();
                    peripheralControls.controlActivated(e.target.wmsxMenuOption.control, altPower, secSlot);
                }
            }
        };
        // Fire menu item with a left or middle mouse up or a touchEnd
        onMouseUp(barMenu, function (e) {
            if (!e.button || e.button === 1) fireItem(e);
            return blockEvent(e);
        });
        // Block mousedown
        onMouseDown(barMenu, blockEvent);

        // Hide on lost focus
        barMenu.addEventListener("blur", hideBarMenu, true);
        barMenu.addEventListener("focusout", hideBarMenu, true);

        buttonsBar.appendChild(barMenu);
    }

    function setLogoMessage(mes) {
        fsElement.classList.remove("wmsx-logo-message-fs");
        fsElement.classList.remove("wmsx-logo-message-add");
        if (mes === 1) fsElement.classList.add("wmsx-logo-message-add");
        else if (mes === 2) fsElement.classList.add("wmsx-logo-message-fs");
    }

    function logoMessageYesClicked(e) {
        setLogoMessage(0);
        self.setFullscreen(true);
        startAction();
        return blockEvent(e);
    }

    function logoMessageNoClicked(e) {
        setLogoMessage(0);
        startAction();
        return blockEvent(e);
    }

    function logoMessageOkClicked(e) {
        if (!isFullscreen) setLogoMessage(2);
        else startAction();
        return blockEvent(e);
    }

    function setScrollMessage(state) {
        if (state) {
            fsElement.classList.add("wmsx-scroll-message");
            scrollMessageActive = true;
            setTimeout(function() {
                setScrollMessage(false);
            }, 5000);
        } else {
            fsElement.classList.remove("wmsx-scroll-message");
            scrollMessageActive = false;
        }
    }

    function setupCSS() {
        var style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = wmsx.ScreenGUI.css();
        document.head.appendChild(style);
        delete wmsx.ScreenGUI.css;
    }

    function readjustAll(force) {
        if (readjustScreeSizeChanged() || force) {
            if (isFullscreen) {
                var isLandscape = readjustScreenSize.w > readjustScreenSize.h;
                var keyboardRect = virtualKeyboardActive && updateKeyboardWidth(readjustScreenSize.w);
                buttonsBarDesiredWidth = isLandscape ? virtualKeyboardActive ? keyboardRect.w : 0 : -1;
                var winH = readjustScreenSize.h - wmsx.ScreenGUI.BAR_HEIGHT - (virtualKeyboardActive ? keyboardRect.h : 0) - 2;       // 2 = space between screen and bar
                monitor.displayScale(aspectX, displayOptimalScaleY(readjustScreenSize.w, winH));
            } else {
                buttonsBarDesiredWidth = -1;
                monitor.displayScale(aspectX, WMSX.SCREEN_DEFAULT_SCALE);
            }
            self.displayCenter();
            controllersHub.screenReadjustedUpdate();

            //console.log("READJUST");
        }

        if (readjustInterval && (wmsx.Util.performanceNow() - readjustRequestTime >= 1000)) {
            clearInterval(readjustInterval);
            readjustInterval = null;
        }
    }

    function readjustScreeSizeChanged() {
        var winW = fsElementCenter.clientWidth;
        var winH = fsElementCenter.clientHeight;
        if (readjustScreenSize.w !== winW || readjustScreenSize.h !== winH) {
            readjustScreenSize.w = winW;
            readjustScreenSize.h = winH;
            return true;
        } else
            return false;
    }

    function displayOptimalScaleY(maxWidth, maxHeight) {
        var scY = maxHeight / targetHeight;
        scY -= (scY % wmsx.Monitor.SCALE_STEP);		                          // Round to multiple of the step
        var width = aspectX * scY * targetWidth;
        while (width > maxWidth) {
            scY -= wmsx.Monitor.SCALE_STEP;				                      // Decrease one step
            width = aspectX * scY * targetWidth;
        }
        return scY;
    }

    function setViewport() {
        if (!viewportTag) {
            viewportTag = document.querySelector("meta[name=viewport]");
            if (!viewportTag) {
                viewportTag = document.createElement('meta');
                viewportTag.name = "viewport";
                document.head.appendChild(viewportTag);
            }
        }
        if (viewportOriginalContent === null) viewportOriginalContent = viewportTag.content;
        viewportTag.content = "width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=0, minimal-ui";
    }

    function restoreViewport() {
        if (viewportOriginalContent !== null) {
            viewportTag.content = viewportOriginalContent;
            viewportOriginalContent = null;
        }
    }

    var startAction;

    var monitor;
    var peripheralControls;
    var fileDownloader;
    var controllersHub;
    var extensionsSocket;
    var machineTypeSocket;
    var controllersSocket;
    var cartridgeSocket;
    var diskDrive;

    var readjustInterval = 0, readjustRequestTime = 0;
    var readjustScreenSize = { w: 0, h: 0 };

    var isFullscreen = false;

    var isTouchDevice = wmsx.Util.isTouchDevice();
    var isBrowserStandalone = wmsx.Util.isBrowserStandaloneMode();

    var fullscreenAPIEnterMethod, fullScreenAPIExitMethod, fullScreenAPIQueryProp, fullScreenByHack = false;
    var viewportTag, viewportOriginalContent = null;

    var machineControlsSocket;
    var machineControlsStateReport = {};

    var settingsDialog;
    var diskSelectDialog;
    var machineSelectDialog;
    var touchConfigDialog;
    var pasteDialog;
    var copyTextArea;

    var fsElement, fsElementCenter;

    var canvas, canvasOuter;
    var canvasContext;
    var canvasImageRenderingValue;

    var touchControlsActive = false;
    var virtualKeyboardActive = false;
    var virtualKeyboardElement, virtualKeyboard;

    var buttonsBar, buttonsBarInner, buttonsBarDesiredWidth = -1;       // 0 = same as canvas. -1 means full width mode (100%)

    var barMenu;
    var barMenuActive = null;

    var osd;
    var osdTimeout;
    var osdShowing = false;

    var cursorType = "auto";
    var cursorShowing = true;
    var cursorHideFrameCountdown = -1;
    var signalIsOn = false;
    var crtFilter = 1;
    var crtMode = 1;
    var debugMode = false;
    var isLoading = false;

    var aspectX = WMSX.SCREEN_DEFAULT_ASPECT;
    var scaleY = WMSX.SCREEN_DEFAULT_SCALE;
    var pixelWidth = 1, pixelHeight = 1;

    var mousePointerLocked = false;

    var targetWidth = wmsx.VDP.SIGNAL_MAX_WIDTH_V9938;
    var targetHeight = WMSX.MACHINES_CONFIG[WMSX.MACHINE].type === 1
        ? wmsx.VDP.SIGNAL_HEIGHT_V9918 * 2
        : wmsx.VDP.SIGNAL_MAX_HEIGHT_V9938;


    var logo, logoImage, logoMessageYes, logoMessageNo, logoMessageOk;
    var loadingImage;
    var scrollMessage, scrollMessageActive = false;

    var powerButton;
    var diskAButton;
    var diskBButton;
    var cartridge1Button;
    var cartridge2Button;
    var tapeButton;
    var logoButton;
    var scaleDownButton;
    var scaleUpButton;
    var fullscreenButton;
    var settingsButton;

    var mediaButtonBackYOffsets = [ -54, -29, -4 ];

    var OSD_TIME = 3000;
    var CURSOR_HIDE_FRAMES = 150;

    var FULLSCREEN_MODE = WMSX.SCREEN_FULLSCREEN_MODE;

    var BAR_AUTO_HIDE = WMSX.SCREEN_CONTROL_BAR === 1;
    var BAR_MENU_MAX_ITEMS = Math.max(10, Object.keys(WMSX.EXTENSIONS_CONFIG).length + 1 + 3);
    var BAR_MENU_TRANSITION = "height 0.12s linear";

    var VIRTUAL_KEYBOARD_WIDTH = 518, VIRTUAL_KEYBOARD_HEIGHT = 161;

    var NARROW_WIDTH = 450;

    var KEY_CTRL_MASK  =  32;
    var KEY_ALT_MASK   =  64;
    var KEY_SHIFT_MASK =  128;


    init();

    this.eval = function(str) {
        return eval(str);
    };

};

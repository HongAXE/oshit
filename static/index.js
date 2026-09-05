const MODE_NORMAL = 1, MODE_ENDLESS = 2, MODE_PRACTICE = 3;

(function(w) {
    function getJsonI18N() {
        const LANGUAGES = [
            { regex: /^zh\b/, lang: 'zh' },
            { regex: /^ja\b/, lang: 'ja' },
            { regex: /.*/, lang: 'en'}
        ]
        const lang = LANGUAGES.find(l => l.regex.test(navigator.language)).lang
        return $.ajax({
            url: `./static/i18n/${lang}.json`,
            dataType: 'json',
            method: 'GET',
            async: false,
            success: data => res = data,
            error: () => alert('找不到语言文件: ' + lang)
        }).responseJSON
    }

    const I18N = getJsonI18N()

    $('[data-i18n]').each(function() {
        const content = I18N[this.dataset.i18n];
        $(this).text(content);
    });

    $('[data-placeholder-i18n]').each(function() {
        $(this).attr('placeholder', I18N[this.dataset.placeholderI18n]);
    });

    $('html').attr('lang', I18N['lang']);

    let isDesktop = !navigator['userAgent'].match(/(ipad|iphone|ipod|android|windows phone)/i);
    let fontunit = isDesktop ? 20 : ((window.innerWidth > window.innerHeight ? window.innerHeight : window.innerWidth) / 320) * 10;
    document.write('<style type="text/css">' +
        'html,body {font-size:' + (fontunit < 30 ? fontunit : '30') + 'px;}' +
        (isDesktop ? '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position: absolute;}' :
            '#welcome,#GameTimeLayer,#GameLayerBG,#GameScoreLayer.SHADE{position:fixed;}@media screen and (orientation:landscape) {#landscape {display: box; display: -webkit-box; display: -moz-box; display: -ms-flexbox;}}') +
        '</style>');
    let map = {'d': 1, 'f': 2, 'j': 3, 'k': 4};
    // ===== 使用原生 HTML5 Audio（替代 createjs.Sound） =====
    var audioErr = new Audio('./static/music/err.mp3');
    var audioEnd = new Audio('./static/music/end.mp3');
    var audioTap = new Audio('./static/music/tap.mp3');
    // 设置音量（根据需要调整）
    audioErr.volume = 0.5;
    audioEnd.volume = 0.5;
    audioTap.volume = 0.5;
    // ===== 音频对象声明结束 =====

    // ===== 键型系统全局变量 =====
    let keyPattern = ['!'];      // 键型模式数组
    let patternLen = 1;          // 模式长度
    let lastIdx = 0;            // 当前读取到的模式位置
    let lastNotePos = 0;        // 上一个 Note 的轨道位置
    const chs = ['@', '!', '#', '&', '+', '-', '%', '*'];
    // ===== 键型系统结束 =====

    // ===== 键型名称映射 =====
    function getPatternName(pattern) {
        var p = pattern.join('');
        var map = {
            '!': '随机',
            '@': '无纵连',
            '@#': '短纵',
            '2222': '全纵连',
            '3232': '交互',
            '@##': '三纵'
        };
        // 楼梯是动态生成的，单独判断
        var isStair = true;
        var len = pattern.length;
        // 楼梯的特征：1,2,3,4,3,2 或 1,2,3,2,1 等
        if (len >= 4) {
            var half = Math.ceil(len / 2);
            for (var i = 0; i < half; i++) {
                if (parseInt(pattern[i]) !== i + 1) { isStair = false; break; }
            }
            for (var i = half; i < len; i++) {
                if (parseInt(pattern[i]) !== len - i) { isStair = false; break; }
            }
        } else {
            isStair = false;
        }
        if (isStair && len >= 4) {
            return '楼梯';
        }
        return map[p] || p;
    }
    // ===== 键型名称映射结束 =====

    if (isDesktop) {
        document.write('<div id="gameBody">');
        document.onkeydown = function (e) {
            let key = e.key.toLowerCase();
            if (Object.keys(map).indexOf(key) !== -1) {
                click(map[key])
            }
        }
    }

    let body, blockSize, GameLayer = [],
        GameLayerBG, touchArea = [],
        GameTimeLayer;
    let transform, transitionDuration, welcomeLayerClosed;

    let mode = getMode();
    let soundMode = getSoundMode();

    w.init = function() {
        showWelcomeLayer();
        body = document.getElementById('gameBody') || document.body;
        body.style.height = window.innerHeight + 'px';
        transform = typeof (body.style.webkitTransform) != 'undefined' ? 'webkitTransform' : (typeof (body.style.msTransform) !=
        'undefined' ? 'msTransform' : 'transform');
        transitionDuration = transform.replace(/ransform/g, 'ransitionDuration');
        GameTimeLayer = document.getElementById('GameTimeLayer');
        GameLayer.push(document.getElementById('GameLayer1'));
        GameLayer[0].children = GameLayer[0].querySelectorAll('div');
        GameLayer.push(document.getElementById('GameLayer2'));
        GameLayer[1].children = GameLayer[1].querySelectorAll('div');
        GameLayerBG = document.getElementById('GameLayerBG');
        if (GameLayerBG.ontouchstart === null) {
            GameLayerBG.ontouchstart = gameTapEvent;
        } else {
            GameLayerBG.onmousedown = gameTapEvent;
        }
        gameInit();
        initSetting();
        window.addEventListener('resize', refreshSize, false);
    }

    function getMode() {
        return cookie('gameMode') ? parseInt(cookie('gameMode')) : MODE_NORMAL;
    }

    function getSoundMode() {
        // 优先从 localStorage 读取
        var soundFromLS = localStorage.getItem('soundMode');
        if (soundFromLS !== null) {
            return soundFromLS;
        }
        // 没有则从 cookie 读取
        var soundFromCookie = cookie('soundMode');
        if (soundFromCookie) {
            // 迁移到 localStorage
            localStorage.setItem('soundMode', soundFromCookie);
            return soundFromCookie;
        }
        // 默认开启
        localStorage.setItem('soundMode', 'on');
        return 'on';
    }

    w.changeSoundMode = function() {
        var checkbox = document.getElementById('soundSwitch');
        if (soundMode === 'on') {
            soundMode = 'off';
            checkbox.checked = false;
        } else {
            soundMode = 'on';
            checkbox.checked = true;
        }
        localStorage.setItem('soundMode', soundMode);
        cookie('soundMode', soundMode);
    }

    function modeToString(m) {
        return m === MODE_NORMAL ? I18N['normal'] : (m === MODE_ENDLESS ? I18N['endless'] : I18N['practice']);
    }

    w.changeMode = function(m) {
        mode = m;
        cookie('gameMode', m);
        $('#mode').text(modeToString(m));
    }

    w.readyBtn = function() {
        // ===== 激活音频（必须由用户手势触发） =====
        if (soundMode === 'on') {
            // 播放一个极短促、静音的音频来解锁
            audioTap.volume = 0.0;
            audioTap.play().then(function() {
                // 激活成功后立即恢复音量
                audioTap.volume = 0.5;
            }).catch(function(e) {
                // 忽略错误
            });
        }
        // ===== 激活结束 =====
        closeWelcomeLayer();
        updatePanel();
    }

    w.winOpen = function() {
        window.open(location.href + '?r=' + Math.random(), 'nWin', 'height=500,width=320,toolbar=no,menubar=no,scrollbars=no');
        let opened = window.open('about:blank', '_self');
        opened.opener = null;
        opened.close();
    }

    let refreshSizeTime;

    function refreshSize() {
        clearTimeout(refreshSizeTime);
        refreshSizeTime = setTimeout(_refreshSize, 200);
    }

    function _refreshSize() {
        countBlockSize();
        for (let i = 0; i < GameLayer.length; i++) {
            let box = GameLayer[i];
            for (let j = 0; j < box.children.length; j++) {
                let r = box.children[j],
                    rstyle = r.style;
                rstyle.left = (j % 4) * blockSize + 'px';
                rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
                rstyle.width = blockSize + 'px';
                rstyle.height = blockSize + 'px';
            }
        }
        let f, a;
        if (GameLayer[0].y > GameLayer[1].y) {
            f = GameLayer[0];
            a = GameLayer[1];
        } else {
            f = GameLayer[1];
            a = GameLayer[0];
        }
        let y = ((_gameBBListIndex) % 10) * blockSize;
        f.y = y;
        f.style[transform] = 'translate3D(0,' + f.y + 'px,0)';
        a.y = -blockSize * Math.floor(f.children.length / 4) + y;
        a.style[transform] = 'translate3D(0,' + a.y + 'px,0)';
    }

    function countBlockSize() {
        blockSize = body.offsetWidth / 4;
        body.style.height = window.innerHeight + 'px';
        GameLayerBG.style.height = window.innerHeight + 'px';
        touchArea[0] = window.innerHeight;
        touchArea[1] = window.innerHeight - blockSize * 3;
    }

    let _gameBBList = [],
        _gameBBListIndex = 0,
        _gameOver = false,
        _gameStart = false,
        _gameSettingNum=20,
        _gameTime, _gameTimeNum, _gameScore, _date1, deviationTime;

    let _gameStartTime, _gameStartDatetime;

    let _fsj = false;   // 垂直判定开关

    function gameInit() {
        // 已使用原生 HTML5 Audio，无需注册 createjs.Sound
        // 预加载音频（提前缓存，减少首次播放延迟）
        audioTap.load();
        audioErr.load();
        audioEnd.load();
        // ===== 加载自定义打击音效 =====
        var customSound = localStorage.getItem('customTapSound');
        if (customSound) {
            audioTap.src = customSound;
            audioTap.load();
        }
        // ===== 结束 =====
        gameRestart();
    }

    function gameRestart() {
        // ===== 新增：恢复点击 =====
        var layer = document.getElementById('GameLayerBG');
        if (layer) layer.style.pointerEvents = 'auto';
        // ===== 新增结束 =====

        var backBtn = document.getElementById('practiceBackBtn');
        if (backBtn) backBtn.style.display = 'none';

        lastIdx = 0;
        lastNotePos = 0;
        _gameBBList = [];
        _gameBBListIndex = 0;
        _gameScore = 0;
        _gameOver = false;
        _gameStart = false;
        _gameTimeNum = _gameSettingNum;
        _gameStartTime = 0;
        countBlockSize();
        refreshGameLayer(GameLayer[0]);
        refreshGameLayer(GameLayer[1], 1);
        updatePanel();
    }

    function gameStart() {
        // 显示返回键（仅练习模式）
        var backBtn = document.getElementById('practiceBackBtn');
        if (backBtn) {
            backBtn.style.display = (mode === MODE_PRACTICE) ? 'block' : 'none';
        }
        // 原有代码保持不变
        _date1 = new Date();
        _gameStartDatetime = _date1.getTime();
        _gameStart = true;
        _gameTime = setInterval(timer, 1000);
    }

    function getCPS() {
        let cps = _gameScore / ((new Date().getTime() - _gameStartDatetime) / 1000);
        if (isNaN(cps) || cps === Infinity || _gameStartTime < 2) {
            cps = 0;
        }
        return cps;
    }

    function timer() {
        _gameTimeNum--;
        _gameStartTime++;
        if (mode === MODE_NORMAL && _gameTimeNum <= 0) {
            GameTimeLayer.innerHTML = I18N['time-up'] + '!';
            gameOver();
            GameLayerBG.className += ' flash';
            if (soundMode === 'on') {
                // 使用原生 HTML5 Audio 播放结束音效
                audioEnd.currentTime = 0;
                audioEnd.play().catch(function(e) {});
            }
        }
        updatePanel();
    }

    function updatePanel() {
        if (mode === MODE_NORMAL) {
            if (!_gameOver) {
                GameTimeLayer.innerHTML = createTimeText(_gameTimeNum);
            }
        } else if (mode === MODE_ENDLESS) {
            let cps = getCPS();
            let text = (cps === 0 ? I18N['calculating'] : cps.toFixed(2));
            GameTimeLayer.innerHTML = `CPS:${text}`;
        } else {
            GameTimeLayer.innerHTML = `SCORE:${_gameScore}`;
        }
    }

    function foucusOnReplay(){
        $('#replay').focus()
    }

    function gameOver() {
        // ===== 新增：立即禁用点击 =====
        var layer = document.getElementById('GameLayerBG');
        if (layer) layer.style.pointerEvents = 'none';
        // ===== 新增结束 =====

        var backBtn = document.getElementById('practiceBackBtn');
        if (backBtn) backBtn.style.display = 'none';

        _gameOver = true;
        clearInterval(_gameTime);
        let cps = getCPS();
        updatePanel();
        setTimeout(function () {
            GameLayerBG.className = '';
            showGameScoreLayer(cps);
            foucusOnReplay();
        }, 1500);
    }

    function encrypt(text) {
        let encrypt = new JSEncrypt();
        encrypt.setPublicKey("MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDTzGwX6FVKc7rDiyF3H+jKpBlRCV4jOiJ4JR33qZPVXx8ahW6brdBF9H1vdHBAyO6AeYBumKIyunXP9xzvs1qJdRNhNoVwHCwGDu7TA+U4M7G9FArDG0Y6k4LbS0Ks9zeRBMiWkW53yQlPshhtOxXCuZZOMLqk1vEvTCODYYqX5QIDAQAB");
        return encrypt.encrypt(text);
    }

    function SubmitResults() {
        if ($("#username").val() && _gameSettingNum === 20) {
            let httpRequest = new XMLHttpRequest();
            httpRequest.open('POST', './SubmitResults.php', true);
            httpRequest.setRequestHeader("Content-type", "application/json");
            let name = $("#username").val();
            let message = $("#message").val();
            let test = "|_|";
            httpRequest.send(encrypt(_gameScore + test + name + test + tj + test + message));
        }
    }

    function createTimeText(n) {
        return 'TIME:' + Math.ceil(n);
    }

    // ===== 键型系统核心函数 =====
    function Randomfrom(Min, Max) {
        let Range = Max - Min;
        let Rand = Math.random();
        let num = Min + Math.round(Rand * Range);
        return num;
    }

    function filterPattern() {
        let tmp = [];
        patternLen = keyPattern.length;
        for (let i = 0; i < patternLen; ++i) {
            if (chs.includes(keyPattern[i]) || (keyPattern[i] >= '1' && keyPattern[i] <= '4')) {
                tmp.push(keyPattern[i]);
            }
        }
        keyPattern = tmp;
        if (keyPattern.length === 0) {
            keyPattern = ['!'];
        }
        patternLen = keyPattern.length;
    }

    function randomPos() {
        let x = 0;
        let current = keyPattern[lastIdx];
        
        if (current === '!') {
            x = Math.floor(Math.random() * 1000) % 4;
        }
        else if (current === '@') {
            x = Math.floor(Math.random() * 1000) % 4;
            if (x === lastNotePos) {
                x = (x + 1) % 4;
            }
        }
        else if (current === '#') {
            x = lastNotePos;
        }
        else if (current === '&') {
            x = 3 - lastNotePos;
        }
        else if (current === '+') {
            let num = parseInt(keyPattern[lastIdx + 1]);
            lastIdx++;
            x = (lastNotePos + num) % 4;
        }
        else if (current === '-') {
            let num = parseInt(keyPattern[lastIdx + 1]);
            lastIdx++;
            x = (lastNotePos - num + 4) % 4;
        }
        else if (current === '%') {
            let num1 = parseInt(keyPattern[lastIdx + 1]) - 1;
            let num2 = parseInt(keyPattern[lastIdx + 2]) - 1;
            if (num2 < num1) {
                num2 += 4;
            }
            x = Randomfrom(num1, num2) % 4;
            lastIdx += 2;
        }
        else if (current === '*') {
            let l = parseInt(keyPattern[lastIdx + 1]);
            let nums = [];
            for (let i = 1; i <= l; ++i) {
                nums.push(parseInt(keyPattern[lastIdx + i + 1]) - 1);
            }
            lastIdx += l + 1;
            x = nums[Randomfrom(0, l - 1)];
        }
        else {
            x = parseInt(current) - 1;
        }
        lastNotePos = x;
        lastIdx++;
        if (lastIdx === patternLen) {
            lastIdx = 0;
        }
        return x;
    }
    // ===== 键型系统结束 =====

    let _ttreg = / t{1,2}(\d+)/,
        _clearttClsReg = / t{1,2}\d+| bad/;

    function refreshGameLayer(box, loop, offset) {
        let i = randomPos() + (loop ? 0 : 4);
        for (let j = 0; j < box.children.length; j++) {
            let r = box.children[j], rstyle = r.style;
            rstyle.left = (j % 4) * blockSize + 'px';
            rstyle.bottom = Math.floor(j / 4) * blockSize + 'px';
            rstyle.width = blockSize + 'px';
            rstyle.height = blockSize + 'px';
            r.className = r.className.replace(_clearttClsReg, '');
            if (i === j) {
                _gameBBList.push({
                    cell: i % 4,
                    id: r.id
                });
                r.className += ' t' + (Math.floor(Math.random() * 1000) % 5 + 1);
                r.notEmpty = true;
                i = (Math.floor(j / 4) + 1) * 4 + randomPos();
            } else {
                r.notEmpty = false;
            }
        }
        if (loop) {
            box.style.webkitTransitionDuration = '0ms';
            box.style.display = 'none';
            box.y = -blockSize * (Math.floor(box.children.length / 4) + (offset || 0)) * loop;
            setTimeout(function () {
                box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
                setTimeout(function () {
                    box.style.display = 'block';
                }, 100);
            }, 200);
        } else {
            box.y = 0;
            box.style[transform] = 'translate3D(0,' + box.y + 'px,0)';
        }
        box.style[transitionDuration] = '150ms';
    }

    function gameLayerMoveNextRow() {
        for (let i = 0; i < GameLayer.length; i++) {
            let g = GameLayer[i];
            g.y += blockSize;
            if (g.y > blockSize * (Math.floor(g.children.length / 4))) {
                refreshGameLayer(g, 1, -1);
            } else {
                g.style[transform] = 'translate3D(0,' + g.y + 'px,0)';
            }
        }
    }

    function gameTapEvent(e) {
        if (_gameOver) {
            return false;
        }
        var tar = e.target;
        var y = e.clientY || e.targetTouches[0].clientY,
            x = (e.clientX || e.targetTouches[0].clientX) - body.offsetLeft,
            p = _gameBBList[_gameBBListIndex];

        // ===== 垂直判定：如果开启，忽略 y 坐标限制 =====
        if (!_fsj) {
            if (y > touchArea[0] || y < touchArea[1]) {
                return false;
            }
        }
        // ===== 垂直判定结束 =====

        // 判断是否命中该 Note
        var hit = false;
        if (_fsj) {
            // 垂直判定模式：只检查列号
            var col = Math.floor(x / blockSize);
            if (col === p.cell) {
                hit = true;
            }
        } else {
            // 原有判定逻辑
            if ((p.id === tar.id && tar.notEmpty) || (p.cell === 0 && x < blockSize) || (p.cell === 1 && x > blockSize && x < 2 * blockSize) || (p.cell === 2 && x > 2 * blockSize && x < 3 * blockSize) || (p.cell === 3 && x > 3 * blockSize)) {
                hit = true;
            }
        }

        if (hit) {
            if (!_gameStart) {
                gameStart();
            }
            if (soundMode === 'on') {
                audioTap.currentTime = 0;
                audioTap.play().catch(function(e) {});
            }
            tar = document.getElementById(p.id);
            tar.className = tar.className.replace(_ttreg, ' tt$1');
            _gameBBListIndex++;
            _gameScore++;
            updatePanel();
            gameLayerMoveNextRow();
        } else if (_gameStart && !tar.notEmpty) {
            if (soundMode === 'on') {
                audioErr.currentTime = 0;
                audioErr.play().catch(function(e) {});
            }
            tar.classList.add('bad');
            if (mode === MODE_PRACTICE) {
                setTimeout(function() {
                    tar.classList.remove('bad');
                }, 500);
            } else {
                gameOver();
            }
        }
        return false;
    }

    function createGameLayer() {
        let html = '<div id="GameLayerBG">';
        for (let i = 1; i <= 2; i++) {
            let id = 'GameLayer' + i;
            html += '<div id="' + id + '" class="GameLayer">';
            for (let j = 0; j < 10; j++) {
                for (let k = 0; k < 4; k++) {
                    html += '<div id="' + id + '-' + (k + j * 4) + '" num="' + (k + j * 4) + '" class="block' + (k ? ' bl' : '') +
                        '"></div>';
                }
            }
            html += '</div>';
        }
        html += '</div>';
        html += '<div id="GameTimeLayer" class="text-center"></div>';
        return html;
    }

    function closeWelcomeLayer() {
        welcomeLayerClosed = true;
        $('#welcome').css('display', 'none');
        updatePanel();
    }

    function showWelcomeLayer() {
        welcomeLayerClosed = false;
        $('#mode').text(modeToString(mode));
        $('#welcome').css('display', 'block');
    }

    function getBestScore(score) {
        var modeKey = (mode === MODE_NORMAL) ? 'normal' : 'endless';
        var patternKey = keyPattern.join('') || 'default';
        var storageKey = 'best_' + modeKey + '_' + patternKey;
        var stored = localStorage.getItem(storageKey);
        var best = stored ? Math.max(parseFloat(stored), score) : score;
        localStorage.setItem(storageKey, best.toString());
        return best;
    }

    function scoreToString(score) {
        return mode === MODE_ENDLESS ? score.toFixed(2) : score.toString();
    }

    function legalDeviationTime() {
        return deviationTime < (_gameSettingNum + 3) * 1000;
    }

    function showGameScoreLayer(cps) {
        let l = $('#GameScoreLayer');
        let c = $(`#${_gameBBList[_gameBBListIndex - 1].id}`).attr('class').match(_ttreg)[1];
        let score = (mode === MODE_ENDLESS ? cps : _gameScore);
        let best = getBestScore(score);
        l.attr('class', l.attr('class').replace(/bgc\d/, 'bgc' + c));
        $('#GameScoreLayer-text').html(shareText(cps));
        let normalCond = legalDeviationTime() || mode !== MODE_NORMAL;
        l.css('color', normalCond ? '': 'red');

        $('#cps').text(cps.toFixed(2));
        $('#score').text(scoreToString(score));
        $('#GameScoreLayer-score').css('display', mode === MODE_ENDLESS ? 'none' : '');
        $('#best').text(scoreToString(best));

        // ===== 显示当前键型（统一样式） =====
        var patternName = getPatternName(keyPattern);
        $('#pattern-display').text(patternName);
        // ===== 结束 =====

        l.css('display', 'block');
    }

    function hideGameScoreLayer() {
        $('#GameScoreLayer').css('display', 'none');
    }

    w.replayBtn = function() {
        gameRestart();
        hideGameScoreLayer();
    }

    w.exitPractice = function() {
        if (mode !== MODE_PRACTICE) return;
        _gameOver = true;
        clearInterval(_gameTime);
        gameRestart();
        hideGameScoreLayer();
        showWelcomeLayer();
        var backBtn = document.getElementById('practiceBackBtn');
        if (backBtn) backBtn.style.display = 'none';
    }

    w.backBtn = function() {
        gameRestart();
        hideGameScoreLayer();
        showWelcomeLayer();
    }

    function shareText(cps) {
        if (mode === MODE_NORMAL) {
            let date2 = new Date();
            deviationTime = (date2.getTime() - _date1.getTime())
            if (!legalDeviationTime()) {
                return I18N['time-over'] + ((deviationTime / 1000) - _gameSettingNum).toFixed(2) + 's';
            }
            SubmitResults();
        }

        // 读取评级开关和自定义名称
        var showRating = localStorage.getItem('showRating');
        if (showRating === null) showRating = 'true';
        if (showRating === 'false') return '';

        var names = [];
        for (var i = 1; i <= 5; i++) {
            var name = localStorage.getItem('levelName' + i);
            if (name && name.trim() !== '') {
                names.push(name.trim());
            } else {
                names.push(I18N['text-level-' + i] || 'LV' + i);
            }
        }

        if (cps <= 5) return names[0];
        if (cps <= 8) return names[1];
        if (cps <= 10) return names[2];
        if (cps <= 15) return names[3];
        return names[4];
    }

    function toStr(obj) {
        if (typeof obj === 'object') {
            return JSON.stringify(obj);
        } else {
            return obj;
        }
    }

    function cookie(name, value, time) {
        if (name) {
            if (value) {
                if (time) {
                    let date = new Date();
                    date.setTime(date.getTime() + 864e5 * time), time = date.toGMTString();
                }
                return document.cookie = name + "=" + escape(toStr(value)) + (time ? "; expires=" + time + (arguments[3] ?
                    "; domain=" + arguments[3] + (arguments[4] ? "; path=" + arguments[4] + (arguments[5] ? "; secure" : "") : "") :
                    "") : ""), !0;
            }
            return value = document.cookie.match("(?:^|;)\\s*" + name.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1") + "=([^;]*)"),
                value = value && "string" == typeof value[1] ? unescape(value[1]) : !1, (/^(\{|\[).+\}|\]$/.test(value) ||
                /^[0-9]+$/g.test(value)) && eval("value=" + value), value;
        }
        let data = {};
        value = document.cookie.replace(/\s/g, "").split(";");
        for (let i = 0; value.length > i; i++) name = value[i].split("="), name[1] && (data[name[0]] = unescape(name[1]));
        return data;
    }

    document.write(createGameLayer());

    // ===== 键型预设按钮函数（已保存到 cookie） =====
    w.setPattern = function(pattern) {
        keyPattern = pattern.split('');
        filterPattern();
        cookie('pattern', keyPattern.join(''), 100);
        gameRestart();
    }

    w.setStair = function() {
        keyPattern = [];
        for (let i = 1; i < 4; ++i) {
            keyPattern.push(i.toString());
        }
        for (let i = 4; i > 1; --i) {
            keyPattern.push(i.toString());
        }
        patternLen = keyPattern.length;
        cookie('pattern', keyPattern.join(''), 100);
        gameRestart();
    }
    // ===== 键型预设结束 =====

    // ===== 修改后的  =====
    function initSetting() {
        $("#username").val(cookie("username") ? cookie("username") : "");
        $("#message").val(cookie("message") ? cookie("message") : "");

        // ===== 读取标题 =====
        var titleFromLS = localStorage.getItem('title');
        var titleFromCookie = cookie('title');
        if (titleFromLS) {
            // 更新浏览器标签标题
            $('title').text(titleFromLS);
            // 更新设置输入框
            $('#title').val(titleFromLS);
            // ★ 同步更新主页大标题
            $('[data-i18n="game-title"]').text(titleFromLS);
        } else if (titleFromCookie) {
            $('title').text(titleFromCookie);
            $('#title').val(titleFromCookie);
            $('[data-i18n="game-title"]').text(titleFromCookie);
            localStorage.setItem('title', titleFromCookie);
        } else {
            // 无自定义标题，恢复默认（来自 I18N）
            var defaultTitle = I18N ? I18N['game-title'] : 'oshit!';
            $('title').text(defaultTitle);
            $('#title').val('');
            $('[data-i18n="game-title"]').text(defaultTitle);
            // 清除存储
            localStorage.removeItem('title');
            cookie('title', '', -1);
        }
        // ===== 标题读取结束 =====

        // 键盘、时间、键型等原有逻辑保持不变
        let keyboard = cookie('keyboard');
        if (keyboard) {
            keyboard = keyboard.toString().toLowerCase();
            $("#keyboard").val(keyboard);
            map = {}
            map[keyboard.charAt(0)] = 1;
            map[keyboard.charAt(1)] = 2;
            map[keyboard.charAt(2)] = 3;
            map[keyboard.charAt(3)] = 4;
        }

        var timeFromLS = localStorage.getItem('gameTime');
        var timeFromCookie = cookie('gameTime');
        if (timeFromLS) {
            $('#gameTime').val(timeFromLS);
            _gameSettingNum = parseInt(timeFromLS);
        } else if (timeFromCookie) {
            $('#gameTime').val(timeFromCookie);
            _gameSettingNum = parseInt(timeFromCookie);
            localStorage.setItem('gameTime', timeFromCookie);
        } else {
            $('#gameTime').val('20');
            _gameSettingNum = 20;
            localStorage.removeItem('gameTime');
            cookie('gameTime', '', -1);
        }
        if (_gameSettingNum) {
            gameRestart();
        }

        if (cookie('pattern')) {
            keyPattern = cookie('pattern').split('');
            filterPattern();
            gameRestart();
        }

        // 读取垂直判定
        var fsjFromLS = localStorage.getItem('fsj');
        if (fsjFromLS === 'true') {
            _fsj = true;
        } else {
            _fsj = false;
        }
        document.getElementById('verticalJudge').checked = _fsj;
        // 读取垂直判定结束

        // ===== 新增：同步音效开关 =====
        var soundCheckbox = document.getElementById('soundSwitch');
        if (soundCheckbox) {
            soundCheckbox.checked = (soundMode === 'on');
        }
        // ===== 音效开关同步结束 =====
        
        // ===== 读取评级设置 =====
        var showRating = localStorage.getItem('showRating');
        if (showRating !== null) {
            document.getElementById('showRatingSwitch').checked = (showRating === 'true');
        } else {
            document.getElementById('showRatingSwitch').checked = true;
        }
        for (var i = 1; i <= 5; i++) {
            var val = localStorage.getItem('levelName' + i);
            if (val) document.getElementById('levelName' + i).value = val;
        }
        // ===== 评级设置读取结束 =====
    }

    w.show_btn = function() {
        $("#btn_group,#desc").css('display', 'block');
        $('#setting').css('display', 'none');
        $('#setting-footer').css('display', 'none');  // 隐藏底部按钮
    }

    w.show_setting = function() {
        $('#btn_group,#desc').css('display', 'none');
        $('#setting').css('display', 'block');
        $('#setting-footer').css('display', 'flex');

        // ===== 从存储恢复垂直判定状态 =====
        var fsjStored = localStorage.getItem('fsj');
        if (fsjStored !== null) {
            _fsj = (fsjStored === 'true');
        } else {
            // 兼容旧 cookie（如有）
            var cookieVal = cookie('fsj');
            if (cookieVal !== null) {
                _fsj = (cookieVal === '1');
            } else {
                _fsj = false;   // 默认关闭
            }
        }
        // 同步垂直判定开关
        document.getElementById('verticalJudge').checked = _fsj;

        // 同步音效开关
        var checkbox = document.getElementById('soundSwitch');
        if (checkbox) {
            checkbox.checked = (soundMode === 'on');
        }

        // ===== 同步评级设置 =====
        var showRating = localStorage.getItem('showRating');
        if (showRating !== null) {
            document.getElementById('showRatingSwitch').checked = (showRating === 'true');
        } else {
            document.getElementById('showRatingSwitch').checked = true;
        }
        for (var i = 1; i <= 5; i++) {
            var val = localStorage.getItem('levelName' + i);
            if (val) {
                document.getElementById('levelName' + i).value = val;
            }
        }
        // ===== 评级设置同步结束 =====
    }

    w.save_cookie = function() {
        const settings = ['username', 'message', 'keyboard', 'title', 'gameTime'];
        for (let s of settings) {
            let value = $(`#${s}`).val();
            if (value && value.trim() !== '') {
                cookie(s, value.toString(), 100);
                if (s === 'title' || s === 'gameTime') {
                    localStorage.setItem(s, value.toString());
                }
            } else {
                cookie(s, '', -1);
                if (s === 'title' || s === 'gameTime') {
                    localStorage.removeItem(s);
                }
            }
        }

        // ===== 保存垂直判定 =====
        var fsjChecked = document.getElementById('verticalJudge').checked;
        _fsj = fsjChecked;
        localStorage.setItem('fsj', fsjChecked.toString());
        cookie('fsj', fsjChecked ? '1' : '0', 100);
        // ===== 垂直判定保存结束 =====

        // ===== 新增：保存音效开关 =====
        var soundChecked = document.getElementById('soundSwitch').checked;
        soundMode = soundChecked ? 'on' : 'off';
        localStorage.setItem('soundMode', soundMode);
        cookie('soundMode', soundMode);
        // ===== 音效开关保存结束 =====

        // ===== 保存评级设置 =====
        var showRating = document.getElementById('showRatingSwitch').checked;
        localStorage.setItem('showRating', showRating ? 'true' : 'false');
        for (var i = 1; i <= 5; i++) {
            var val = document.getElementById('levelName' + i).value.trim();
            localStorage.setItem('levelName' + i, val);
        }
        // ===== 评级设置保存结束 =====

        initSetting();
    }

    // ===== 自定义打击音效保存 =====
    w.saveCustomSound = function(e) {
        var file = e.target.files[0];
        if (file) {
            var reader = new FileReader();
            reader.onload = function(ev) {
                var dataUrl = ev.target.result;
                localStorage.setItem('customTapSound', dataUrl);
                audioTap.src = dataUrl;
                audioTap.load();
                alert('打击音效已更新！');
            };
            reader.readAsDataURL(file);
        }
    }

    w.resetCustomSound = function() {
        localStorage.removeItem('customTapSound');
        audioTap.src = './static/music/tap.mp3';
        audioTap.load();
        alert('已恢复默认打击音效');
    }
    // ===== 结束 =====

    function isnull(val) {
        let str = val.replace(/(^\s*)|(\s*$)/g, '');
        return str === '' || str === undefined || str == null;
    }

    w.goRank = function() {
        let name = $("#username").val();
        let link = './rank.php';
        if (!isnull(name)) {
            link += "?name=" + name;
        }
        window.location.href = link;
    }

    function click(index) {
        if (!welcomeLayerClosed) {
            return;
        }

        let p = _gameBBList[_gameBBListIndex];
        let base = parseInt($(`#${p.id}`).attr("num")) - p.cell;
        let num = base + index - 1;
        let id = p.id.substring(0, 11) + num;

        let fakeEvent = {
            clientX: ((index - 1) * blockSize + index * blockSize) / 2 + body.offsetLeft,
            clientY: (touchArea[0] + touchArea[1]) / 2,
            target: document.getElementById(id),
        };

        gameTapEvent(fakeEvent);
    }

    const clickBeforeStyle = $('<style></style>');
    const clickAfterStyle = $('<style></style>');
    clickBeforeStyle.appendTo($(document.head));
    clickAfterStyle.appendTo($(document.head));

    function saveImage(dom, callback) {
        if (dom.files && dom.files[0]) {
            let reader = new FileReader();
            reader.onload = function() {
                callback(this.result);
            }
            reader.readAsDataURL(dom.files[0]);
        }
    }

    w.getClickBeforeImage = function() {
        $('#click-before-image').click();
    }

    w.saveClickBeforeImage = function() {
        const img = document.getElementById('click-before-image');
        saveImage(img, r => {
            clickBeforeStyle.html(`
                .t1, .t2, .t3, .t4, .t5 {
                   background-size: auto 100%;
                   background-image: url(${r});
            }`);
        })
    }

    w.getClickAfterImage = function() {
        $('#click-after-image').click();
    }

    w.saveClickAfterImage = function() {
        const img = document.getElementById('click-after-image');
        saveImage(img, r => {
            clickAfterStyle.html(`
                .tt1, .tt2, .tt3, .tt4, .tt5 {
                  background-size: auto 86%;
                  background-image: url(${r});
            }`);
        })
    }
}) (window);
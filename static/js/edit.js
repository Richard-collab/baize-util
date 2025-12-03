        // ============================================
        // Atomic Utility Functions
        // ============================================
        
        // DOM Element Selection
        function getElementByIdSafe(id) {
            return document.getElementById(id);
        }
        
        function querySelectorAllSafe(selector) {
            return document.querySelectorAll(selector);
        }
        
        // Class Management
        function addClassToElement(element, className) {
            if (element) element.classList.add(className);
        }
        
        function removeClassFromElement(element, className) {
            if (element) element.classList.remove(className);
        }
        
        function hasClassOnElement(element, className) {
            return element ? element.classList.contains(className) : false;
        }
        
        // Content Management
        function setElementTextContent(element, text) {
            if (element) element.textContent = text;
        }
        
        function setElementInnerHTML(element, html) {
            if (element) element.innerHTML = html;
        }
        
        // Button State
        function disableElement(element) {
            if (element) element.disabled = true;
        }
        
        function enableElement(element) {
            if (element) element.disabled = false;
        }
        
        // Math Utilities
        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }
        
        function roundToDecimal(value, decimals) {
            const factor = Math.pow(10, decimals);
            return Math.round(value * factor) / factor;
        }
        
        // Time Utilities
        function secondsToMilliseconds(seconds) {
            return Math.floor(seconds * 1000);
        }
        
        function millisecondsToSeconds(milliseconds) {
            return milliseconds / 1000;
        }
        
        // Audio Buffer Utilities
        function createNewAudioBuffer(context, channels, length, sampleRate) {
            return context.createBuffer(channels, length, sampleRate);
        }
        
        function getChannelDataFromBuffer(buffer, channel) {
            return buffer.getChannelData(channel);
        }
        
        // URL Utilities
        function createBlobURL(blob) {
            return URL.createObjectURL(blob);
        }
        
        function revokeBlobURL(url) {
            if (url) URL.revokeObjectURL(url);
        }
        
        // Array Utilities
        function createArrayOfLength(length, fillValue = undefined) {
            return new Array(length).fill(fillValue);
        }
        
        function filterArray(array, predicate) {
            return array.filter(predicate);
        }
        
        // Async Utilities
        function createDelay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // ============================================
        // State Management
        // ============================================
        
        // 主要变量
        let audioContext;
        let audioBuffer = null;
        let sourceNode = null;
        let gainNode = null;
        let isPlaying = false;
        let isLooping = false;
        console.log('[Init] Audio playback variables initialized. isLooping:', isLooping, 'isPlaying:', isPlaying);
        let startTime = 0;
        let pauseTime = 0;
        let currentAudioId = null;
        let selectionStart = 0;
        let selectionEnd = 0;
        let isSelecting = false;
        let clips = [];
        let audioFiles = [];
        let isDraggingSelection = false;
        let dragTarget = null; // 'start', 'end', 'selection'
        let dragStartX = 0;
        let dragStartSelectionStart = 0;
        let dragStartSelectionEnd = 0;
        
        // 新增：剪贴板变量
        let clipboard = null; // { arrayBuffer, sampleRate, numberOfChannels, duration }
        
        // 新增：缩放和滚动相关变量
        let zoomLevel = 1.0; // 初始缩放级别
        let scrollPosition = 0; // 滚动位置（像素）
        let isDraggingScroll = false;
        let dragStartScrollX = 0;
        let dragStartThumbX = 0;
        let waveformCanvas = null;
        let waveformCtx = null;
        let waveformWidth = 0;
        let waveformHeight = 0;
        
        // 新增：峰值采样相关变量
        let peakData = null; // 存储峰值数据
        let peakDataLength = 0; // 峰值数据长度
        let originalAudioData = null; // 存储原始音频数据
        
        // 新增：当前音频文件名
        let currentFileName = "audio_export.wav";
        
        // 新增：响度控制相关变量
        let amplitudeScale = 1.0; // 响度缩放因子
        let isDraggingAmplitude = false; // 是否正在拖动响度滑块
        let tempAmplitudeScale = 1.0; // 临时响度缩放因子（用于拖动过程中的预览）
        
        // IndexedDB 相关变量
        let db = null;
        const DB_NAME = 'AudioEditorDB';
        const DB_VERSION = 1;
        const STORE_AUDIO_FILES = 'audioFiles';
        const STORE_CLIPS = 'clips';
        const STORE_STATE = 'state';
        
        // 撤销/恢复系统
        let undoStack = [];
        let redoStack = [];
        const MAX_HISTORY = 50; // 最大历史记录数量
        
        // DOM元素
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const audioList = document.getElementById('audioList');
        const clearAudioListBtn = document.getElementById('clearAudioListBtn');
        const waveform = document.getElementById('waveform');
        const playhead = document.getElementById('playhead');
        const selection = document.getElementById('selection');
        const selectionStartHandle = document.getElementById('selectionStartHandle');
        const selectionEndHandle = document.getElementById('selectionEndHandle');
        const loopBtn = document.getElementById('loopBtn');
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');
        const currentTimeEl = document.getElementById('currentTime');
        const durationEl = document.getElementById('duration');
        const selectionTimeEl = document.getElementById('selectionTime');
        const progressBar = document.getElementById('progressBar');
        const cutBtn = document.getElementById('cutBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const saveClipBtn = document.getElementById('saveClipBtn');
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        const clipList = document.getElementById('clipList');
        const mergeBtn = document.getElementById('mergeBtn');
        const clearClipsBtn = document.getElementById('clearClipsBtn');
        const statusMessage = document.getElementById('statusMessage');
        const autoSaveStatus = document.getElementById('autoSaveStatus');
        
        // 新增：复制、剪切和粘贴按钮
        const copyBtn = document.getElementById('copyBtn');
        const cutToClipboardBtn = document.getElementById('cutToClipboardBtn');
        const pasteBtn = document.getElementById('pasteBtn');
        
        // 新增：缩放和滚动相关DOM元素
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomSlider = document.getElementById('zoomSlider');
        const zoomValue = document.getElementById('zoomValue');
        const resetZoomBtn = document.getElementById('resetZoomBtn');
        const scrollContainer = document.getElementById('scrollContainer');
        const scrollContent = document.getElementById('scrollContent');
        const scrollThumb = document.getElementById('scrollThumb');
        
        // 新增：导出按钮
        const exportBtn = document.getElementById('exportBtn');
        
        // 新增：响度控制DOM元素
        const amplitudeSlider = document.getElementById('amplitudeSlider');
        const amplitudeValue = document.getElementById('amplitudeValue');
        
        // 初始化
        document.addEventListener('DOMContentLoaded', async function() {
            await initIndexedDB();
            initAudioContext();
            setupEventListeners();
            await loadFromIndexedDB();
            updateUI();
            
            // 设置自动保存
            setInterval(saveToIndexedDB, 5000);
        });
        
        // 初始化 IndexedDB
        function initIndexedDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                
                request.onerror = () => {
                    console.error('IndexedDB 初始化失败');
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    db = request.result;
                    console.log('IndexedDB 初始化成功');
                    resolve();
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    // 创建音频文件存储
                    if (!db.objectStoreNames.contains(STORE_AUDIO_FILES)) {
                        const audioFilesStore = db.createObjectStore(STORE_AUDIO_FILES, { keyPath: 'id' });
                        audioFilesStore.createIndex('name', 'name', { unique: false });
                    }
                    
                    // 创建音频片段存储
                    if (!db.objectStoreNames.contains(STORE_CLIPS)) {
                        const clipsStore = db.createObjectStore(STORE_CLIPS, { keyPath: 'id' });
                        clipsStore.createIndex('name', 'name', { unique: false });
                    }
                    
                    // 创建状态存储
                    if (!db.objectStoreNames.contains(STORE_STATE)) {
                        db.createObjectStore(STORE_STATE, { keyPath: 'id' });
                    }
                };
            });
        }
        
        // 初始化音频上下文
        function initAudioContext() {
            try {
                // 始终使用8kHz采样率
                audioContext = new AudioContext({sampleRate: 8000});
                statusMessage.textContent = "音频上下文已初始化 (8kHz)";
            } catch (e) {
                statusMessage.textContent = "您的浏览器不支持Web Audio API";
                console.error("Web Audio API is not supported in this browser", e);
            }
        }
        
        // 设置事件监听器
        function setupEventListeners() {
            // 文件上传
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.background = 'rgba(52, 152, 219, 0.1)';
            });
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.background = '';
            });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.background = '';
                handleFiles(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', () => handleFiles(fileInput.files));
            
            // 清空音频列表
            clearAudioListBtn.addEventListener('click', clearAudioList);
            
            // 播放控制
            loopBtn.addEventListener('click', toggleLoop);
            playBtn.addEventListener('click', playAudio);
            pauseBtn.addEventListener('click', pauseAudio);
            stopBtn.addEventListener('click', stopAudio);
            
            // 提取控制
            cutBtn.addEventListener('click', cutAudio);
            deleteBtn.addEventListener('click', deleteSelection);
            saveClipBtn.addEventListener('click', saveClip);
            
            // 新增：复制、剪切和粘贴按钮
            copyBtn.addEventListener('click', copyToClipboard);
            cutToClipboardBtn.addEventListener('click', cutToClipboard);
            pasteBtn.addEventListener('click', pasteFromClipboard);
            
            // 新增：导出按钮
            exportBtn.addEventListener('click', exportAudio);
            
            // 撤销/恢复
            undoBtn.addEventListener('click', undo);
            redoBtn.addEventListener('click', redo);
            
            // 片段管理
            mergeBtn.addEventListener('click', mergeClips);
            clearClipsBtn.addEventListener('click', clearClips);
            
            // 波形点击事件
            waveform.addEventListener('mousedown', handleWaveformMouseDown);
            
            // 键盘快捷键
            document.addEventListener('keydown', handleKeyDown);
            
            // 鼠标移动和释放事件
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            // 新增：缩放和滚动事件
            zoomOutBtn.addEventListener('click', () => adjustZoom(-0.1));
            zoomInBtn.addEventListener('click', () => adjustZoom(0.1));
            zoomSlider.addEventListener('input', () => {
                setZoom(parseFloat(zoomSlider.value));
            });
            resetZoomBtn.addEventListener('click', resetZoom);
            
            // 滚动条事件
            scrollThumb.addEventListener('mousedown', handleScrollThumbMouseDown);
            scrollContainer.addEventListener('mousedown', handleScrollContainerMouseDown);
            
            // 新增：滚轮缩放事件
            waveform.addEventListener('wheel', handleWaveformWheel, { passive: false });
            
            // 新增：响度控制事件
            amplitudeSlider.addEventListener('input', handleAmplitudeChange);
            amplitudeSlider.addEventListener('mousedown', () => {
                isDraggingAmplitude = true;
                // 保存当前状态作为临时状态，用于预览
                tempAmplitudeScale = amplitudeScale;
            });
            amplitudeSlider.addEventListener('mouseup', handleAmplitudeChangeEnd);
            
            // 窗口大小变化时重新绘制波形
            window.addEventListener('resize', () => {
                if (audioBuffer) {
                    drawWaveform();
                }
            });
        }
        
        // 新增：处理响度变化
        function handleAmplitudeChange(e) {
            if (!audioBuffer) return;
            
            const value = parseFloat(e.target.value);
            tempAmplitudeScale = value;
            amplitudeValue.textContent = `${Math.round(value * 100)}%`;
            
            // 实时更新波形显示
            if (audioBuffer) {
                drawWaveform();
            }
            
            statusMessage.textContent = `响度调整: ${Math.round(value * 100)}%`;
        }
        
        // 新增：处理响度变化结束
        function handleAmplitudeChangeEnd(e) {
            if (!audioBuffer) return;
            
            isDraggingAmplitude = false;
            const value = parseFloat(e.target.value);
            
            // 保存状态到历史记录
            saveStateToHistory('响度调整');
            
            // 应用响度调整
            applyAmplitudeScale(value);

            // 延迟重置滑块，确保事件处理完成
            setTimeout(() => {
                amplitudeSlider.value = 1.0;
                amplitudeValue.textContent = '100%';
                tempAmplitudeScale = 1.0;
            }, 100);
            
            statusMessage.textContent = `已应用响度调整: ${Math.round(value * 100)}%`;
        }
        
        // 新增：应用响度缩放
        function applyAmplitudeScale(scale) {
            if (!audioBuffer) return;
            
            // 确定调整范围
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const hasSelection = end > start;
            
            if (hasSelection) {
                // 只调整选中区域
                const startSample = Math.floor(start * audioBuffer.sampleRate);
                const endSample = Math.floor(end * audioBuffer.sampleRate);
                
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    for (let i = startSample; i < endSample; i++) {
                        channelData[i] = Math.max(-1, Math.min(1, channelData[i] * scale));
                    }
                }
            } else {
                // 调整整个音频
                for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                    const channelData = audioBuffer.getChannelData(channel);
                    for (let i = 0; i < channelData.length; i++) {
                        channelData[i] = Math.max(-1, Math.min(1, channelData[i] * scale));
                    }
                }
            }
            
            // 更新原始音频数据
            originalAudioData = audioBuffer.getChannelData(0);
            
            // 重新生成峰值数据
            generatePeakData();
            
            // 重新绘制波形
            drawWaveform();
            
            // 注意：这里只修改主音频，不影响已暂存的片段
            // 因为暂存的片段已经创建了独立的副本
        }
        
        // 导出音频
        function exportAudio() {
            if (!audioBuffer) {
                statusMessage.textContent = '请先加载音频';
                return;
            }
            
            // 将AudioBuffer转换为WAV文件
            const wavBlob = audioBufferToWav(audioBuffer);
            const url = URL.createObjectURL(wavBlob);
            
            // 创建下载链接
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFileName;
            document.body.appendChild(a);
            a.click();
            
            // 清理
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            
            statusMessage.textContent = `已导出音频: ${currentFileName}`;
        }
        
        // 处理波形滚轮事件
        function handleWaveformWheel(e) {
            if (!audioBuffer) return;
            
            e.preventDefault();
            
            // 计算鼠标位置对应的时间
            const rect = waveform.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            // 计算鼠标位置对应的当前时间
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            const mouseTime = visibleStartTime + (mouseX / waveformWidth) * (visibleEndTime - visibleStartTime);
            
            // 确定缩放方向（向下滚动放大，向上滚动缩小）
            const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
            
            // 保存当前缩放级别和滚动位置
            const oldZoomLevel = zoomLevel;
            const oldScrollPosition = scrollPosition;
            
            // 计算新的缩放级别
            let newZoom = zoomLevel + zoomDelta;
            
            // 限制缩放范围
            if (newZoom < 1.0) {
                newZoom = 1.0;
            }
            if (newZoom > 25.0) {
                newZoom = 25.0;
                statusMessage.textContent = "已达到最大缩放级别 (2500%)";
            }
            
            // 更新缩放级别
            zoomLevel = newZoom;
            zoomSlider.value = zoomLevel;
            zoomValue.textContent = `${Math.round(zoomLevel * 100)}%`;
            
            // 计算新的滚动位置，使鼠标位置的时间保持不变
            const newVisibleDuration = audioBuffer.duration / zoomLevel;
            const newVisibleStartTime = mouseTime - (mouseX / waveformWidth) * newVisibleDuration;
            
            // 确保新的滚动位置在有效范围内
            const maxScroll = waveformWidth * (zoomLevel - 1);
            scrollPosition = Math.max(0, Math.min((newVisibleStartTime / audioBuffer.duration) * (waveformWidth * zoomLevel), maxScroll));
            
            // 更新滚动条
            updateScrollBar();
            
            // 重新绘制波形
            if (audioBuffer) {
                drawWaveform();
            }
            
            // 更新播放头位置
            updatePlayhead();
            
            // 更新选择区域显示
            updateSelectionDisplay();
            
            statusMessage.textContent = `缩放级别: ${Math.round(zoomLevel * 100)}%`;
        }
        
        // 复制到剪贴板
        function copyToClipboard() {
            if (!audioBuffer || selectionStart === selectionEnd) {
                statusMessage.textContent = '请先选择要复制的区域';
                return;
            }
            
            // 使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const duration = end - start;
            
            // 创建新的AudioBuffer存储复制内容
            const copyBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                duration * audioBuffer.sampleRate,
                audioBuffer.sampleRate
            );
            
            // 复制选中的数据到剪贴板
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const copyData = copyBuffer.getChannelData(channel);
                
                const startSample = Math.floor(start * audioBuffer.sampleRate);
                const endSample = Math.floor(end * audioBuffer.sampleRate);
                
                for (let i = startSample, j = 0; i < endSample; i++, j++) {
                    copyData[j] = originalData[i];
                }
            }
            
            // 将复制内容保存到剪贴板
            clipboard = {
                arrayBuffer: audioBufferToArrayBuffer(copyBuffer),
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
                duration: duration
            };
            
            statusMessage.textContent = `已复制音频区域到剪贴板: ${formatTime(start)} - ${formatTime(end)}`;
        }
        
        // 剪切到剪贴板
        function cutToClipboard() {
            if (!audioBuffer || selectionStart === selectionEnd) {
                statusMessage.textContent = '请先选择要剪切的区域';
                return;
            }
            
            // 保存状态到历史记录
            saveStateToHistory('剪切');
            
            // 使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const duration = end - start;
            
            // 创建新的AudioBuffer存储剪切内容
            const cutBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                duration * audioBuffer.sampleRate,
                audioBuffer.sampleRate
            );
            
            // 复制选中的数据到剪贴板
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const cutData = cutBuffer.getChannelData(channel);
                
                const startSample = Math.floor(start * audioBuffer.sampleRate);
                const endSample = Math.floor(end * audioBuffer.sampleRate);
                
                for (let i = startSample, j = 0; i < endSample; i++, j++) {
                    cutData[j] = originalData[i];
                }
            }
            
            // 将剪切内容保存到剪贴板
            clipboard = {
                arrayBuffer: audioBufferToArrayBuffer(cutBuffer),
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels,
                duration: duration
            };
            
            // 从原音频中删除选中区域
            const beforeLength = Math.floor(start * audioBuffer.sampleRate);
            const afterLength = audioBuffer.length - Math.floor(end * audioBuffer.sampleRate);
            const totalLength = beforeLength + afterLength;
            
            // 创建新的AudioBuffer
            const newBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                totalLength,
                audioBuffer.sampleRate
            );
            
            // 复制删除前后的数据
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const newData = newBuffer.getChannelData(channel);
                
                // 复制删除前的数据
                for (let i = 0; i < beforeLength; i++) {
                    newData[i] = originalData[i];
                }
                
                // 复制删除后的数据
                const afterStart = Math.floor(end * audioBuffer.sampleRate);
                for (let i = 0; i < afterLength; i++) {
                    newData[beforeLength + i] = originalData[afterStart + i];
                }
            }
            
            // 替换原始buffer
            audioBuffer = newBuffer;
            
            // 更新原始音频数据
            originalAudioData = audioBuffer.getChannelData(0);
            
            // 重新生成峰值数据
            generatePeakData();
            
            // 重置选择
            resetSelection();
            
            // 重新绘制波形
            drawWaveform();
            
            statusMessage.textContent = `已剪切音频区域到剪贴板: ${formatTime(start)} - ${formatTime(end)}`;
        }
        
        // 从剪贴板粘贴 - 修复从右往左选择时粘贴的问题
        function pasteFromClipboard() {
            if (!audioBuffer) {
                statusMessage.textContent = '请先加载音频';
                return;
            }
            
            if (!clipboard) {
                statusMessage.textContent = '剪贴板为空，请先复制或剪切音频';
                return;
            }
            
            // 保存状态到历史记录
            saveStateToHistory('粘贴');
            
            // 将剪贴板中的ArrayBuffer转换为AudioBuffer
            const pasteBuffer = arrayBufferToAudioBuffer(
                clipboard.arrayBuffer,
                clipboard.numberOfChannels,
                Math.floor(clipboard.duration * clipboard.sampleRate),
                clipboard.sampleRate
            );
            
            // 确定粘贴位置 - 修复：无论从左往右还是从右往左选择，都使用正确的时间范围
            const pasteStart = Math.min(selectionStart, selectionEnd);
            const pasteEnd = Math.max(selectionStart, selectionEnd);
            
            // 如果选择区域有长度，则替换该区域；否则在起始位置插入
            const hasSelection = pasteEnd > pasteStart;
            
            // 计算新音频的长度
            const originalLength = audioBuffer.length;
            const pasteLength = pasteBuffer.length;
            let newLength;
            
            if (hasSelection) {
                // 替换模式：删除选中区域，然后插入剪贴板内容
                const selectionLength = Math.floor((pasteEnd - pasteStart) * audioBuffer.sampleRate);
                newLength = originalLength - selectionLength + pasteLength;
            } else {
                // 插入模式：在起始位置插入剪贴板内容
                newLength = originalLength + pasteLength;
            }
            
            // 创建新的AudioBuffer
            const newBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                newLength,
                audioBuffer.sampleRate
            );
            
            // 执行粘贴操作
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const pasteData = pasteBuffer.getChannelData(channel);
                const newData = newBuffer.getChannelData(channel);
                
                const startSample = Math.floor(pasteStart * audioBuffer.sampleRate);
                
                if (hasSelection) {
                    // 替换模式
                    const endSample = Math.floor(pasteEnd * audioBuffer.sampleRate);
                    const selectionLength = endSample - startSample;
                    
                    // 复制粘贴点之前的数据
                    for (let i = 0; i < startSample; i++) {
                        newData[i] = originalData[i];
                    }
                    
                    // 插入剪贴板内容
                    for (let i = 0; i < pasteLength; i++) {
                        newData[startSample + i] = pasteData[i];
                    }
                    
                    // 复制粘贴点之后的数据
                    for (let i = endSample; i < originalLength; i++) {
                        newData[startSample + pasteLength + (i - endSample)] = originalData[i];
                    }
                } else {
                    // 插入模式
                    // 复制粘贴点之前的数据
                    for (let i = 0; i < startSample; i++) {
                        newData[i] = originalData[i];
                    }
                    
                    // 插入剪贴板内容
                    for (let i = 0; i < pasteLength; i++) {
                        newData[startSample + i] = pasteData[i];
                    }
                    
                    // 复制粘贴点之后的数据
                    for (let i = startSample; i < originalLength; i++) {
                        newData[startSample + pasteLength + (i - startSample)] = originalData[i];
                    }
                }
            }
            
            // 替换原始buffer
            audioBuffer = newBuffer;
            
            // 更新原始音频数据
            originalAudioData = audioBuffer.getChannelData(0);
            
            // 重新生成峰值数据
            generatePeakData();
            
            // 修改：粘贴后自动选择粘贴的内容
            selectionStart = pasteStart;
            selectionEnd = pasteStart + clipboard.duration;
            
            // 重新绘制波形
            drawWaveform();
            
            // 更新选择区域显示
            updateSelectionDisplay();
            
            statusMessage.textContent = hasSelection ? 
                `已用剪贴板内容替换选中区域并自动选中粘贴内容` : 
                `已在 ${formatTime(pasteStart)} 处插入剪贴板内容并自动选中粘贴内容`;
        }
        
        // 调整缩放
        function adjustZoom(delta) {
            let newZoom = zoomLevel + delta;
            
            // 限制最小缩放级别
            if (newZoom < 1.0) {
                newZoom = 1.0;
            }
            
            // 限制最大缩放级别
            if (newZoom > 25.0) {
                newZoom = 25.0;
                statusMessage.textContent = "已达到最大缩放级别 (2500%)";
            }
            
            setZoom(newZoom);
        }
        
        // 设置缩放级别
        function setZoom(newZoom) {
            if (!audioBuffer) {
                zoomLevel = newZoom;
                zoomSlider.value = zoomLevel;
                zoomValue.textContent = `${Math.round(zoomLevel * 100)}%`;
                return;
            }
            
            // 计算当前可见区域的中心时间
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            const centerTime = visibleStartTime + (visibleEndTime - visibleStartTime) / 2;
            
            // 更新缩放级别
            zoomLevel = newZoom;
            zoomSlider.value = zoomLevel;
            zoomValue.textContent = `${Math.round(zoomLevel * 100)}%`;
            
            // 计算新的滚动位置，使中心时间保持不变
            const newVisibleDuration = audioBuffer.duration / zoomLevel;
            const newVisibleStartTime = Math.max(0, Math.min(centerTime - newVisibleDuration / 2, audioBuffer.duration - newVisibleDuration));
            scrollPosition = (newVisibleStartTime / audioBuffer.duration) * (waveformWidth * zoomLevel);
            
            // 更新滚动条
            updateScrollBar();
            
            // 重新绘制波形
            if (audioBuffer) {
                drawWaveform();
            }
            
            // 更新播放头位置
            updatePlayhead();
            
            // 更新选择区域显示
            updateSelectionDisplay();
            
            statusMessage.textContent = `缩放级别: ${Math.round(zoomLevel * 100)}%`;
        }
        
        // 重置缩放
        function resetZoom() {
            setZoom(1.0);
            scrollPosition = 0;
            updateScrollBar();
            
            if (audioBuffer) {
                drawWaveform();
            }
            
            statusMessage.textContent = "缩放已重置";
        }
        
        // 处理滚动条滑块鼠标按下
        function handleScrollThumbMouseDown(e) {
            e.preventDefault();
            isDraggingScroll = true;
            dragStartScrollX = e.clientX;
            dragStartThumbX = parseFloat(scrollThumb.style.left || '0');
            
            document.addEventListener('mousemove', handleScrollMouseMove);
            document.addEventListener('mouseup', handleScrollMouseUp);
        }
        
        // 处理滚动条容器鼠标按下
        function handleScrollContainerMouseDown(e) {
            if (e.target === scrollContainer || e.target === scrollContent) {
                const rect = scrollContainer.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const thumbWidth = parseFloat(scrollThumb.style.width || '100');
                const thumbLeft = Math.max(0, Math.min(clickX - thumbWidth / 2, 100 - thumbWidth));
                
                scrollThumb.style.left = `${thumbLeft}%`;
                updateScrollPositionFromThumb();
            }
        }
        
        // 处理滚动条鼠标移动
        function handleScrollMouseMove(e) {
            if (!isDraggingScroll) return;
            
            const deltaX = e.clientX - dragStartScrollX;
            const containerWidth = scrollContainer.clientWidth;
            const thumbWidth = parseFloat(scrollThumb.style.width || '100');
            const maxThumbLeft = 100 - thumbWidth;
            
            let newThumbLeft = dragStartThumbX + (deltaX / containerWidth) * 100;
            newThumbLeft = Math.max(0, Math.min(newThumbLeft, maxThumbLeft));
            
            scrollThumb.style.left = `${newThumbLeft}%`;
            updateScrollPositionFromThumb();
        }
        
        // 处理滚动条鼠标释放
        function handleScrollMouseUp() {
            isDraggingScroll = false;
            document.removeEventListener('mousemove', handleScrollMouseMove);
            document.removeEventListener('mouseup', handleScrollMouseUp);
        }
        
        // 从滑块位置更新滚动位置
        function updateScrollPositionFromThumb() {
            const thumbLeft = parseFloat(scrollThumb.style.left || '0');
            const thumbWidth = parseFloat(scrollThumb.style.width || '100');
            const maxThumbLeft = 100 - thumbWidth;
            
            if (maxThumbLeft > 0) {
                scrollPosition = (thumbLeft / maxThumbLeft) * (waveformWidth * (zoomLevel - 1));
            } else {
                scrollPosition = 0;
            }
            
            if (audioBuffer) {
                drawWaveform();
                updatePlayhead();
                updateSelectionDisplay();
            }
        }
        
        // 更新滚动条
        function updateScrollBar() {
            if (!audioBuffer) {
                scrollThumb.style.width = '100%';
                scrollThumb.style.left = '0%';
                return;
            }
            
            // 计算滑块宽度
            const thumbWidth = Math.max(10, 100 / zoomLevel);
            scrollThumb.style.width = `${thumbWidth}%`;
            
            // 计算滑块位置
            const maxScroll = waveformWidth * (zoomLevel - 1);
            if (maxScroll > 0) {
                const thumbLeft = (scrollPosition / maxScroll) * (100 - thumbWidth);
                scrollThumb.style.left = `${Math.max(0, Math.min(thumbLeft, 100 - thumbWidth))}%`;
            } else {
                scrollThumb.style.left = '0%';
            }
            
            // 显示或隐藏滚动条
            if (zoomLevel > 1.0) {
                scrollContainer.style.display = 'block';
            } else {
                scrollContainer.style.display = 'none';
            }
        }
        
        // 保存状态到历史记录 - 修复：不再克隆整个 AudioBuffer
        function saveStateToHistory(action) {
            // 清除重做栈
            redoStack = [];
            
            // 只保存必要的状态信息，而不是整个 AudioBuffer
            const state = {
                // 不保存整个 AudioBuffer，只保存必要的信息
                audioBufferData: audioBuffer ? {
                    arrayBuffer: audioBufferToArrayBuffer(audioBuffer),
                    sampleRate: audioBuffer.sampleRate,
                    numberOfChannels: audioBuffer.numberOfChannels,
                    length: audioBuffer.length
                } : null,
                selectionStart: selectionStart,
                selectionEnd: selectionEnd,
                action: action,
                timestamp: Date.now()
            };
            
            undoStack.push(state);
            
            // 限制历史记录数量
            if (undoStack.length > MAX_HISTORY) {
                undoStack.shift();
            }
            
            updateUndoRedoButtons();
        }
        
        // 从保存的数据恢复 AudioBuffer
        function restoreAudioBufferFromState(audioBufferData) {
            if (!audioBufferData) return null;
            
            return arrayBufferToAudioBuffer(
                audioBufferData.arrayBuffer,
                audioBufferData.numberOfChannels,
                audioBufferData.length,
                audioBufferData.sampleRate
            );
        }
        
        // 更新撤销/恢复按钮状态
        function updateUndoRedoButtons() {
            undoBtn.disabled = undoStack.length === 0;
            redoBtn.disabled = redoStack.length === 0;
        }
        
        // 撤销操作 - 修复：从保存的数据恢复 AudioBuffer
        function undo() {
            if (undoStack.length === 0) return;
            
            // 保存当前状态到重做栈
            const currentState = {
                audioBufferData: audioBuffer ? {
                    arrayBuffer: audioBufferToArrayBuffer(audioBuffer),
                    sampleRate: audioBuffer.sampleRate,
                    numberOfChannels: audioBuffer.numberOfChannels,
                    length: audioBuffer.length
                } : null,
                selectionStart: selectionStart,
                selectionEnd: selectionEnd,
                action: 'current',
                timestamp: Date.now()
            };
            
            redoStack.push(currentState);
            
            // 恢复上一个状态
            const previousState = undoStack.pop();
            audioBuffer = previousState.audioBufferData ? 
                restoreAudioBufferFromState(previousState.audioBufferData) : null;
            selectionStart = previousState.selectionStart;
            selectionEnd = previousState.selectionEnd;
            
            // 更新UI
            if (audioBuffer) {
                // 更新原始音频数据
                originalAudioData = audioBuffer.getChannelData(0);
                generatePeakData();
                drawWaveform();
                updateDurationDisplay();
                updateSelectionDisplay();
            } else {
                waveform.innerHTML = '';
                durationEl.textContent = '0:00.000';
                resetSelection();
            }
            
            updateUndoRedoButtons();
            
            statusMessage.textContent = `已撤销: ${previousState.action}`;
        }
        
        // 恢复操作 - 修复：从保存的数据恢复 AudioBuffer
        function redo() {
            if (redoStack.length === 0) return;
            
            // 保存当前状态到撤销栈
            const currentState = {
                audioBufferData: audioBuffer ? {
                    arrayBuffer: audioBufferToArrayBuffer(audioBuffer),
                    sampleRate: audioBuffer.sampleRate,
                    numberOfChannels: audioBuffer.numberOfChannels,
                    length: audioBuffer.length
                } : null,
                selectionStart: selectionStart,
                selectionEnd: selectionEnd,
                action: 'current',
                timestamp: Date.now()
            };
            
            undoStack.push(currentState);
            
            // 恢复下一个状态
            const nextState = redoStack.pop();
            audioBuffer = nextState.audioBufferData ? 
                restoreAudioBufferFromState(nextState.audioBufferData) : null;
            selectionStart = nextState.selectionStart;
            selectionEnd = nextState.selectionEnd;
            
            // 更新UI
            if (audioBuffer) {
                // 更新原始音频数据
                originalAudioData = audioBuffer.getChannelData(0);
                generatePeakData();
                drawWaveform();
                updateDurationDisplay();
                updateSelectionDisplay();
            } else {
                waveform.innerHTML = '';
                durationEl.textContent = '0:00.000';
                resetSelection();
            }
            
            updateUndoRedoButtons();
            
            statusMessage.textContent = `已恢复: ${nextState.action}`;
        }
        
        // 处理上传的文件
        function handleFiles(files) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                // 支持WAV、MP3、M4A格式
                const acceptedTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
                const acceptedExtensions = ['.wav', '.mp3', '.m4a'];
                const fileName = file.name.toLowerCase();
                
                if (acceptedTypes.includes(file.type) || acceptedExtensions.some(ext => fileName.endsWith(ext))) {
                    addAudioFile(file);
                } else {
                    statusMessage.textContent = `文件 ${file.name} 不是支持的音频格式（支持WAV、MP3、M4A）`;
                }
            }
        }
        
        // 添加音频文件
        function addAudioFile(file) {
            const audioId = 'audio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            audioFiles.push({
                id: audioId,
                file: file,
                name: file.name,
                url: URL.createObjectURL(file)
            });
            
            updateAudioList();
            saveToIndexedDB();
            statusMessage.textContent = `已添加音频: ${file.name}`;
        }
        
        // 清空音频列表
        function clearAudioList() {
            if (audioFiles.length === 0) {
                statusMessage.textContent = '音频列表已经是空的';
                return;
            }
            
            if (confirm('确定要清空音频列表吗？此操作不可撤销。')) {
                // 停止当前播放
                if (currentAudioId) {
                    stopAudio();
                    audioBuffer = null;
                    currentAudioId = null;
                    resetSelection();
                    waveform.innerHTML = '';
                }
                
                // 释放所有URL对象
                audioFiles.forEach(audio => {
                    URL.revokeObjectURL(audio.url);
                });
                
                // 清空音频文件列表
                audioFiles = [];
                updateAudioList();
                saveToIndexedDB();
                statusMessage.textContent = '已清空音频列表';
            }
        }
        
        // 更新音频列表UI
        function updateAudioList() {
            audioList.innerHTML = '';
            
            if (audioFiles.length === 0) {
                audioList.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">暂无音频文件</div>';
                return;
            }
            
            audioFiles.forEach(audio => {
                const audioItem = document.createElement('div');
                audioItem.className = `audio-item ${currentAudioId === audio.id ? 'active' : ''}`;
                audioItem.innerHTML = `
                    <div class="audio-name">${audio.name}</div>
                    <div class="audio-controls">
                        <!--<button class="btn btn-outline play-audio" data-id="${audio.id}">播放</button>-->
                        <button class="btn btn-outline load-audio" style="padding: 7px; font-size: 11px;" data-id="${audio.id}">加载</button>
                        <button class="btn btn-danger remove-audio" style="padding: 7px; font-size: 11px;" data-id="${audio.id}">删除</button>
                    </div>
                `;
                audioList.appendChild(audioItem);
            });
            
            // 添加事件监听器
            document.querySelectorAll('.play-audio').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const audioId = e.target.dataset.id;
                    playAudioById(audioId);
                });
            });
            
            document.querySelectorAll('.load-audio').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const audioId = e.target.dataset.id;
                    loadAudioById(audioId);
                });
            });
            
            document.querySelectorAll('.remove-audio').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const audioId = e.target.dataset.id;
                    removeAudioById(audioId);
                });
            });
        }
        
        // 通过ID播放音频
        function playAudioById(audioId) {
            const audio = audioFiles.find(a => a.id === audioId);
            if (audio) {
                if (currentAudioId !== audioId) {
                    loadAudioById(audioId);
                }
                playAudio();
            }
        }
        
        // 新增：重采样函数 - 将音频重采样到8kHz
        async function resampleAudioBuffer(sourceBuffer, targetSampleRate) {
            if (sourceBuffer.sampleRate === targetSampleRate) {
                return sourceBuffer;
            }
            
            const duration = sourceBuffer.length / sourceBuffer.sampleRate;
            const offlineContext = new OfflineAudioContext(
                sourceBuffer.numberOfChannels,
                duration * targetSampleRate,
                targetSampleRate
            );
            
            const source = offlineContext.createBufferSource();
            source.buffer = sourceBuffer;
            source.connect(offlineContext.destination);
            source.start(0);
            
            return await offlineContext.startRendering();
        }
        
        // 通过ID加载音频
        async function loadAudioById(audioId) {
            const audio = audioFiles.find(a => a.id === audioId);
            if (audio) {
                currentAudioId = audioId;
                updateAudioList();
                
                try {
                    const response = await fetch(audio.url);
                    const arrayBuffer = await response.arrayBuffer();
                    
                    // 解码音频数据
                    statusMessage.textContent = `正在解码音频: ${audio.name}...`;
                    let decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // 检查采样率，如果不是8kHz，则进行重采样
                    if (decodedBuffer.sampleRate !== 8000) {
                        statusMessage.textContent = `正在将音频从 ${decodedBuffer.sampleRate}Hz 转换为 8000Hz...`;
                        decodedBuffer = await resampleAudioBuffer(decodedBuffer, 8000);
                        statusMessage.textContent = `音频已转换为 8000Hz: ${audio.name}`;
                    }
                    
                    audioBuffer = decodedBuffer;
                    
                    // 保存原始音频数据
                    originalAudioData = audioBuffer.getChannelData(0);
                    
                    // 设置当前文件名（保持原始扩展名）
                    const originalExt = audio.name.substring(audio.name.lastIndexOf('.'));
                    currentFileName = audio.name.replace(originalExt, '.wav');
                    
                    // 重置缩放和滚动
                    resetZoom();
                    
                    // 重置响度控制
                    amplitudeSlider.value = 1.0;
                    amplitudeValue.textContent = '100%';
                    tempAmplitudeScale = 1.0;
                    
                    // 生成峰值数据
                    generatePeakData();
                    
                    drawWaveform();
                    updateDurationDisplay();
                    resetSelection();
                    
                    statusMessage.textContent = `已加载音频: ${audio.name} (${audioBuffer.sampleRate}Hz)`;
                } catch (error) {
                    statusMessage.textContent = `加载音频失败: ${error.message}`;
                    console.error('Error loading audio:', error);
                }
            }
        }
        
        // 生成峰值数据
        function generatePeakData() {
            if (!audioBuffer) return;
            
            const data = audioBuffer.getChannelData(0);
            const length = data.length;
            
            // 使用固定数量的采样点，避免数据过大
            const targetPoints = 5000; // 目标采样点数
            const step = Math.max(1, Math.floor(length / targetPoints));
            
            peakData = new Float32Array(Math.ceil(length / step));
            peakDataLength = peakData.length;
            
            // 计算每个区间的峰值
            for (let i = 0; i < peakDataLength; i++) {
                const start = i * step;
                const end = Math.min(start + step, length);
                
                let min = 0;
                let max = 0;
                
                for (let j = start; j < end; j++) {
                    const value = data[j];
                    if (value < min) min = value;
                    if (value > max) max = value;
                }
                
                // 存储峰值范围
                peakData[i] = (max - min) / 2;
            }
        }
        
        // 通过ID删除音频
        function removeAudioById(audioId) {
            if (currentAudioId === audioId) {
                stopAudio();
                audioBuffer = null;
                currentAudioId = null;
                resetSelection();
                waveform.innerHTML = '';
            }
            
            const audio = audioFiles.find(a => a.id === audioId);
            if (audio) {
                URL.revokeObjectURL(audio.url);
            }
            
            audioFiles = audioFiles.filter(a => a.id !== audioId);
            updateAudioList();
            saveToIndexedDB();
            statusMessage.textContent = '已删除音频';
        }
        
        // 切换循环播放状态
        function toggleLoop() {
            isLooping = !isLooping;
            console.log('[Loop] Toggle loop button clicked. New state:', isLooping);
            if (isLooping) {
                loopBtn.classList.add('active');
                loopBtn.setAttribute('aria-pressed', 'true');
                statusMessage.textContent = '循环播放已启用';
                console.log('[Loop] Loop mode enabled');
            } else {
                loopBtn.classList.remove('active');
                loopBtn.setAttribute('aria-pressed', 'false');
                statusMessage.textContent = '循环播放已禁用';
                console.log('[Loop] Loop mode disabled');
            }
        }
        
        // 播放音频 - 修改：当选择框起始位置等于结束位置时，从选择框起始位置开始播放
        function playAudio() {
            console.log('[Play] playAudio() called. isPlaying:', isPlaying, 'isLooping:', isLooping, 'pauseTime:', pauseTime);
            if (!audioBuffer) {
                statusMessage.textContent = '请先加载音频';
                console.log('[Play] No audio buffer available');
                return;
            }
            
            if (isPlaying) {
                console.log('[Play] Audio already playing, pausing instead');
                pauseAudio();
                return;
            }
            
            console.log('[Play] Stopping any existing audio node');
            stopAudioNode();
            
            sourceNode = audioContext.createBufferSource();
            gainNode = audioContext.createGain();
            
            sourceNode.buffer = audioBuffer;
            sourceNode.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // 新增：如果选择了区域，只播放选中部分，使用正确的时间范围
            let startOffset = 0;
            let duration = audioBuffer.duration;
            
            // 使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            console.log('[Play] Selection region - start:', start, 'end:', end, 'selectionStart:', selectionStart, 'selectionEnd:', selectionEnd);
            
            // 修复：如果有暂停时间，从暂停位置继续播放
            if (pauseTime > 0) {
                console.log('[Play] Resuming from pauseTime:', pauseTime);
                startOffset = pauseTime;
                // 如果有选择区域，确保在该区域内播放
                if (end > start) {
                    // 确保pauseTime在选择区域内
                    if (pauseTime >= start && pauseTime < end) {
                        duration = end - startOffset;
                        console.log('[Play] Resuming within selection region. Duration:', duration);
                    } else {
                        // 如果pauseTime在区域外，从区域开始播放
                        startOffset = start;
                        duration = end - start;
                        pauseTime = 0;
                        console.log('[Play] pauseTime outside selection, starting from region start. Duration:', duration);
                    }
                } else {
                    duration = audioBuffer.duration - startOffset;
                    console.log('[Play] No selection, playing from pauseTime to end. Duration:', duration);
                }
            } else {
                console.log('[Play] Starting new playback (pauseTime = 0)');
                if (end > start) {
                    // 播放选中区域
                    startOffset = start;
                    duration = end - start;
                    console.log('[Play] Playing selected region. StartOffset:', startOffset, 'Duration:', duration);
                } else if (start === end && start > 0) {
                    // 当选择区域只是一个点（起始等于结束）时，从该点开始播放到音频结束
                    startOffset = start;
                    duration = audioBuffer.duration - start;
                    console.log('[Play] Playing from point to end. StartOffset:', startOffset, 'Duration:', duration);
                } else {
                    console.log('[Play] Playing entire audio. Duration:', duration);
                }
                // 如果start等于end且等于0，则播放整个音频
            }
            
            console.log('[Play] Starting audio node. StartOffset:', startOffset, 'Duration:', duration);
            sourceNode.start(0, startOffset, duration);
            startTime = audioContext.currentTime - startOffset;
            isPlaying = true;
            console.log('[Play] Audio started playing. StartTime:', startTime);
            
            // 修复：添加播放结束事件监听，支持循环播放
            sourceNode.onended = () => {
                console.log('[Play] Audio playback ended. isLooping:', isLooping, 'audioBuffer:', !!audioBuffer);
                if (isLooping && audioBuffer) {
                    console.log('[Play] Loop mode is active, preparing to restart playback');
                    // 循环播放：检查是否有选择区域
                    const start = Math.min(selectionStart, selectionEnd);
                    const end = Math.max(selectionStart, selectionEnd);
                    console.log('[Play] Loop restart - Selection region: start:', start, 'end:', end);
                    
                    if (end > start) {
                        // 有选择区域时，从选择区域起点开始循环
                        pauseTime = start;
                        console.log('[Play] Loop restart from selection start:', pauseTime);
                    } else {
                        // 没有选择区域时，从头开始循环
                        pauseTime = 0;
                        console.log('[Play] Loop restart from beginning:', pauseTime);
                    }
                    
                    console.log('[Play] Scheduling playAudio() restart with pauseTime:', pauseTime);
                    setTimeout(() => {
                        console.log('[Play] Executing scheduled playAudio() restart');
                        playAudio();
                    }, 0);
                } else {
                    // 正常结束
                    console.log('[Play] Normal playback end (no loop). Cleaning up.');
                    isPlaying = false;
                    pauseTime = 0;
                    updatePlayButton();
                    updatePlayhead();
                    statusMessage.textContent = '播放结束';
                }
            };
            
            updatePlayButton();
            requestAnimationFrame(updatePlayhead);
            
            statusMessage.textContent = '正在播放音频';
        }
        
        // 暂停音频 - 修复：保持当前播放位置，不重置到起点
        function pauseAudio() {
            console.log('[Pause] pauseAudio() called. isPlaying:', isPlaying, 'sourceNode:', !!sourceNode);
            if (isPlaying && sourceNode) {
                // 保存当前播放位置
                pauseTime = audioContext.currentTime - startTime;
                console.log('[Pause] Pausing at position:', pauseTime, 'currentTime:', audioContext.currentTime, 'startTime:', startTime);
                sourceNode.stop();
                isPlaying = false;
                updatePlayButton();
                // 不更新playhead，保持在当前位置
                statusMessage.textContent = '音频已暂停';
                console.log('[Pause] Audio paused successfully');
            }
        }
        
        // 停止音频 - 重置pauseTime到0并移动playhead到起点
        function stopAudio() {
            console.log('[Stop] stopAudio() called. sourceNode:', !!sourceNode);
            if (sourceNode) {
                sourceNode.stop();
                sourceNode = null;
                console.log('[Stop] Source node stopped and cleared');
            }
            
            isPlaying = false;
            pauseTime = 0;  // 只有停止时才重置pauseTime
            console.log('[Stop] Reset state - isPlaying:', isPlaying, 'pauseTime:', pauseTime);
            updatePlayButton();
            updatePlayhead();  // 移动playhead到起点
            statusMessage.textContent = '音频已停止';
        }
        
        // 停止音频节点
        function stopAudioNode() {
            console.log('[Stop] stopAudioNode() called. sourceNode:', !!sourceNode);
            if (sourceNode) {
                try {
                    sourceNode.stop();
                    console.log('[Stop] Source node stopped successfully');
                } catch (e) {
                    // 节点可能已经停止，忽略错误
                    console.log('[Stop] Error stopping source node (may already be stopped):', e.message);
                }
                sourceNode = null;
                console.log('[Stop] Source node cleared');
            }
        }
        
        // 更新播放按钮状态
        function updatePlayButton() {
            if (isPlaying) {
                playBtn.innerHTML = '<span>暂停</span>';
            } else {
                playBtn.innerHTML = '<span>播放</span>';
            }
        }
        
        // 更新播放头位置
        function updatePlayhead() {
            if (!audioBuffer) return;
            
            let currentTime = 0;
            if (isPlaying) {
                currentTime = audioContext.currentTime - startTime;
            } else {
                currentTime = pauseTime;
            }
            
            // 使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            
            // 限制在当前选择的区域内
            if (end > start) {
                currentTime = Math.max(start, Math.min(currentTime, end));
            } else if (start === end && start > 0) {
                // 当选择区域只是一个点时，播放从该点到结束
                currentTime = Math.max(start, Math.min(currentTime, audioBuffer.duration));
            } else {
                currentTime = Math.max(0, Math.min(currentTime, audioBuffer.duration));
            }
            
            // 计算播放头在波形图上的位置（考虑缩放和滚动）
            const progress = currentTime / audioBuffer.duration;
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            
            if (currentTime >= visibleStartTime && currentTime <= visibleEndTime) {
                const visibleProgress = (currentTime - visibleStartTime) / (visibleEndTime - visibleStartTime);
                playhead.style.left = `${visibleProgress * 100}%`;
                playhead.style.display = 'block';
            } else {
                playhead.style.display = 'none';
            }
            
            progressBar.style.width = `${progress * 100}%`;
            
            currentTimeEl.textContent = formatTime(currentTime);
            
            if (isPlaying) {
                requestAnimationFrame(updatePlayhead);
            }
        }
        
        // 绘制波形 - 已优化，修复失真问题，并添加响度控制预览
        function drawWaveform() {
            if (!audioBuffer || !peakData) return;
            
            waveform.innerHTML = '';
            waveformWidth = waveform.clientWidth;
            waveformHeight = waveform.clientHeight;
            
            // 创建canvas
            waveformCanvas = document.createElement('canvas');
            waveformCanvas.width = waveformWidth;
            waveformCanvas.height = waveformHeight;
            waveform.appendChild(waveformCanvas);
            
            waveformCtx = waveformCanvas.getContext('2d');
            
            // 绘制背景
            waveformCtx.fillStyle = '#1a2530';
            waveformCtx.fillRect(0, 0, waveformWidth, waveformHeight);
            
            // 计算可见区域对应的峰值数据索引
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            
            const totalDuration = audioBuffer.duration;
            const startIndex = Math.floor((visibleStartTime / totalDuration) * peakDataLength);
            const endIndex = Math.ceil((visibleEndTime / totalDuration) * peakDataLength);
            
            // 修复：确保每个像素至少有一个数据点
            const visibleDataPoints = endIndex - startIndex;
            const pixelsPerPoint = Math.max(1, waveformWidth / visibleDataPoints);
            
            // 绘制波形
            waveformCtx.strokeStyle = '#3498db';
            waveformCtx.lineWidth = 1;
            waveformCtx.beginPath();
            
            const amp = waveformHeight / 2;
            const centerY = waveformHeight / 2;
            
            // 确定是否应用响度缩放
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const hasSelection = end > start;
            const selectionStartIndex = Math.floor((start / totalDuration) * peakDataLength);
            const selectionEndIndex = Math.ceil((end / totalDuration) * peakDataLength);
            
            // 修复：使用更精确的绘制方法，防止失真
            if (visibleDataPoints > waveformWidth) {
                // 数据点多于像素数，使用峰值采样
                const pointsPerPixel = visibleDataPoints / waveformWidth;
                
                for (let i = 0; i < waveformWidth; i++) {
                    const dataStart = Math.floor(startIndex + i * pointsPerPixel);
                    const dataEnd = Math.floor(startIndex + (i + 1) * pointsPerPixel);
                    
                    if (dataStart >= peakDataLength || dataEnd < 0) continue;
                    
                    let maxPeak = 0;
                    for (let j = Math.max(0, dataStart); j < Math.min(dataEnd, peakDataLength); j++) {
                        let peak = peakData[j];
                        
                        // 应用响度缩放预览
                        if (isDraggingAmplitude) {
                            if (!hasSelection || (j >= selectionStartIndex && j <= selectionEndIndex)) {
                                peak = Math.min(1, peak * tempAmplitudeScale);
                            }
                        }
                        
                        if (peak > maxPeak) maxPeak = peak;
                    }
                    
                    const peakHeight = maxPeak * amp * 2;
                    
                    if (i === 0) {
                        waveformCtx.moveTo(i, centerY - peakHeight / 2);
                        waveformCtx.lineTo(i, centerY + peakHeight / 2);
                    } else {
                        waveformCtx.moveTo(i, centerY - peakHeight / 2);
                        waveformCtx.lineTo(i, centerY + peakHeight / 2);
                    }
                }
            } else {
                // 数据点少于像素数，使用插值
                for (let i = 0; i < waveformWidth; i++) {
                    const dataIndex = Math.floor(startIndex + (i / waveformWidth) * visibleDataPoints);
                    
                    if (dataIndex < 0 || dataIndex >= peakDataLength) continue;
                    
                    let peak = peakData[dataIndex];
                    
                    // 应用响度缩放预览
                    if (isDraggingAmplitude) {
                        if (!hasSelection || (dataIndex >= selectionStartIndex && dataIndex <= selectionEndIndex)) {
                            peak = Math.min(1, peak * tempAmplitudeScale);
                        }
                    }
                    
                    const peakHeight = peak * amp * 2;
                    
                    if (i === 0) {
                        waveformCtx.moveTo(i, centerY - peakHeight / 2);
                        waveformCtx.lineTo(i, centerY + peakHeight / 2);
                    } else {
                        waveformCtx.moveTo(i, centerY - peakHeight / 2);
                        waveformCtx.lineTo(i, centerY + peakHeight / 2);
                    }
                }
            }
            
            waveformCtx.stroke();
            
            // 重新添加播放头和选择区域
            waveform.appendChild(playhead);
            waveform.appendChild(selection);
            selection.appendChild(selectionStartHandle);
            selection.appendChild(selectionEndHandle);
            updateSelectionDisplay();
        }
        
        // 处理波形鼠标按下事件
        function handleWaveformMouseDown(e) {
            if (!audioBuffer) return;
            
            const rect = waveform.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            // 计算点击位置对应的时间（考虑缩放和滚动）
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            const time = visibleStartTime + (x / waveformWidth) * (visibleEndTime - visibleStartTime);
            
            // 计算选择区域在波形图上的像素位置（考虑缩放和滚动）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const selectionStartPixel = ((start - visibleStartTime) / (visibleEndTime - visibleStartTime)) * waveformWidth;
            const selectionEndPixel = ((end - visibleStartTime) / (visibleEndTime - visibleStartTime)) * waveformWidth;
            
            // 检查是否点击了选择区域的起点或终点手柄
            const handleTolerance = 8; // 像素
            
            if (Math.abs(x - selectionStartPixel) < handleTolerance && end > start) {
                // 点击了起点手柄
                dragTarget = 'start';
                isDraggingSelection = true;
                dragStartX = x;
                dragStartSelectionStart = start;
                dragStartSelectionEnd = end;
            } else if (Math.abs(x - selectionEndPixel) < handleTolerance && end > start) {
                // 点击了终点手柄
                dragTarget = 'end';
                isDraggingSelection = true;
                dragStartX = x;
                dragStartSelectionStart = start;
                dragStartSelectionEnd = end;
            } else if (time >= start && time <= end && end > start) {
                // 点击了选择区域内部
                dragTarget = 'selection';
                isDraggingSelection = true;
                dragStartX = x;
                dragStartSelectionStart = start;
                dragStartSelectionEnd = end;
            } else {
                // 点击了选择区域外部，设置新的选择区域
                selectionStart = time;
                selectionEnd = time;
                dragTarget = 'new';
                isDraggingSelection = true;
                dragStartX = x;
                dragStartSelectionStart = selectionStart;
                dragStartSelectionEnd = selectionEnd;
            }
    
            updateSelectionDisplay();
            statusMessage.textContent = `正在调整选择区域...`;
        }
        
        // 处理鼠标移动事件
        function handleMouseMove(e) {
            if (!isDraggingSelection || !audioBuffer) return;
            
            const rect = waveform.getBoundingClientRect();
            const x = e.clientX - rect.left;
            
            // 计算鼠标位置对应的时间（考虑缩放和滚动）
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            const time = visibleStartTime + (x / waveformWidth) * (visibleEndTime - visibleStartTime);
            
            const deltaX = x - dragStartX;
            const deltaTime = (deltaX / waveformWidth) * (visibleEndTime - visibleStartTime);
            
            // 获取当前选择区域的正确边界
            const currentStart = Math.min(selectionStart, selectionEnd);
            const currentEnd = Math.max(selectionStart, selectionEnd);
            
            if (dragTarget === 'start') {
                // 拖动起点手柄
                selectionStart = Math.max(0, Math.min(time, currentEnd));
                selectionEnd = currentEnd;
            } else if (dragTarget === 'end') {
                // 拖动终点手柄
                selectionStart = currentStart;
                selectionEnd = Math.max(currentStart, Math.min(time, audioBuffer.duration));
            } else if (dragTarget === 'selection') {
                // 拖动整个选择区域
                const selectionWidth = currentEnd - currentStart;
                const newStart = Math.max(0, Math.min(dragStartSelectionStart + deltaTime, audioBuffer.duration - selectionWidth));
                const newEnd = newStart + selectionWidth;
                
                if (newEnd <= audioBuffer.duration) {
                    selectionStart = newStart;
                    selectionEnd = newEnd;
                }
            } else if (dragTarget === 'new') {
                // 创建新的选择区域
                selectionEnd = Math.max(0, Math.min(time, audioBuffer.duration));
            }
            
            updateSelectionDisplay();
        }
        
        // 处理鼠标释放事件
        function handleMouseUp(e) {
            if (isDraggingSelection) {
                isDraggingSelection = false;
                dragTarget = null;
                updateSelectionTimeDisplay();
                
                // 新增：显示选择区域（使用正确的时间顺序）
                const start = Math.min(selectionStart, selectionEnd);
                const end = Math.max(selectionStart, selectionEnd);
                statusMessage.textContent = `选择区域: ${formatTime(start)} - ${formatTime(end)}`;
                saveToIndexedDB();
            }
        }
        
        // 更新选择区域显示
        function updateSelectionDisplay() {
            if (!audioBuffer) return;
            
            // 计算可见区域
            const visibleStartTime = (scrollPosition / (waveformWidth * zoomLevel)) * audioBuffer.duration;
            const visibleEndTime = visibleStartTime + (audioBuffer.duration / zoomLevel);
            
            // 使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            
            // 计算选择区域在可见区域内的位置
            const startPercent = ((start - visibleStartTime) / (visibleEndTime - visibleStartTime)) * 100;
            const endPercent = ((end - visibleStartTime) / (visibleEndTime - visibleStartTime)) * 100;
            
            // 限制选择区域在可见区域内
            const clampedStartPercent = Math.max(0, Math.min(100, startPercent));
            const clampedEndPercent = Math.max(0, Math.min(100, endPercent));
            
            selection.style.left = `${clampedStartPercent}%`;
            selection.style.width = `${Math.abs(clampedEndPercent - clampedStartPercent)}%`;
            
            // 更新选择时间显示
            updateSelectionTimeDisplay();
        }
        
        // 更新选择时间显示
        function updateSelectionTimeDisplay() {
            // 新增：显示选择区域（使用正确的时间顺序）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const lastSec = Math.floor((end - start) * 1000);
            selectionTimeEl.textContent = ` | 选择: ${formatTime(start)} - ${formatTime(end)} 共${lastSec}ms`;
        }
        
        // 提取音频
        function cutAudio() {
            if (!audioBuffer || selectionStart === selectionEnd) {
                statusMessage.textContent = '请先选择要提取的区域';
                return;
            }
            
            // 保存状态到历史记录
            saveStateToHistory('提取');
            
            // 新增：使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const duration = end - start;
            
            // 创建新的AudioBuffer
            const newBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                duration * audioBuffer.sampleRate,
                audioBuffer.sampleRate
            );
            
            // 复制选中的数据
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const newData = newBuffer.getChannelData(channel);
                
                const startSample = Math.floor(start * audioBuffer.sampleRate);
                const endSample = Math.floor(end * audioBuffer.sampleRate);
                
                for (let i = startSample, j = 0; i < endSample; i++, j++) {
                    newData[j] = originalData[i];
                }
            }
            
            // 替换原始buffer
            audioBuffer = newBuffer;
            
            // 更新原始音频数据
            originalAudioData = audioBuffer.getChannelData(0);
            
            // 重新生成峰值数据
            generatePeakData();
            
            // 重置选择
            resetSelection();
            
            // 重新绘制波形
            drawWaveform();
            
            statusMessage.textContent = `已提取音频区域: ${formatTime(start)} - ${formatTime(end)}`;
        }
        
        // 删除选中区域
        function deleteSelection() {
            if (!audioBuffer || selectionStart === selectionEnd) {
                statusMessage.textContent = '请先选择要删除的区域';
                return;
            }
            
            // 保存状态到历史记录
            saveStateToHistory('删除');
            
            // 新增：使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            
            // 计算删除后的长度
            const beforeLength = Math.floor(start * audioBuffer.sampleRate);
            const afterLength = audioBuffer.length - Math.floor(end * audioBuffer.sampleRate);
            const totalLength = beforeLength + afterLength;
            
            // 创建新的AudioBuffer
            const newBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                totalLength,
                audioBuffer.sampleRate
            );
            
            // 复制删除前后的数据
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const newData = newBuffer.getChannelData(channel);
                
                // 复制删除前的数据
                for (let i = 0; i < beforeLength; i++) {
                    newData[i] = originalData[i];
                }
                
                // 复制删除后的数据
                const afterStart = Math.floor(end * audioBuffer.sampleRate);
                for (let i = 0; i < afterLength; i++) {
                    newData[beforeLength + i] = originalData[afterStart + i];
                }
            }
            
            // 替换原始buffer
            audioBuffer = newBuffer;
            
            // 更新原始音频数据
            originalAudioData = audioBuffer.getChannelData(0);
            
            // 重新生成峰值数据
            generatePeakData();
            
            // 重置选择
            resetSelection();
            
            // 重新绘制波形
            drawWaveform();
            
            statusMessage.textContent = `已删除音频区域: ${formatTime(start)} - ${formatTime(end)}`;
        }
        
        // 暂存片段 - 修复：创建完全独立的副本
        function saveClip() {
            if (!audioBuffer || selectionStart === selectionEnd) {
                statusMessage.textContent = '请先选择要暂存的区域';
                return;
            }
            
            // 新增：使用正确的时间范围（确保开始时间小于结束时间）
            const start = Math.min(selectionStart, selectionEnd);
            const end = Math.max(selectionStart, selectionEnd);
            const duration = end - start;
            
            // 创建新的AudioBuffer - 完全独立的副本
            const newBuffer = audioContext.createBuffer(
                audioBuffer.numberOfChannels,
                duration * audioBuffer.sampleRate,
                audioBuffer.sampleRate
            );
            
            // 复制选中的数据 - 深拷贝
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                const originalData = audioBuffer.getChannelData(channel);
                const newData = newBuffer.getChannelData(channel);
                
                const startSample = Math.floor(start * audioBuffer.sampleRate);
                const endSample = Math.floor(end * audioBuffer.sampleRate);
                
                for (let i = startSample, j = 0; i < endSample; i++, j++) {
                    newData[j] = originalData[i]; // 这是值的复制，不是引用
                }
            }
            
            // 将AudioBuffer转换为ArrayBuffer以便存储 - 这是关键步骤
            const arrayBuffer = audioBufferToArrayBuffer(newBuffer);
            
            // 添加到片段列表
            const clipId = 'clip_' + Date.now();
            clips.push({
                id: clipId,
                arrayBuffer: arrayBuffer, // 存储独立的ArrayBuffer
                name: `片段_${clips.length + 1}`,
                start: start,
                end: end,
                sampleRate: audioBuffer.sampleRate,
                numberOfChannels: audioBuffer.numberOfChannels
                // 注意：不存储audioBuffer引用，确保独立性
            });
            
            updateClipList();
            saveToIndexedDB();
            
            statusMessage.textContent = `已暂存片段: ${formatTime(start)} - ${formatTime(end)}`;
        }
        
        // 将AudioBuffer转换为ArrayBuffer
        function audioBufferToArrayBuffer(audioBuffer) {
            const numberOfChannels = audioBuffer.numberOfChannels;
            const length = audioBuffer.length;
            const sampleRate = audioBuffer.sampleRate;
            
            // 创建一个ArrayBuffer来存储所有通道的数据
            const buffer = new ArrayBuffer(numberOfChannels * length * 4); // 4 bytes per float32
            const view = new DataView(buffer);
            
            let offset = 0;
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const channelData = audioBuffer.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    view.setFloat32(offset, channelData[i], true);
                    offset += 4;
                }
            }
            
            return buffer;
        }
        
        // 将ArrayBuffer转换为AudioBuffer
        function arrayBufferToAudioBuffer(arrayBuffer, numberOfChannels, length, sampleRate) {
            const audioBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
            const view = new DataView(arrayBuffer);
            
            let offset = 0;
            for (let channel = 0; channel < numberOfChannels; channel++) {
                const channelData = audioBuffer.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    channelData[i] = view.getFloat32(offset, true);
                    offset += 4;
                }
            }
            
            return audioBuffer;
        }
        
        // 更新片段列表
        function updateClipList() {
            clipList.innerHTML = '';
            
            if (clips.length === 0) {
                clipList.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">暂无音频片段</div>';
                return;
            }
            
            clips.forEach((clip, index) => {
                const clipItem = document.createElement('div');
                clipItem.className = 'clip-item';
                clipItem.innerHTML = `
                    <div class="clip-order-controls">
                        <button class="order-btn move-up" data-id="${clip.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button class="order-btn move-down" data-id="${clip.id}" ${index === clips.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                    <input type="checkbox" class="clip-checkbox" data-id="${clip.id}">
                    <div class="clip-name">${clip.name} (${formatTime(clip.end - clip.start)})</div>
                    <div class="clip-controls-buttons">
                        <button class="btn btn-outline rename-clip" data-id="${clip.id}">改名</button>
                        <button class="btn btn-outline play-clip" data-id="${clip.id}">播放</button>
                        <button class="btn btn-outline pause-clip" data-id="${clip.id}">暂停</button>
                        <button class="btn btn-outline stop-clip" data-id="${clip.id}">停止</button>
                        <button class="btn btn-outline copy-clip" data-id="${clip.id}">复制</button>
                        <button class="btn btn-warning paste-clip" data-id="${clip.id}">粘贴</button>
                        <button class="btn btn-primary load-clip" data-id="${clip.id}">加载</button>
                        <button class="btn btn-success save-clip" data-id="${clip.id}">导出</button>
                        <button class="btn btn-danger remove-clip" data-id="${clip.id}">删除</button>
                    </div>
                `;
                clipList.appendChild(clipItem);
            });
            
            // 添加事件监听器
            document.querySelectorAll('.play-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    playClipById(clipId);
                });
            });
            
            document.querySelectorAll('.pause-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    pauseAudio();
                });
            });
            
            document.querySelectorAll('.stop-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    stopAudio();
                });
            });
            
            // 新增：复制按钮事件监听器
            document.querySelectorAll('.copy-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    copyClip(clipId);
                });
            });
            
            // 新增：粘贴按钮事件监听器
            document.querySelectorAll('.paste-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    copyClip(clipId);
                    pasteFromClipboard();
                });
            });
            
            // 新增：重命名按钮事件监听器
            document.querySelectorAll('.rename-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    renameClip(clipId);
                });
            });
            
            document.querySelectorAll('.save-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    saveClipToFile(clipId);
                });
            });
            
            document.querySelectorAll('.load-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    loadClipToWaveform(clipId);
                });
            });
            
            document.querySelectorAll('.remove-clip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    removeClipById(clipId);
                });
            });
            
            // 添加顺序调整事件监听器
            document.querySelectorAll('.move-up').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    moveClipUp(clipId);
                });
            });
            
            document.querySelectorAll('.move-down').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const clipId = e.target.dataset.id;
                    moveClipDown(clipId);
                });
            });
        }
        
        // 新增：复制片段到剪贴板
        function copyClip(clipId) {
            const clip = clips.find(c => c.id === clipId);
            if (!clip) return;
            
            // 从ArrayBuffer创建独立的AudioBuffer
            const audioBuffer = arrayBufferToAudioBuffer(
                clip.arrayBuffer,
                clip.numberOfChannels,
                Math.floor((clip.end - clip.start) * clip.sampleRate),
                clip.sampleRate
            );
            
            if (audioBuffer) {
                // 将片段保存到剪贴板
                clipboard = {
                    arrayBuffer: audioBufferToArrayBuffer(audioBuffer),
                    sampleRate: clip.sampleRate,
                    numberOfChannels: clip.numberOfChannels,
                    duration: clip.end - clip.start
                };
                
                statusMessage.textContent = `已复制片段到剪贴板: ${clip.name}`;
            } else {
                statusMessage.textContent = '无法复制片段: 音频数据丢失';
            }
        }
        
        // 新增：重命名片段功能
        function renameClip(clipId) {
            const clip = clips.find(c => c.id === clipId);
            if (!clip) return;
            
            const newName = prompt('请输入新的片段名称：', clip.name);
            if (newName && newName.trim() !== '') {
                clip.name = newName.trim();
                updateClipList();
                saveToIndexedDB();
                statusMessage.textContent = `已重命名片段为: ${clip.name}`;
            }
        }
        
        // 上移片段
        function moveClipUp(clipId) {
            const index = clips.findIndex(c => c.id === clipId);
            if (index > 0) {
                // 交换位置
                [clips[index], clips[index - 1]] = [clips[index - 1], clips[index]];
                updateClipList();
                saveToIndexedDB();
                statusMessage.textContent = '已上移片段';
            }
        }
        
        // 下移片段
        function moveClipDown(clipId) {
            const index = clips.findIndex(c => c.id === clipId);
            if (index < clips.length - 1) {
                // 交换位置
                [clips[index], clips[index + 1]] = [clips[index + 1], clips[index]];
                updateClipList();
                saveToIndexedDB();
                statusMessage.textContent = '已下移片段';
            }
        }
        
        // 播放片段 - 修复：从独立的ArrayBuffer创建AudioBuffer
        function playClipById(clipId) {
            const clip = clips.find(c => c.id === clipId);
            if (clip) {
                // 从ArrayBuffer创建独立的AudioBuffer
                const clipAudioBuffer = arrayBufferToAudioBuffer(
                    clip.arrayBuffer,
                    clip.numberOfChannels,
                    Math.floor((clip.end - clip.start) * clip.sampleRate),
                    clip.sampleRate
                );
                
                if (clipAudioBuffer) {
                    stopAudioNode();
                    
                    sourceNode = audioContext.createBufferSource();
                    gainNode = audioContext.createGain();
                    
                    sourceNode.buffer = clipAudioBuffer;
                    sourceNode.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    sourceNode.start();
                    isPlaying = true;
                    
                    // 修复：添加播放结束事件监听
                    sourceNode.onended = () => {
                        isPlaying = false;
                        updatePlayButton();
                        statusMessage.textContent = `片段播放结束: ${clip.name}`;
                    };
                    
                    updatePlayButton();
                    statusMessage.textContent = `正在播放片段: ${clip.name}`;
                } else {
                    statusMessage.textContent = '无法播放片段: 音频数据丢失';
                }
            }
        }
        
        // 保存片段到文件
        function saveClipToFile(clipId) {
            const clip = clips.find(c => c.id === clipId);
            if (!clip) return;
            
            // 从ArrayBuffer创建独立的AudioBuffer
            const audioBuffer = arrayBufferToAudioBuffer(
                clip.arrayBuffer,
                clip.numberOfChannels,
                Math.floor((clip.end - clip.start) * clip.sampleRate),
                clip.sampleRate
            );
            
            if (audioBuffer) {
                // 将AudioBuffer转换为WAV文件
                const wavBlob = audioBufferToWav(audioBuffer);
                const url = URL.createObjectURL(wavBlob);
                
                // 创建下载链接
                const a = document.createElement('a');
                a.href = url;
                a.download = `${clip.name}.wav`;
                document.body.appendChild(a);
                a.click();
                
                // 清理
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                statusMessage.textContent = `已导出片段: ${clip.name}.wav`;
            } else {
                statusMessage.textContent = '无法导出片段: 音频数据丢失';
            }
        }
        
        // 将AudioBuffer转换为WAV Blob
        function audioBufferToWav(buffer) {
            const numChannels = buffer.numberOfChannels;
            const sampleRate = buffer.sampleRate;
            const format = 1; // PCM
            const bitDepth = 16; // 16-bit
            
            const bytesPerSample = bitDepth / 8;
            const blockAlign = numChannels * bytesPerSample;
            const byteRate = sampleRate * blockAlign;
            const dataSize = buffer.length * blockAlign;
            
            const bufferArray = new ArrayBuffer(44 + dataSize);
            const view = new DataView(bufferArray);
            
            // WAV文件头
            writeString(view, 0, 'RIFF');
            view.setUint32(4, 36 + dataSize, true);
            writeString(view, 8, 'WAVE');
            writeString(view, 12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, format, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, byteRate, true);
            view.setUint16(32, blockAlign, true);
            view.setUint16(34, bitDepth, true);
            writeString(view, 36, 'data');
            view.setUint32(40, dataSize, true);
            
            // 写入音频数据
            let offset = 44;
            for (let i = 0; i < buffer.length; i++) {
                for (let channel = 0; channel < numChannels; channel++) {
                    const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
                    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                    offset += 2;
                }
            }
            
            return new Blob([bufferArray], { type: 'audio/wav' });
        }
        
        // 辅助函数：写入字符串到DataView
        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
        
        // 加载片段到波形图 - 修复：从独立的ArrayBuffer创建AudioBuffer
        function loadClipToWaveform(clipId) {
            const clip = clips.find(c => c.id === clipId);
            if (clip) {
                // 停止当前播放
                stopAudio();
                
                // 从ArrayBuffer创建独立的AudioBuffer
                const clipAudioBuffer = arrayBufferToAudioBuffer(
                    clip.arrayBuffer,
                    clip.numberOfChannels,
                    Math.floor((clip.end - clip.start) * clip.sampleRate),
                    clip.sampleRate
                );
                
                if (clipAudioBuffer) {
                    // 将片段的buffer设置为主音频buffer
                    audioBuffer = clipAudioBuffer;
                    currentAudioId = null;
                    
                    // 设置当前文件名
                    currentFileName = clip.name + '.wav';
                    
                    // 更新原始音频数据
                    originalAudioData = audioBuffer.getChannelData(0);
                    
                    // 重置缩放和滚动
                    resetZoom();
                    
                    // 重置响度控制
                    amplitudeSlider.value = 1.0;
                    amplitudeValue.textContent = '100%';
                    tempAmplitudeScale = 1.0;
                    
                    // 生成峰值数据
                    generatePeakData();
                    
                    // 更新UI
                    drawWaveform();
                    updateDurationDisplay();
                    resetSelection();
                    
                    statusMessage.textContent = `已加载片段到波形图: ${clip.name}`;
                } else {
                    statusMessage.textContent = '无法加载片段: 音频数据丢失';
                }
            }
        }
        
        // 删除片段
        function removeClipById(clipId) {
            clips = clips.filter(c => c.id !== clipId);
            updateClipList();
            saveToIndexedDB();
            statusMessage.textContent = '已删除片段';
        }
        
        // 合并片段 - 按列表顺序合并
        function mergeClips() {
            if (clips.length < 2) {
                statusMessage.textContent = '至少需要两个片段才能合并';
                return;
            }
            
            // 获取选中的片段（按列表顺序）
            const selectedClips = [];
            document.querySelectorAll('.clip-checkbox:checked').forEach(checkbox => {
                const clipId = checkbox.dataset.id;
                const clip = clips.find(c => c.id === clipId);
                if (clip) {
                    selectedClips.push(clip);
                }
            });
            
            if (selectedClips.length < 2) {
                statusMessage.textContent = '请至少选择两个片段进行合并';
                return;
            }
            
            // 按照列表顺序合并（clips数组的顺序就是列表显示的顺序）
            // 计算总长度
            let totalLength = 0;
            selectedClips.forEach(clip => {
                // 从ArrayBuffer创建独立的AudioBuffer
                const clipAudioBuffer = arrayBufferToAudioBuffer(
                    clip.arrayBuffer,
                    clip.numberOfChannels,
                    Math.floor((clip.end - clip.start) * clip.sampleRate),
                    clip.sampleRate
                );
                
                if (clipAudioBuffer) {
                    totalLength += clipAudioBuffer.length;
                }
            });
            
            if (totalLength === 0) {
                statusMessage.textContent = '无法合并片段: 音频数据丢失';
                return;
            }
            
            // 创建新的AudioBuffer
            const sampleRate = selectedClips[0].sampleRate;
            const numChannels = selectedClips[0].numberOfChannels;
            const newBuffer = audioContext.createBuffer(
                numChannels,
                totalLength,
                sampleRate
            );
            
            // 合并数据 - 按顺序
            let offset = 0;
            for (let channel = 0; channel < numChannels; channel++) {
                offset = 0;
                selectedClips.forEach(clip => {
                    // 从ArrayBuffer创建独立的AudioBuffer
                    const clipAudioBuffer = arrayBufferToAudioBuffer(
                        clip.arrayBuffer,
                        clip.numberOfChannels,
                        Math.floor((clip.end - clip.start) * clip.sampleRate),
                        clip.sampleRate
                    );
                    
                    if (clipAudioBuffer) {
                        const clipData = clipAudioBuffer.getChannelData(channel);
                        const newData = newBuffer.getChannelData(channel);
                        
                        for (let i = 0; i < clipData.length; i++) {
                            newData[offset + i] = clipData[i];
                        }
                        
                        offset += clipData.length;
                    }
                });
            }
            
            // 将合并后的AudioBuffer转换为ArrayBuffer以便存储
            const arrayBuffer = audioBufferToArrayBuffer(newBuffer);
            
            // 创建新的片段
            const clipId = 'clip_' + Date.now();
            clips.push({
                id: clipId,
                arrayBuffer: arrayBuffer,
                name: `合并片段_${clips.length + 1}`,
                start: 0,
                end: newBuffer.duration,
                sampleRate: sampleRate,
                numberOfChannels: numChannels
            });
            
            updateClipList();
            saveToIndexedDB();
            
            statusMessage.textContent = `已按顺序合并 ${selectedClips.length} 个片段`;
        }
        
        // 清空片段列表
        function clearClips() {
            if (clips.length === 0) {
                statusMessage.textContent = '片段列表已经是空的';
                return;
            }
            
            if (confirm('确定要清空片段列表吗？此操作不可撤销。')) {
                clips = [];
                updateClipList();
                saveToIndexedDB();
                statusMessage.textContent = '已清空片段列表';
            }
        }
        
        // 重置选择区域
        function resetSelection() {
            selectionStart = 0;
            selectionEnd = 0;
            updateSelectionDisplay();
        }
        
        // 更新持续时间显示
        function updateDurationDisplay() {
            if (audioBuffer) {
                durationEl.textContent = formatTime(audioBuffer.duration);
            } else {
                durationEl.textContent = '0:00.000';
            }
        }
        
        // 格式化时间 - 已修改为精确到毫秒
        function formatTime(seconds) {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            const millis = Math.floor((seconds % 1) * 1000);
            return `${mins}:${secs < 10 ? '0' : ''}${secs}.${millis < 100 ? (millis < 10 ? '00' : '0') : ''}${millis}`;
        }
        
        // 处理键盘快捷键
        function handleKeyDown(e) {
            // 防止在输入框中触发快捷键
            if (e.target.tagName === 'INPUT') return;
            
            switch(e.key) {
                case ' ': // 空格键 - 播放/暂停
                    e.preventDefault();
                    if (isPlaying) {
                        pauseAudio();
                    } else {
                        playAudio();
                    }
                    break;
                case 'k': // K键 - 提取
                case 'K':
                    if (e.ctrlKey) {
                      e.preventDefault();
                      cutAudio();
                    }
                    break;
                case 'c': // C键 - 复制
                case 'C':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        copyToClipboard();
                    }
                    break;
                case 'x': // X键 - 剪切
                case 'X':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        cutToClipboard();
                    }
                    break;
                case 'v': // V键 - 粘贴
                case 'V':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        pasteFromClipboard();
                    }
                    break;
                case 'delete': // D键 - 删除
                case 'Delete':
                    e.preventDefault();
                    deleteSelection();
                    break;
                case 's': // S键 - 暂存片段
                case 'S':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        saveClip();
                    }
                    break;
                case 'z': // Z键 - 撤销
                case 'Z':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        undo();
                    }
                    break;
                case 'y': // Y键 - 恢复
                case 'Y':
                    if (e.ctrlKey) {
                        e.preventDefault();
                        redo();
                    }
                    break;
            }
        }
        
        // IndexedDB 辅助函数
        function saveToIndexedDB() {
            if (!db) return;
            
            const transaction = db.transaction([STORE_CLIPS, STORE_STATE], 'readwrite');
            
            // 保存片段 - 存储整个数组以保持顺序
            const clipsStore = transaction.objectStore(STORE_CLIPS);
            clipsStore.clear();
            
            // 为每个片段添加顺序索引
            clips.forEach((clip, index) => {
                clipsStore.add({
                    id: clip.id,
                    name: clip.name,
                    start: clip.start,
                    end: clip.end,
                    sampleRate: clip.sampleRate,
                    numberOfChannels: clip.numberOfChannels,
                    arrayBuffer: clip.arrayBuffer,
                    order: index
                });
            });
            
            // 保存状态 - 修复：不保存整个 AudioBuffer
            const stateStore = transaction.objectStore(STORE_STATE);
            stateStore.put({
                id: 'currentState',
                currentAudioId: currentAudioId,
                selectionStart: selectionStart,
                selectionEnd: selectionEnd,
                undoStack: undoStack,
                redoStack: redoStack
            });
            
            autoSaveStatus.textContent = `已自动保存 (${new Date().toLocaleTimeString()})`;
        }
        
        // 从 IndexedDB 加载
        async function loadFromIndexedDB() {
            if (!db) return;
            
            try {
                // 加载片段 - 按顺序字段排序
                const clipsStore = db.transaction(STORE_CLIPS).objectStore(STORE_CLIPS);
                const clipsRequest = clipsStore.getAll();
                clipsRequest.onsuccess = () => {
                    // 按order字段排序，如果没有order字段则按id排序
                    const loadedClips = clipsRequest.result.sort((a, b) => {
                        if (a.order !== undefined && b.order !== undefined) {
                            return a.order - b.order;
                        }
                        // 如果没有order字段，按id排序（保持向后兼容）
                        return a.id.localeCompare(b.id);
                    });
                    
                    clips = loadedClips.map(clip => ({
                        ...clip
                        // 注意：不恢复audioBuffer，确保独立性
                    }));
                    updateClipList();
                };
                
                // 加载状态
                const stateStore = db.transaction(STORE_STATE).objectStore(STORE_STATE);
                const stateRequest = stateStore.get('currentState');
                stateRequest.onsuccess = () => {
                    const state = stateRequest.result;
                    if (state) {
                        currentAudioId = state.currentAudioId;
                        selectionStart = state.selectionStart || 0;
                        selectionEnd = state.selectionEnd || 0;
                        undoStack = state.undoStack || [];
                        redoStack = state.redoStack || [];
                    }
                    
                    updateSelectionTimeDisplay();
                    updateUndoRedoButtons();
                };
                
                statusMessage.textContent = '已恢复上次编辑状态';
            } catch (error) {
                console.error('Error loading state from IndexedDB:', error);
                statusMessage.textContent = '恢复编辑状态时出错';
            }
        }
        
        // 更新UI状态
        function updateUI() {
            // 根据当前状态更新UI元素
            const hasAudio = audioBuffer !== null;
            
            playBtn.disabled = !hasAudio;
            pauseBtn.disabled = !hasAudio || !isPlaying;
            stopBtn.disabled = !hasAudio;
            exportBtn.disabled = !hasAudio;
            
            cutBtn.disabled = !hasAudio || selectionStart === selectionEnd;
            deleteBtn.disabled = !hasAudio || selectionStart === selectionEnd;
            saveClipBtn.disabled = !hasAudio || selectionStart === selectionEnd;
            copyBtn.disabled = !hasAudio || selectionStart === selectionEnd;
            
            // 新增：剪切和粘贴按钮状态
            cutToClipboardBtn.disabled = !hasAudio || selectionStart === selectionEnd;
            pasteBtn.disabled = !hasAudio || !clipboard;
            
            mergeBtn.disabled = clips.length < 2;
            clearClipsBtn.disabled = clips.length === 0;
            clearAudioListBtn.disabled = audioFiles.length === 0;
            
            // 更新缩放按钮状态 - 修改：最大缩放级别改为25倍（2500%）
            zoomOutBtn.disabled = zoomLevel <= 1.0;
            zoomInBtn.disabled = zoomLevel >= 25.0;
            
            // 更新响度控制状态
            amplitudeSlider.disabled = !hasAudio;
            
            updateUndoRedoButtons();
        }
        
        // 定期更新UI
        setInterval(updateUI, 500);

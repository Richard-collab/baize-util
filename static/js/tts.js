        // ============================================
        // Atomic Utility Functions
        // ============================================
        // Note: These utility functions are provided as building blocks for future
        // code improvements. Existing code may not yet use them consistently.
        // New code should prefer these atomic functions over direct DOM manipulation.
        
        // DOM Element Selection
        function getElementById(id) {
            return document.getElementById(id);
        }
        
        function querySelectorAll(selector) {
            return document.querySelectorAll(selector);
        }
        
        // Class Management
        function addClass(element, className) {
            if (element) element.classList.add(className);
        }
        
        function removeClass(element, className) {
            if (element) element.classList.remove(className);
        }
        
        function hasClass(element, className) {
            return element ? element.classList.contains(className) : false;
        }
        
        // Content Management
        function setTextContent(element, text) {
            if (element) element.textContent = text;
        }
        
        function setInnerHTML(element, html) {
            if (element) element.innerHTML = html;
        }
        
        // Attribute Management
        function setAttribute(element, attr, value) {
            if (element) element.setAttribute(attr, value);
        }
        
        function getAttribute(element, attr) {
            return element ? element.getAttribute(attr) : null;
        }
        
        // Button State Management
        function disableButton(button) {
            if (button) button.disabled = true;
        }
        
        function enableButton(button) {
            if (button) button.disabled = false;
        }
        
        // Delay Utility
        function delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        // URL Management
        function createObjectURL(blob) {
            return URL.createObjectURL(blob);
        }
        
        function revokeObjectURL(url) {
            if (url) URL.revokeObjectURL(url);
        }
        
        // Array Utilities
        function filterEmptyStrings(arr) {
            return arr.filter(item => item.trim() !== '');
        }
        
        function isArrayEmpty(arr) {
            return !arr || arr.length === 0;
        }
        
        // String Utilities
        function trimString(str) {
            return str.trim();
        }
        
        function isStringEmpty(str) {
            return !str || str.trim() === '';
        }
        
        // ============================================
        // State Management
        // ============================================
        
        // 存储生成的音频文件
        let audioGroups = []; // 每个组包含完整的文本和其片段
        
        // 存储合并后的完整音频
        let mergedAudios = {};
        
        let currentMode = 'excel'; // 'text' 或 'excel'
        
        // 跟踪当前播放的音频项
        let currentPlayingItem = null;
        
        // 设置当前播放的音频项
        function setPlayingItem(audioItem) {
            // 如果是同一个项目，无需做任何操作
            if (currentPlayingItem === audioItem) {
                return;
            }
            // 移除之前的播放标记
            if (currentPlayingItem) {
                currentPlayingItem.classList.remove('playing');
            }
            // 添加新的播放标记
            if (audioItem) {
                audioItem.classList.add('playing');
            }
            currentPlayingItem = audioItem;
        }
        
        // 按句号、问号分割文本
        function splitTextIntoSentences(text) {
            // 使用正则表达式分割文本，保留分割符号
            const sentences = text.split(/([。？])/);
            const result = [];
            
            let currentSentence = '';
            for (let i = 0; i < sentences.length; i++) {
                if (sentences[i].trim() === '') continue;
                
                currentSentence += sentences[i];
                
                // 如果当前字符是句号或问号，则完成一个句子
                if (sentences[i] === '。' || sentences[i] === '？') {
                    result.push(currentSentence.trim());
                    currentSentence = '';
                }
            }
            
            // 添加最后一个不完整的句子（如果有）
            if (currentSentence.trim() !== '') {
                result.push(currentSentence.trim());
            }
            
            return result.filter(sentence => sentence.length > 0);
        }
        
        // 自适应文本区域高度函数
        function autoResizeTextArea(textArea) {
            textArea.style.height = 'auto';
            const newHeight = Math.min(textArea.scrollHeight, 300);
            textArea.style.height = newHeight + 'px';
            textArea.style.overflowY = textArea.scrollHeight > 300 ? 'auto' : 'hidden';
        }
        
        // 确保文本区域在添加到DOM后正确调整高度
        function ensureTextAreaHeight(textArea) {
            autoResizeTextArea(textArea);
            
            setTimeout(() => {
                autoResizeTextArea(textArea);
            }, 0);
            
            requestAnimationFrame(() => {
                autoResizeTextArea(textArea);
            });
        }
        
        // 标签页切换功能
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                
                this.classList.add('active');
                const tabId = this.getAttribute('data-tab');
                document.getElementById(tabId).classList.add('active');
                
                currentMode = tabId === 'text-tab' ? 'text' : 'excel';
            });
        });
        
        // 文件输入处理
        document.getElementById('fileInput').addEventListener('change', function(e) {
            const fileName = document.getElementById('fileName');
            if (this.files.length > 0) {
                fileName.textContent = this.files[0].name;
            } else {
                fileName.textContent = '未选择文件';
            }
        });
        
        // 带重试机制的fetch函数
        async function fetchWithRetry(url, options, maxRetries = 3, retryDelay = 1000) {
            let lastError;
            
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const response = await fetch(url, options);
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || `请求失败: ${response.status}`);
                    }
                    
                    return response;
                } catch (error) {
                    lastError = error;
                    
                    if (i < maxRetries - 1) {
                        console.warn(`请求失败，${retryDelay}ms后重试 (${i+1}/${maxRetries}):`, error.message);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                        retryDelay *= 2;
                    }
                }
            }
            
            throw lastError;
        }
        
        // 生成单个音频片段
        async function generateSingleAudio(text, voice, speed, volume, index) {
            const response = await fetchWithRetry('/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    text: text, 
                    spk_name: voice, 
                    speed: speed, 
                    volume: volume 
                })
            }, 3, 1000);
            
            return await response.blob();
        }
        
        // 重新生成单个音频片段
        async function regenerateAudio(groupIndex, segmentIndex, textArea, audioElement, regenerateBtn, playStatus) {
            regenerateBtn.disabled = true;
            regenerateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
            
            try {
                const voice = document.getElementById('voiceSelect').value;
                const speed = document.getElementById('speedSelect').value;
                const volume = document.getElementById('volumeSelect').value;
                
                const newText = textArea.value;
                
                const blob = await generateSingleAudio(newText, voice, speed, volume, segmentIndex);
                const audioUrl = URL.createObjectURL(blob);
                
                audioElement.src = audioUrl;
                playStatus.classList.remove('played');
                
                // 更新audioGroups中的数据
                if (audioGroups[groupIndex] && audioGroups[groupIndex].segments[segmentIndex]) {
                    if (audioGroups[groupIndex].segments[segmentIndex].url) {
                        URL.revokeObjectURL(audioGroups[groupIndex].segments[segmentIndex].url);
                    }
                    
                    audioGroups[groupIndex].segments[segmentIndex] = {
                        text: newText,
                        blob: blob,
                        url: audioUrl
                    };
                    
                    // 清除合并的音频，因为片段已更新
                    if (mergedAudios[groupIndex]) {
                        URL.revokeObjectURL(mergedAudios[groupIndex]);
                        delete mergedAudios[groupIndex];
                    }
                }
                
                regenerateBtn.disabled = false;
                regenerateBtn.innerHTML = '<i class="fas fa-redo"></i> 重新生成';
                
                showMessage('音频片段重新生成成功！', 'success');
                
            } catch (error) {
                regenerateBtn.disabled = false;
                regenerateBtn.innerHTML = '<i class="fas fa-redo"></i> 重新生成';
                showMessage(`重新生成音频失败: ${error.message}`, 'error');
            }
        }
        
        // 删除单个音频片段
        function deleteAudioSegment(groupIndex, segmentIndex) {
            if (!audioGroups[groupIndex] || !audioGroups[groupIndex].segments[segmentIndex]) {
                return;
            }
            
            // 释放音频URL
            if (audioGroups[groupIndex].segments[segmentIndex].url) {
                URL.revokeObjectURL(audioGroups[groupIndex].segments[segmentIndex].url);
            }
            
            // 从数组中删除片段
            audioGroups[groupIndex].segments.splice(segmentIndex, 1);
            
            // 清除合并的音频，因为片段已改变
            if (mergedAudios[groupIndex]) {
                URL.revokeObjectURL(mergedAudios[groupIndex]);
                delete mergedAudios[groupIndex];
            }
            
            // 删除UI元素
            const audioGroup = document.getElementById(`audio-group-${groupIndex}`);
            if (audioGroup) {
                const audioItems = audioGroup.querySelectorAll('.audio-item');
                if (audioItems[segmentIndex]) {
                    audioItems[segmentIndex].remove();
                }
                
                // 重新编号剩余的片段
                const remainingAudioItems = audioGroup.querySelectorAll('.audio-item');
                if (remainingAudioItems.length === 0) {
                    // 如果没有片段了，删除整个组
                    deleteAudioGroup(groupIndex);
                } else {
                    // 更新剩余片段的标签
                    remainingAudioItems.forEach((item, index) => {
                        const label = item.querySelector('.audio-label');
                        if (label) {
                            label.innerHTML = `<i class="fas fa-music"></i> 片段 ${index + 1}`;
                        }
                    });
                }
            }
            
            showMessage('音频片段已删除', 'success');
            
            // 检查是否还有音频组，如果没有则禁用打包下载按钮
            if (audioGroups.length === 0) {
                document.getElementById('downloadBtn').disabled = true;
            }
        }
        
        // 删除整个音频组
        function deleteAudioGroup(groupIndex) {
            if (!audioGroups[groupIndex]) {
                return;
            }
            
            // 释放所有音频片段的URL
            audioGroups[groupIndex].segments.forEach(segment => {
                if (segment.url) {
                    URL.revokeObjectURL(segment.url);
                }
            });
            
            // 释放合并音频的URL（如果有）
            if (mergedAudios[groupIndex]) {
                URL.revokeObjectURL(mergedAudios[groupIndex]);
                delete mergedAudios[groupIndex];
            }
            
            // 从数组中删除组
            audioGroups.splice(groupIndex, 1);
            
            // 删除UI元素
            const audioGroup = document.getElementById(`audio-group-${groupIndex}`);
            if (audioGroup) {
                audioGroup.remove();
            }
            
            // 更新剩余组的索引
            const remainingGroups = document.querySelectorAll('.audio-group');
            remainingGroups.forEach((group, index) => {
                group.id = `audio-group-${index}`;
                
                // 更新组内的删除按钮事件
                const deleteGroupBtn = group.querySelector('.delete-group-btn');
                if (deleteGroupBtn) {
                    // 移除旧的事件监听器并添加新的
                    deleteGroupBtn.replaceWith(deleteGroupBtn.cloneNode(true));
                    const newDeleteBtn = group.querySelector('.delete-group-btn');
                    newDeleteBtn.addEventListener('click', () => {
                        if (confirm('确定要删除语料的所有音频片段吗？')) {
                            deleteAudioGroup(index);
                        }
                    });
                }
                
                // 更新组内的片段删除按钮事件
                const deleteSegmentBtns = group.querySelectorAll('.delete-segment-btn');
                deleteSegmentBtns.forEach((btn, segmentIndex) => {
                    btn.replaceWith(btn.cloneNode(true));
                    const newBtn = group.querySelectorAll('.delete-segment-btn')[segmentIndex];
                    newBtn.addEventListener('click', () => {
                        if (confirm('确定要删除这个音频片段吗？')) {
                            deleteAudioSegment(index, segmentIndex);
                        }
                    });
                });
            });
            
            showMessage('音频组已删除', 'success');
            
            // 检查是否还有音频组，如果没有则禁用打包下载按钮
            if (audioGroups.length === 0) {
                document.getElementById('downloadBtn').disabled = true;
            }
        }
        
        // 合并多个音频片段为一个完整音频
        async function mergeAudioSegments(audioSegments) {
            return new Promise((resolve) => {
                // 创建一个临时的音频上下文来处理音频
                // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const audioContext = new AudioContext({ sampleRate: 8000 });
                
                // 用于存储解码后的音频缓冲区
                const audioBuffers = [];
                let buffersLoaded = 0;
                
                // 解码所有音频片段
                audioSegments.forEach((segment, index) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        audioContext.decodeAudioData(e.target.result, (buffer) => {
                            audioBuffers[index] = buffer;
                            buffersLoaded++;
                            
                            // 当所有缓冲区都加载完毕时，开始合并
                            if (buffersLoaded === audioSegments.length) {
                                mergeBuffers(audioContext, audioBuffers, resolve);
                            }
                        }, (error) => {
                            console.error('解码音频失败:', error);
                            buffersLoaded++;
                            
                            // 即使有失败，也继续处理
                            if (buffersLoaded === audioSegments.length) {
                                mergeBuffers(audioContext, audioBuffers, resolve);
                            }
                        });
                    };
                    reader.readAsArrayBuffer(segment.blob);
                });
            });
        }
        
        // 合并音频缓冲区
        function mergeBuffers(audioContext, audioBuffers, resolve) {
            // 计算总长度
            let totalLength = 0;
            audioBuffers.forEach(buffer => {
                if (buffer) totalLength += buffer.length;
            });
            
            // 创建新的音频缓冲区
            const mergedBuffer = audioContext.createBuffer(
                audioBuffers[0] ? audioBuffers[0].numberOfChannels : 1,
                totalLength,
                audioBuffers[0] ? audioBuffers[0].sampleRate : 44100
            );
            
            // 合并所有缓冲区
            let offset = 0;
            for (let i = 0; i < audioBuffers.length; i++) {
                if (audioBuffers[i]) {
                    for (let channel = 0; channel < mergedBuffer.numberOfChannels; channel++) {
                        const channelData = mergedBuffer.getChannelData(channel);
                        const sourceData = audioBuffers[i].getChannelData(
                            channel < audioBuffers[i].numberOfChannels ? channel : 0
                        );
                        channelData.set(sourceData, offset);
                    }
                    offset += audioBuffers[i].length;
                }
            }
            
            // 将缓冲区转换为WAV Blob
            const wavBlob = bufferToWave(mergedBuffer, mergedBuffer.length);
            resolve(wavBlob);
        }
        
        // 将AudioBuffer转换为WAV格式的Blob
        function bufferToWave(abuffer, len) {
            const numOfChan = abuffer.numberOfChannels;
            const length = len * numOfChan * 2;
            const buffer = new ArrayBuffer(44 + length);
            const view = new DataView(buffer);
            const channels = [];
            let i, sample;
            let offset = 0;
            let pos = 0;
            
            // 写入WAV头部
            setUint32(0x46464952); // "RIFF"
            setUint32(length + 36); // 文件长度
            setUint32(0x45564157); // "WAVE"
            setUint32(0x20746d66); // "fmt "
            setUint32(16); // 子块大小
            setUint16(1); // 格式类型 (PCM)
            setUint16(numOfChan); // 声道数
            setUint32(abuffer.sampleRate); // 采样率
            setUint32(abuffer.sampleRate * 2 * numOfChan); // 字节率
            setUint16(numOfChan * 2); // 块对齐
            setUint16(16); // 位深度
            setUint32(0x61746164); // "data"
            setUint32(length); // 数据长度
            
            // 写入PCM数据
            for (i = 0; i < abuffer.numberOfChannels; i++) {
                channels.push(abuffer.getChannelData(i));
            }
            
            while (pos < len) {
                for (i = 0; i < numOfChan; i++) {
                    sample = Math.max(-1, Math.min(1, channels[i][pos]));
                    sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                    view.setInt16(offset, sample, true);
                    offset += 2;
                }
                pos++;
            }
            
            function setUint16(data) {
                view.setUint16(offset, data, true);
                offset += 2;
            }
            
            function setUint32(data) {
                view.setUint32(offset, data, true);
                offset += 4;
            }
            
            return new Blob([buffer], { type: "audio/wav" });
        }
        
        // 显示消息
        function showMessage(message, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = message;
            messageDiv.className = type;
            
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = '';
            }, 3000);
        }
        
        // 生成音频按钮点击事件
        document.getElementById('synthesizeBtn').addEventListener('click', async function() {
            const voice = document.getElementById('voiceSelect').value;
            if (voice == '') {
                alert('请选择音色');
                showMessage('请选择音色', 'error');
                return;
            }

            const messageDiv = document.getElementById('message');
            const loadingDiv = document.getElementById('loading');
            const audioList = document.getElementById('audioList');
            const progressBar = document.getElementById('progressBar');
            const statusDiv = document.getElementById('status');
            const progressPercent = document.getElementById('progressPercent');
            const downloadBtn = document.getElementById('downloadBtn');
            
            messageDiv.innerHTML = '';
            messageDiv.className = '';
            audioList.innerHTML = '';
            audioGroups = [];
            mergedAudios = {};
            
            let data = [];
            
            if (currentMode === 'text') {
                const text = document.getElementById('textInput').value.trim();
                
                if (!text) {
                    messageDiv.textContent = '请输入文本';
                    messageDiv.className = 'error';
                    return;
                }
                
                const lines = text.split('\n').filter(line => line.trim() !== '');
                
                if (lines.length === 0) {
                    messageDiv.textContent = '没有有效的文本行';
                    messageDiv.className = 'error';
                    return;
                }
                
                data = lines.map((line, index) => ({
                    index: index + 1,
                    text: line
                }));
            } else if (currentMode === 'excel') {
                const fileInput = document.getElementById('fileInput');
                
                if (fileInput.files.length === 0) {
                    messageDiv.textContent = '请选择Excel文件';
                    messageDiv.className = 'error';
                    return;
                }
                
                try {
                    data = await parseExcelFile(fileInput.files[0]);
                } catch (error) {
                    messageDiv.textContent = error.message;
                    messageDiv.className = 'error';
                    return;
                }
            }
            
            if (data.length === 0) {
                messageDiv.textContent = '没有有效的文本数据';
                messageDiv.className = 'error';
                return;
            }
            
            loadingDiv.style.display = 'block';
            statusDiv.textContent = `准备生成音频...`;
            progressBar.style.width = '0%';
            progressPercent.textContent = '0%';
            
            this.disabled = true;
            downloadBtn.disabled = true;
            this.classList.remove('pulse-animation');
            
            try {
                const voice = document.getElementById('voiceSelect').value;
                const speed = document.getElementById('speedSelect').value;
                const volume = document.getElementById('volumeSelect').value;
                const shouldSplit = document.getElementById('splitOption').value === 'yes';
                
                // 计算总片段数用于进度显示
                let totalSegments = 0;
                data.forEach(item => {
                    const segments = shouldSplit ? splitTextIntoSentences(item.text) : [item.text];
                    totalSegments += segments.length;
                });
                
                let processedSegments = 0;
                
                // 为每个文本行生成音频
                for (let groupIndex = 0; groupIndex < data.length; groupIndex++) {
                    const item = data[groupIndex];
                    const segments = shouldSplit ? splitTextIntoSentences(item.text) : [item.text];
                    
                    // 创建音频组
                    const audioGroup = {
                        index: item.index,
                        text: item.text,
                        segments: []
                    };
                    
                    // 创建组UI
                    const groupDiv = document.createElement('div');
                    groupDiv.className = 'audio-group fade-in';
                    groupDiv.id = `audio-group-${groupIndex}`;
                    
                    const groupHeader = document.createElement('div');
                    groupHeader.className = 'audio-group-header';
                    
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'audio-group-title';
                    groupTitle.innerHTML = `<i class="fas fa-file-audio"></i> 语料名称：${item.index}`;
                    
                    const groupControls = document.createElement('div');
                    groupControls.className = 'audio-group-controls';
                    
                    // 添加删除整个音频组按钮（在播放按钮左边）
                    const deleteGroupBtn = document.createElement('button');
                    deleteGroupBtn.className = 'btn-small btn-danger delete-group-btn';
                    deleteGroupBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 删除音频组';
                    deleteGroupBtn.addEventListener('click', () => {
                        if (confirm(`确定要删除语料"${item.index}"的所有音频片段吗？`)) {
                            deleteAudioGroup(groupIndex);
                        }
                    });
                    
                    // 添加播放完整音频按钮
                    const playGroupBtn = document.createElement('button');
                    playGroupBtn.className = 'btn-small';
                    playGroupBtn.innerHTML = '<i class="fas fa-play"></i> 播放完整音频';
                    playGroupBtn.disabled = true;
                    
                    const downloadGroupBtn = document.createElement('button');
                    downloadGroupBtn.className = 'btn-small btn-secondary';
                    downloadGroupBtn.innerHTML = '<i class="fas fa-download"></i> 下载完整音频';
                    downloadGroupBtn.disabled = true;
                    
                    groupControls.appendChild(deleteGroupBtn);
                    groupControls.appendChild(playGroupBtn);
                    groupControls.appendChild(downloadGroupBtn);
                    groupHeader.appendChild(groupTitle);
                    groupHeader.appendChild(groupControls);
                    groupDiv.appendChild(groupHeader);
                    
                    // 为每个片段生成音频
                    for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
                        const segmentText = segments[segmentIndex];
                        
                        statusDiv.textContent = `正在生成第 ${processedSegments + 1} 个音频片段 (共 ${totalSegments} 个)...`;
                        const percent = Math.round(((processedSegments) / totalSegments) * 100);
                        progressBar.style.width = `${percent}%`;
                        progressPercent.textContent = `${percent}%`;
                        
                        try {
                            const blob = await generateSingleAudio(segmentText, voice, speed, volume, segmentIndex);
                            const audioUrl = URL.createObjectURL(blob);
                            
                            // 存储音频片段信息
                            audioGroup.segments.push({
                                text: segmentText,
                                blob: blob,
                                url: audioUrl
                            });
                            
                            // 创建音频片段UI
                            const audioItem = document.createElement('div');
                            audioItem.className = 'audio-item fade-in';
                            
                            const playStatus = document.createElement('div');
                            playStatus.className = 'play-status';
                            
                            const labelContainer = document.createElement('div');
                            labelContainer.className = 'audio-label-container';
                            
                            const labelDiv = document.createElement('div');
                            labelDiv.className = 'audio-label';
                            labelDiv.innerHTML = `<i class="fas fa-music"></i> 片段 ${segmentIndex + 1}`;
                            
                            labelContainer.appendChild(playStatus);
                            labelContainer.appendChild(labelDiv);
                            
                            const textDiv = document.createElement('div');
                            textDiv.className = 'audio-text';
                            
                            const textArea = document.createElement('textarea');
                            textArea.className = 'audio-text-editable';
                            textArea.style = 'resize: vertical;'
                            textArea.value = segmentText;
                            
                            textDiv.appendChild(textArea);
                            
                            const controlsDiv = document.createElement('div');
                            controlsDiv.className = 'audio-controls';
                            
                            const buttonsDiv = document.createElement('div');
                            buttonsDiv.className = 'audio-controls-buttons';
                            
                            // 添加删除单个音频片段按钮（在重新生成按钮左边）
                            const deleteSegmentBtn = document.createElement('button');
                            deleteSegmentBtn.className = 'btn-small btn-danger delete-segment-btn';
                            deleteSegmentBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 删除';
                            deleteSegmentBtn.addEventListener('click', () => {
                                if (confirm('确定要删除这个音频片段吗？')) {
                                    deleteAudioSegment(groupIndex, segmentIndex);
                                }
                            });
                            
                            const regenerateBtn = document.createElement('button');
                            regenerateBtn.className = 'btn-small';
                            regenerateBtn.innerHTML = '<i class="fas fa-redo"></i> 重新生成';
                            
                            const audioPlayer = document.createElement('audio');
                            audioPlayer.controls = true;
                            audioPlayer.src = audioUrl;
                            
                            audioPlayer.addEventListener('play', function() {
                                playStatus.classList.add('played');
                                setPlayingItem(audioItem);
                            });
                            
                            regenerateBtn.addEventListener('click', () => {
                                regenerateAudio(groupIndex, segmentIndex, textArea, audioPlayer, regenerateBtn, playStatus);
                            });
                            
                            buttonsDiv.appendChild(deleteSegmentBtn);
                            buttonsDiv.appendChild(regenerateBtn);
                            
                            controlsDiv.appendChild(labelContainer);
                            controlsDiv.appendChild(buttonsDiv);
                            
                            audioItem.appendChild(controlsDiv);
                            audioItem.appendChild(textDiv);
                            audioItem.appendChild(audioPlayer);
                            groupDiv.appendChild(audioItem);
                            
                            ensureTextAreaHeight(textArea);
                            
                            textArea.addEventListener('input', function() {
                                autoResizeTextArea(this);
                            });
                            
                        } catch (error) {
                            const errorItem = document.createElement('div');
                            errorItem.className = 'audio-item error fade-in';
                            
                            const playStatus = document.createElement('div');
                            playStatus.className = 'play-status';
                            
                            const labelContainer = document.createElement('div');
                            labelContainer.className = 'audio-label-container';
                            
                            const labelDiv = document.createElement('div');
                            labelDiv.className = 'audio-label';
                            labelDiv.innerHTML = `<i class="fas fa-music"></i> 片段 ${segmentIndex + 1}`;
                            
                            labelContainer.appendChild(playStatus);
                            labelContainer.appendChild(labelDiv);
                            
                            const textDiv = document.createElement('div');
                            textDiv.className = 'audio-text';
                            
                            const textArea = document.createElement('textarea');
                            textArea.className = 'audio-text-editable';
                            textArea.value = segments[segmentIndex];
                            
                            textDiv.appendChild(textArea);
                            
                            const controlsDiv = document.createElement('div');
                            controlsDiv.className = 'audio-controls';
                            
                            const buttonsDiv = document.createElement('div');
                            buttonsDiv.className = 'audio-controls-buttons';
                            
                            // 添加删除单个音频片段按钮（在重新生成按钮左边）
                            const deleteSegmentBtn = document.createElement('button');
                            deleteSegmentBtn.className = 'btn-small btn-danger delete-segment-btn';
                            deleteSegmentBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 删除';
                            deleteSegmentBtn.addEventListener('click', () => {
                                if (confirm('确定要删除这个音频片段吗？')) {
                                    deleteAudioSegment(groupIndex, segmentIndex);
                                }
                            });
                            
                            const regenerateBtn = document.createElement('button');
                            regenerateBtn.className = 'btn-small';
                            regenerateBtn.innerHTML = '<i class="fas fa-redo"></i> 重新生成';
                            
                            const errorMsg = document.createElement('div');
                            errorMsg.className = 'error-message';
                            errorMsg.innerHTML = `<i class="fas fa-exclamation-circle"></i> 生成失败: ${error.message}`;
                            
                            regenerateBtn.addEventListener('click', () => {
                                errorMsg.remove();
                                const audioPlayer = document.createElement('audio');
                                audioPlayer.controls = true;
                                errorItem.appendChild(audioPlayer);
                                regenerateAudio(groupIndex, segmentIndex, textArea, audioPlayer, regenerateBtn, playStatus);
                            });
                            
                            buttonsDiv.appendChild(deleteSegmentBtn);
                            buttonsDiv.appendChild(regenerateBtn);
                            
                            controlsDiv.appendChild(labelContainer);
                            controlsDiv.appendChild(buttonsDiv);
                            
                            errorItem.appendChild(controlsDiv);
                            errorItem.appendChild(textDiv);
                            errorItem.appendChild(errorMsg);
                            groupDiv.appendChild(errorItem);
                            
                            ensureTextAreaHeight(textArea);
                            
                            textArea.addEventListener('input', function() {
                                autoResizeTextArea(this);
                            });
                            
                            // 即使失败也添加到组中，但标记为失败
                            audioGroup.segments.push({
                                text: segments[segmentIndex],
                                error: error.message
                            });
                        }
                        
                        processedSegments++;
                    }
                    
                    audioGroups.push(audioGroup);
                    audioList.appendChild(groupDiv);
                    
                    // 为组播放按钮添加事件
                    playGroupBtn.addEventListener('click', async () => {
                        await playMergedAudio(groupIndex, playGroupBtn);
                    });
                    
                    // 为组下载按钮添加事件
                    downloadGroupBtn.addEventListener('click', async () => {
                        await downloadMergedAudio(groupIndex, downloadGroupBtn);
                    });
                    
                    // 如果组内有成功生成的片段，启用按钮
                    if (audioGroup.segments.some(seg => !seg.error)) {
                        playGroupBtn.disabled = false;
                        downloadGroupBtn.disabled = false;
                    }
                }
                
                progressBar.style.width = '100%';
                progressPercent.textContent = '100%';
                statusDiv.textContent = `音频生成完成! 共生成 ${totalSegments} 个音频片段`;
                
                messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> 所有音频生成完成！';
                messageDiv.className = 'success';
                
                if (audioGroups.length > 0) {
                    downloadBtn.disabled = false;
                }
                
            } catch (error) {
                messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> 错误: ${error.message}`;
                messageDiv.className = 'error';
            } finally {
                loadingDiv.style.display = 'none';
                this.disabled = false;
                setTimeout(() => {
                    if (!this.disabled) {
                        this.classList.add('pulse-animation');
                    }
                }, 1000);
            }
        });
        
        // 播放合并后的完整音频
        async function playMergedAudio(groupIndex, button) {
            if (!audioGroups[groupIndex]) {
                showMessage('音频组不存在', 'error');
                return;
            }
            
            const validSegments = audioGroups[groupIndex].segments.filter(seg => !seg.error);
            
            if (validSegments.length === 0) {
                showMessage('没有可用的音频片段进行播放', 'error');
                return;
            }
            
            // 如果正在播放，则暂停
            if (button.isPlaying) {
                if (button.currentAudio) {
                    button.currentAudio.pause();
                    button.currentAudio = null;
                }
                
                // 清除所有播放状态
                document.querySelectorAll(`#audio-group-${groupIndex} .play-status`).forEach(status => {
                    status.classList.remove('playing');
                });
                
                button.innerHTML = '<i class="fas fa-play"></i> 播放完整音频';
                button.isPlaying = false;
                return;
            }
            
            button.isPlaying = true;
            button.innerHTML = '<i class="fas fa-pause"></i> 暂停播放音频';
            
            // 预先查询DOM元素，避免在循环中重复查询
            const playStatusElements = document.querySelectorAll(`#audio-group-${groupIndex} .play-status`);
            const audioItems = document.querySelectorAll(`#audio-group-${groupIndex} .audio-item`);
            
            // 依次播放每个片段
            for (let i = 0; i < validSegments.length; i++) {
                // 如果用户点击了暂停，则停止播放
                if (!button.isPlaying) {
                    break;
                }
                
                // 更新当前播放的片段状态
                if (playStatusElements[i]) {
                    // 清除之前的播放状态
                    playStatusElements.forEach(status => {
                        status.classList.remove('playing');
                    });
                    
                    // 设置当前播放状态
                    playStatusElements[i].classList.add('playing');
                    
                    // 标记当前片段为已读
                    playStatusElements[i].classList.add('played');
                    
                    // 设置当前音频项的playing类
                    if (audioItems[i]) {
                        setPlayingItem(audioItems[i]);
                    }
                }
                
                // 播放当前片段
                try {
                    await playAudioSegment(validSegments[i].url, button);
                } catch (error) {
                    console.error('播放音频片段失败:', error);
                }
            }
            
            // 播放完成后重置按钮状态
            if (button.isPlaying) {
                button.innerHTML = '<i class="fas fa-play"></i> 播放完整音频';
                button.isPlaying = false;
                
                // 清除所有播放状态
                document.querySelectorAll(`#audio-group-${groupIndex} .play-status`).forEach(status => {
                    status.classList.remove('playing');
                });
            }
        }
        
        // 播放单个音频片段
        function playAudioSegment(url, button) {
            return new Promise((resolve, reject) => {
                const audio = new Audio(url);
                button.currentAudio = audio;
                
                audio.addEventListener('ended', () => {
                    button.currentAudio = null;
                    resolve();
                });
                
                audio.addEventListener('error', (e) => {
                    button.currentAudio = null;
                    reject(new Error('音频播放失败'));
                });
                
                audio.play().catch(error => {
                    button.currentAudio = null;
                    reject(error);
                });
            });
        }
        
        // 下载合并后的完整音频
        async function downloadMergedAudio(groupIndex, button) {
            if (!audioGroups[groupIndex]) {
                showMessage('音频组不存在', 'error');
                return;
            }
            
            const originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 合并中...';
            
            try {
                // 检查是否已经合并过
                if (!mergedAudios[groupIndex]) {
                    // 过滤出成功的片段
                    const validSegments = audioGroups[groupIndex].segments.filter(seg => !seg.error);
                    
                    if (validSegments.length === 0) {
                        showMessage('没有可用的音频片段进行合并', 'error');
                        return;
                    }
                    
                    // 合并音频片段
                    const mergedBlob = await mergeAudioSegments(validSegments);
                    const mergedUrl = URL.createObjectURL(mergedBlob);
                    mergedAudios[groupIndex] = {
                        blob: mergedBlob,
                        url: mergedUrl
                    };
                }
                
                // 创建下载链接
                const a = document.createElement('a');
                a.href = mergedAudios[groupIndex].url;
                a.download = `${audioGroups[groupIndex].index}.wav`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                showMessage('完整音频下载成功！', 'success');
                
            } catch (error) {
                showMessage(`合并音频失败: ${error.message}`, 'error');
            } finally {
                button.disabled = false;
                button.innerHTML = originalText;
            }
        }
        
        // 打包下载按钮点击事件
        document.getElementById('downloadBtn').addEventListener('click', async function() {
            if (audioGroups.length === 0) {
                alert('没有可下载的音频文件');
                return;
            }
            
            const messageDiv = document.getElementById('message');
            messageDiv.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> 正在打包音频文件...';
            messageDiv.className = '';
            
            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 打包中...';
            
            try {
                const zip = new JSZip();
                
                // 为每个组生成合并音频并添加到zip
                for (let groupIndex = 0; groupIndex < audioGroups.length; groupIndex++) {
                    // 检查是否已经合并过
                    if (!mergedAudios[groupIndex]) {
                        const validSegments = audioGroups[groupIndex].segments.filter(seg => !seg.error);
                        
                        if (validSegments.length > 0) {
                            const mergedBlob = await mergeAudioSegments(validSegments);
                            mergedAudios[groupIndex] = {
                                blob: mergedBlob
                            };
                        }
                    }
                    
                    // 如果合并成功，添加到zip
                    if (mergedAudios[groupIndex]) {
                        const originalAudioFileName = `${audioGroups[groupIndex].index}`;
                        const audioFileNameList = originalAudioFileName.split('&');
                        audioFileNameList.forEach(function(audioFileName) {
                            zip.file(`${audioFileName}.wav`, mergedAudios[groupIndex].blob);
                        });
                    }
                }
                
                // 生成zip文件
                const content = await zip.generateAsync({type: "blob"});
                
                // 下载zip文件
                saveAs(content, "完整音频文件.zip");
                
                messageDiv.innerHTML = '<i class="fas fa-check-circle"></i> 音频文件打包下载完成！';
                messageDiv.className = 'success';
                
            } catch (error) {
                messageDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> 打包失败: ${error.message}`;
                messageDiv.className = 'error';
            } finally {
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
        
        // 解析Excel文件
        function parseExcelFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        
                        if (jsonData.length === 0) {
                            reject(new Error('Excel文件中没有数据'));
                            return;
                        }
                        
                        const firstRow = jsonData[0];
                        if (!firstRow.hasOwnProperty('语料名称') || !firstRow.hasOwnProperty('文字内容')) {
                            reject(new Error('Excel文件表头必须包含"语料名称"和"文字内容"列'));
                            return;
                        }
                        
                        const validData = jsonData
                            .filter(row => row['语料名称'] && row['文字内容'])
                            .map(row => ({
                                index: row['语料名称'],
                                text: row['文字内容'].toString().trim()
                            }))
                            .filter(item => item.text !== '');
                        
                        if (validData.length === 0) {
                            reject(new Error('Excel文件中没有有效的文本数据'));
                            return;
                        }
                        
                        resolve(validData);
                    } catch (error) {
                        reject(new Error('解析Excel文件失败: ' + error.message));
                    }
                };
                
                reader.onerror = function() {
                    reject(new Error('读取文件失败'));
                };
                
                reader.readAsArrayBuffer(file);
            });
        }

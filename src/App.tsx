import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Settings2, 
  History, 
  Download, 
  Trash2, 
  Maximize2, 
  Loader2, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Monitor,
  Smartphone,
  Square,
  Tv,
  Key
} from 'lucide-react';
import { GeneratedImage, GenerationSettings, AspectRatio } from './types';
import { ASPECT_RATIOS, DEFAULT_SETTINGS } from './constants';
import { enhancePrompt, generateImage } from './services/aiService';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Load custom API key from localStorage
    const savedKey = localStorage.getItem('custom_gemini_api_key');
    if (savedKey) setCustomApiKey(savedKey);
    
    // Load history from localStorage
    const savedHistory = localStorage.getItem('imagen_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('imagen_history', JSON.stringify(history));
  }, [history]);

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem('custom_gemini_api_key', customApiKey.trim());
    } else {
      localStorage.removeItem('custom_gemini_api_key');
    }
    // Refresh page or state to apply new key
    window.location.reload();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGenerationStatus('Đang khởi tạo tiến trình...');
    setError(null);
    
    try {
      let finalPrompt = prompt;
      let enhanced = undefined;

      if (settings.enhancePrompt) {
        setGenerationStatus('Đang sử dụng Gemini để tối ưu hóa mô tả...');
        const enhancement = await enhancePrompt(prompt);
        finalPrompt = enhancement.enhancedPrompt;
        enhanced = enhancement.enhancedPrompt;
        if (enhancement.suggestedNegativePrompt && !settings.negativePrompt) {
          setSettings(s => ({ ...s, negativePrompt: enhancement.suggestedNegativePrompt }));
        }
      }

      setGenerationStatus('Đang gửi yêu cầu tạo ảnh tới Imagen Engine...');
      const imageUrl = await generateImage(finalPrompt, settings);
      
      setGenerationStatus('Hoàn tất! Đang hiển thị kết quả...');
      
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        enhancedPrompt: enhanced,
        timestamp: Date.now(),
        settings: { ...settings }
      };

      setHistory(prev => [newImage, ...prev].slice(0, 20));
      setCurrentImage(newImage);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi trong quá trình tạo ảnh.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `imagen-${img.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(img => img.id !== id));
    if (currentImage?.id === id) setCurrentImage(null);
  };

  const clearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
      setHistory([]);
      setCurrentImage(null);
      localStorage.removeItem('imagen_history');
    }
  };

  const getAspectRatioStyle = (ratio: AspectRatio) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '4:3': return 'aspect-[4/3]';
      default: return 'aspect-square';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - History */}
      <AnimatePresence>
        {(showHistory || window.innerWidth >= 1024) && (
          <motion.aside 
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            className={`fixed inset-y-0 left-0 z-50 w-80 glass-panel m-4 mr-0 flex flex-col overflow-hidden lg:relative lg:flex lg:m-4 lg:mr-0 shadow-2xl lg:shadow-none`}
          >
            <div className="p-6 border-b border-lab-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={20} className="text-lab-accent" />
                <h2 className="font-semibold">Lịch sử sáng tạo</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/40">{history.length}</span>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="lg:hidden text-white/40 hover:text-white"
                >
                  <ChevronRight size={18} className="rotate-180" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-4">
                  <ImageIcon size={48} className="mb-4 opacity-10" />
                  <p className="text-sm">Chưa có hình ảnh nào được tạo</p>
                </div>
              ) : (
                history.map((img) => (
                  <motion.div 
                    layoutId={img.id}
                    key={img.id}
                    onClick={() => {
                      setCurrentImage(img);
                      if (window.innerWidth < 1024) setShowHistory(false);
                    }}
                    className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                      currentImage?.id === img.id ? 'border-lab-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadImage(img); }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteFromHistory(img.id); }}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="p-4 border-t border-lab-border">
                <button 
                  onClick={clearHistory}
                  className="w-full py-2 flex items-center justify-center gap-2 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                  Xóa toàn bộ lịch sử
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-lab-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Sparkles className="text-black" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Tạo ảnh từ văn bản</h1>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Design24 AI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-3 rounded-xl border border-lab-border transition-all lg:hidden ${showHistory ? 'bg-lab-accent text-black' : 'hover:bg-white/5'}`}
            >
              <History size={20} />
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-3 rounded-xl border border-lab-border transition-all ${showSettings ? 'bg-lab-accent text-black' : 'hover:bg-white/5'}`}
            >
              <Settings2 size={20} />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex gap-4 overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            {/* Image Display */}
            <div className={`flex-1 glass-panel overflow-hidden relative group transition-all duration-500 ${isFullScreen ? 'fixed inset-4 z-[100] m-0' : ''}`}>
              <AnimatePresence mode="wait">
                {currentImage ? (
                  <motion.div 
                    key={currentImage.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full flex items-center justify-center p-1 md:p-2"
                  >
                    <div className={`relative max-w-full max-h-full shadow-2xl rounded-lg overflow-hidden bg-black/20 transition-all duration-500 ${getAspectRatioStyle(currentImage.settings.aspectRatio)} ${isFullScreen ? 'h-full w-auto' : 'w-full h-full'}`}>
                      <img 
                        src={currentImage.url} 
                        alt={currentImage.prompt} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setIsFullScreen(!isFullScreen)}
                          className="p-3 bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-md border border-white/10 text-white"
                          title={isFullScreen ? "Thu nhỏ" : "Toàn màn hình"}
                        >
                          {isFullScreen ? <ChevronRight className="rotate-180" size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button 
                          onClick={() => downloadImage(currentImage)}
                          className="p-3 bg-black/60 hover:bg-black/80 rounded-xl backdrop-blur-md border border-white/10 text-white"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                      
                      {isFullScreen && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-sm text-white/90 line-clamp-2">{currentImage.prompt}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                          <Loader2 size={64} className="animate-spin text-lab-accent" />
                          <Sparkles size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-lab-accent/50" />
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-medium text-white/60 mb-1">{generationStatus}</p>
                          <p className="text-sm font-mono animate-pulse text-lab-accent/60">Neural Engine Processing</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 max-w-md">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <ImageIcon size={40} className="opacity-20" />
                        </div>
                        <h3 className="text-xl font-semibold text-white/60 mb-2">Bắt đầu sáng tạo</h3>
                        <p className="text-sm leading-relaxed">Nhập ý tưởng của bạn vào ô bên dưới để Design24 AI biến chúng thành hiện thực.</p>
                      </div>
                    )}
                  </div>
                )}
              </AnimatePresence>

              {/* Error Toast */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500/90 text-white rounded-2xl flex items-center gap-3 shadow-xl backdrop-blur-md"
                  >
                    <AlertCircle size={20} />
                    <span className="text-sm font-medium">{error}</span>
                    <button onClick={() => setError(null)} className="ml-2 opacity-60 hover:opacity-100">×</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="glass-panel p-4 flex flex-col gap-4">
              <div className="space-y-3">
                <div className="relative">
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Mô tả hình ảnh bạn muốn tạo..."
                    className="w-full h-20 lab-input resize-none pr-4 pt-4 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) handleGenerate();
                    }}
                  />
                  <div className="absolute bottom-3 right-3">
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="lab-button flex items-center gap-2 px-4 py-2 text-sm"
                    >
                      {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      <span className="font-semibold">{isGenerating ? 'Đang tạo...' : 'Tạo ảnh'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Aspect Ratio Selection */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Maximize2 size={12} />
                      Tỉ lệ khung hình
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.value}
                          onClick={() => setSettings(s => ({ ...s, aspectRatio: ratio.value }))}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-medium ${
                            settings.aspectRatio === ratio.value 
                              ? 'bg-lab-accent/10 border-lab-accent text-lab-accent' 
                              : 'border-lab-border hover:bg-white/5 text-white/60'
                          }`}
                        >
                          {ratio.value === '1:1' && <Square size={14} />}
                          {ratio.value === '16:9' && <Monitor size={14} />}
                          {ratio.value === '9:16' && <Smartphone size={14} />}
                          {ratio.value === '4:3' && <Tv size={14} />}
                          <span>{ratio.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Negative Prompt */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <AlertCircle size={12} />
                      Negative Prompt (Thứ không muốn có)
                    </label>
                    <input 
                      type="text"
                      value={settings.negativePrompt}
                      onChange={(e) => setSettings(s => ({ ...s, negativePrompt: e.target.value }))}
                      placeholder="Ví dụ: mờ, biến dạng..."
                      className="w-full lab-input text-xs py-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel (Right) */}
          <AnimatePresence>
            {showSettings && (
              <motion.aside 
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 320 }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                className="glass-panel flex flex-col overflow-hidden shrink-0"
              >
                <div className="p-6 border-b border-lab-border flex items-center justify-between">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Settings2 size={18} />
                    Cấu hình Design24 AI
                  </h2>
                  <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">×</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  {/* API Key Management */}
                  <section className="space-y-4">
                    <label className="text-xs font-mono uppercase tracking-widest text-white/40">Cấu hình API Key</label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input 
                          type={showKey ? "text" : "password"}
                          value={customApiKey}
                          onChange={(e) => setCustomApiKey(e.target.value)}
                          placeholder="Nhập Gemini API Key của bạn..."
                          className="w-full lab-input text-xs pr-10"
                        />
                        <button 
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                        >
                          {showKey ? <Trash2 size={14} /> : <Key size={14} />}
                        </button>
                      </div>
                      <button 
                        onClick={handleSaveApiKey}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium transition-all"
                      >
                        Lưu & Áp dụng
                      </button>
                      <p className="text-[9px] text-white/30 italic">
                        * Key được lưu cục bộ trong trình duyệt của bạn. Để trống để dùng key hệ thống.
                      </p>
                    </div>
                  </section>

                  {/* Prompt Enhancement Toggle */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono uppercase tracking-widest text-white/40">Tối ưu hóa Prompt</label>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, enhancePrompt: !s.enhancePrompt }))}
                        className={`w-10 h-5 rounded-full relative transition-colors ${settings.enhancePrompt ? 'bg-lab-accent' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: settings.enhancePrompt ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full"
                        />
                      </button>
                    </div>
                    <p className="text-[10px] text-white/30 leading-relaxed">
                      Sử dụng Gemini AI để mở rộng mô tả của bạn thành các prompt chuyên nghiệp với chi tiết về ánh sáng, phong cách và góc máy.
                    </p>
                  </section>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}


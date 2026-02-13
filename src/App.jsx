import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertCircle, ChevronRight, Info, Loader2 } from 'lucide-react';

export default function App() {
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Загрузка файла
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    // Проверка размера (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой. Максимум 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Ошибка чтения файла');
    };
    reader.readAsDataURL(file);
  };

  // Анализ артефакта
  const analyzeArtifact = async () => {
    if (!image) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      // Подготовка данных
      const base64Data = image.split(',')[1];
      const mediaType = image.split(';')[0].split(':')[1];
      
      // Отправка запроса
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageData: base64Data,
          mediaType: mediaType
        })
      });

      // Проверка статуса
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Ошибка ${response.status}`);
      }

      // Парсинг ответа
      const data = await response.json();
      
      // Проверка структуры
      if (!data || !data.content || !data.content[0]) {
        throw new Error('Неверная структура ответа');
      }

      // Извлечение текста
      const text = data.content[0].text;
      
      // Поиск JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON не найден в ответе');
      }

      // Парсинг JSON
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Установка результатов
      setResults(parsed);
      
    } catch (err) {
      setError(err.message || 'Произошла ошибка при анализе');
    } finally {
      setAnalyzing(false);
    }
  };

  // Сброс
  const reset = () => {
    setImage(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@400;700&display=swap');
        .playfair { font-family: 'Playfair Display', serif; }
        .lato { font-family: 'Lato', sans-serif; }
      `}</style>

      {/* Yellow Border */}
      <div className="fixed inset-0 border-8 border-yellow-400 pointer-events-none z-50"></div>

      <div className="relative z-10 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="border-b-2 border-yellow-400 mb-8 pb-6">
          <h1 className="playfair text-5xl font-black text-yellow-400">ARTICAM</h1>
          <p className="lato text-sm text-gray-400 mt-2 uppercase tracking-widest">Archaeological Analyzer · Powered by Claude AI</p>
        </div>

        {/* Upload Section */}
        {!image && !results && (
          <div className="border-3 border-yellow-400 rounded-lg p-12 text-center bg-gradient-to-b from-white/5 to-transparent">
            <Camera className="w-20 h-20 mx-auto mb-6 text-yellow-400" />
            <h2 className="playfair text-3xl font-bold mb-4">Upload Artifact Photo</h2>
            <p className="lato text-gray-400 mb-8 max-w-md mx-auto">
              Загрузите фото артефакта для получения экспертного археологического анализа
            </p>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="bg-yellow-400 text-black py-5 px-8 rounded-lg font-bold lato text-lg uppercase hover:bg-yellow-300 transition-colors flex items-center gap-3 mx-auto shadow-xl">
              <Upload className="w-6 h-6" />
              Выбрать фото
            </button>
          </div>
        )}

        {/* Preview & Analyze */}
        {image && !results && (
          <div>
            <div className="border-3 border-yellow-400 rounded-lg overflow-hidden mb-6 bg-black">
              <img src={image} alt="Artifact" className="w-full" />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={analyzeArtifact} 
                disabled={analyzing}
                className="flex-1 bg-yellow-400 text-black py-5 px-8 rounded-lg font-bold lato text-lg uppercase hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-xl">
                {analyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Artifact
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
              <button 
                onClick={reset} 
                disabled={analyzing}
                className="px-8 bg-white/10 border border-white/20 text-white py-5 rounded-lg lato hover:bg-white/20 disabled:opacity-50 transition-colors">
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Main Info */}
            <div className="border-3 border-yellow-400 rounded-lg p-8 bg-gradient-to-br from-white/5 to-transparent">
              <h2 className="playfair text-4xl font-black text-yellow-400 mb-3">{results.name}</h2>
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-4 py-1.5 bg-yellow-400/20 border border-yellow-400/50 rounded-full text-yellow-400 text-sm font-semibold">
                  {results.period}
                </span>
                <span className="px-4 py-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-full text-yellow-400/80 text-sm">
                  {results.type}
                </span>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 lato">
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Culture</div>
                  <div className="text-lg">{results.culture}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Material</div>
                  <div className="text-lg">{results.material}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Age</div>
                  <div className="text-lg text-yellow-400">{results.age}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Condition</div>
                  <div className="text-lg">{results.condition}</div>
                </div>
              </div>
            </div>

            {/* Preservation */}
            <div className="border-3 border-yellow-400 rounded-lg p-8 bg-gradient-to-br from-white/5 to-transparent">
              <h3 className="playfair text-2xl font-bold text-yellow-400 mb-6 border-b border-yellow-400/30 pb-4">PRESERVATION PROTOCOL</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <div className="text-xs uppercase tracking-widest text-yellow-400/80 mb-2 font-semibold">Temperature</div>
                  <div className="text-2xl font-bold playfair">{results.temperature}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg p-5">
                  <div className="text-xs uppercase tracking-widest text-yellow-400/80 mb-2 font-semibold">Humidity</div>
                  <div className="text-2xl font-bold playfair">{results.humidity}</div>
                </div>
              </div>
              
              <div className="space-y-4 text-sm lato">
                <div className="border-l-4 border-yellow-400 pl-4 py-2">
                  <div className="text-yellow-400 font-bold uppercase text-xs mb-1">Light Exposure</div>
                  <div className="text-gray-300">{results.light}</div>
                </div>
                <div className="border-l-4 border-yellow-400 pl-4 py-2">
                  <div className="text-yellow-400 font-bold uppercase text-xs mb-1">Handling</div>
                  <div className="text-gray-300">{results.handling}</div>
                </div>
                {results.notes && (
                  <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4 flex gap-3">
                    <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-yellow-400 font-bold uppercase text-xs mb-2">Additional Notes</div>
                      <div className="text-gray-300">{results.notes}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button 
              onClick={reset} 
              className="w-full bg-yellow-400 text-black py-5 rounded-lg font-bold lato text-lg uppercase hover:bg-yellow-300 transition-colors shadow-xl">
              New Analysis
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 border-2 border-red-500 bg-red-500/10 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold mb-1">Ошибка</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

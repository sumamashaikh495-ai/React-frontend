import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

// Helper to format bytes into a readable string
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Icon components
const UploadCloudIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mx-auto text-gray-400"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
);
const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-gray-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);
const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-400"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);

export default function App() {
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [error, setError] = useState(null);
  const [downloadLink, setDownloadLink] = useState(null);

  // !! IMPORTANT !!
  // Yahan apne backend ka URL daalein.
  // Local development ke liye yeh theek hai.
  // Jab deploy karein to Render wala URL yahan daalna hoga.
  const BACKEND_URL = 'http://127.0.0.1:8000';

  const onDrop = useCallback((acceptedFiles) => {
    setSubtitleFile(null);
    setError(null);
    setDownloadLink(null);
    setProcessingStatus(null);
    const file = acceptedFiles[0];
    if (file) {
      setSubtitleFile(file);
    } else {
      setError('Kripya ek valid subtitle file (.srt, .vtt, .ass) upload karein.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.srt', '.vtt', '.ass'] },
    multiple: false,
  });
  
  const handleTranslate = async () => {
    if (!apiKey) {
      setError('Kripya apni Gemini API key enter karein.');
      return;
    }
    if (!subtitleFile) {
      setError('Kripya ek subtitle file select karein.');
      return;
    }

    setProcessingStatus('translating');
    setError(null);
    setDownloadLink(null);

    const formData = new FormData();
    formData.append('api_key', apiKey);
    formData.append('file', subtitleFile);

    try {
      const response = await axios.post(`${BACKEND_URL}/translate`, formData, {
        responseType: 'blob', // Yeh zaroori hai file download ke liye
      });
      
      // Download ke liye link banayein
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadLink(url);
      setProcessingStatus('done');

    } catch (err) {
      let errorMsg = 'Translation fail ho gayi. Server ya API mein koi dikkat hai.';
      if (err.response) {
        // Backend se aaye error message ko text mein convert karein
        const errorJson = JSON.parse(await err.response.data.text());
        errorMsg = errorJson.detail || 'Ek anjaan error hui.';
      }
      setError(errorMsg);
      setProcessingStatus(null);
    }
  };
  
  const handleReset = () => {
      setSubtitleFile(null);
      setProcessingStatus(null);
      setError(null);
      setDownloadLink(null);
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Subtitle Translator
          </h1>
          <p className="text-gray-400 mt-2">
            Apni Gemini API key daalein aur subtitle file upload karke translate karein.
          </p>
        </div>

        {!processingStatus && (
            <>
            <div>
                <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
                <div className="relative">
                    <input id="api-key" type={isKeyVisible ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Apni API key yahan paste karein" className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-3 pr-10 focus:ring-2 focus:ring-purple-500 transition"/>
                    <button type="button" onClick={() => setIsKeyVisible(!isKeyVisible)} className="absolute inset-y-0 right-0 px-3 flex items-center">
                        {isKeyVisible ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                </div>
            </div>

            <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isDragActive ? 'border-purple-500 bg-gray-700/50' : 'border-gray-600 hover:border-purple-400'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center text-center">
                    <UploadCloudIcon />
                    <p className="mt-4 text-lg font-semibold text-gray-300">{isDragActive ? "File yahan drop karein..." : "File yahan drag & drop karein, ya select karein"}</p>
                    <p className="text-sm text-gray-500">Supports: SRT, VTT, ASS</p>
                </div>
            </div>

            {subtitleFile && (
                <div className="bg-gray-700/50 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <FileIcon />
                        <div>
                            <p className="font-medium text-white">{subtitleFile.name}</p>
                            <p className="text-sm text-gray-400">{formatBytes(subtitleFile.size)}</p>
                        </div>
                    </div>
                    <CheckCircleIcon />
                </div>
            )}
            
            <button onClick={handleTranslate} disabled={!apiKey || !subtitleFile} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                Translate File
            </button>
            </>
        )}

        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg text-center">{error}</div>}

        {processingStatus && (
            <div className="space-y-6">
                <div className="bg-gray-700/50 p-4 rounded-lg text-center">
                    <p className="font-semibold capitalize mb-2">{processingStatus === 'done' ? 'Translation Complete!' : 'Translating...'}</p>
                    {processingStatus === 'translating' && (
                        <div className="w-full bg-gray-600 rounded-full h-2.5 overflow-hidden">
                           <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 w-full animate-pulse"></div>
                        </div>
                    )}
                </div>

                {processingStatus === 'done' && (
                    <div className="flex flex-col sm:flex-row gap-4">
                        <a href={downloadLink} download={`${subtitleFile.name.split('.')[0]}_translated.${subtitleFile.name.split('.').pop()}`} className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                            <DownloadIcon />
                            Download Translated File
                        </a>
                        <button onClick={handleReset} className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                            Doosri File Translate Karein
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}


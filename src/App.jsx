import React, { useState } from 'react';
import Webcam from 'react-webcam';
import './App.css';

const App = () => {
  const [imageUrl, setImageUrl] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('formal');
  const [generatedArticle, setGeneratedArticle] = useState(null);
  const [image, setImage] = useState(null);
  const webcamRef = React.useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl);
      setShowPrompt(false);
      setImage(file);
      // Clear any previously generated article
      setGeneratedArticle(null);
    }
  };

  const requestCameraPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission(true);
      setIsCameraActive(true);
      // Clear any previously generated article when accessing camera
      setGeneratedArticle(null);
    } catch (error) {
      console.error("Camera access denied or not available:", error);
      setCameraPermission(false);
    }
  };

  const handleCameraCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImageUrl(imageSrc);
        setShowPrompt(false);
        setImage(imageSrc);
        // Clear any previously generated article when capturing new image
        setGeneratedArticle(null);
      } else {
        console.error("Failed to capture screenshot.");
      }
    } else {
      console.error("Webcam reference is null.");
    }
  };

  const handleGoBack = () => {
    // Clear everything when going back
    setImageUrl(null);
    setImage(null);
    setGeneratedArticle(null);
    setSelectedStyle('formal');
    setIsCameraActive(false);
  };

  const handleStyleChange = (e) => {
    setSelectedStyle(e.target.value);
    // Clear previous article when style is changed
    setGeneratedArticle(null);
  };

  const handleSubmit = async () => {
    if (image && selectedStyle) {
      const formData = new FormData();
  
      // Check if the image is a string (base64 data URL) or a File object
      if (typeof image === 'string' && image.startsWith('data:image')) {
        // Convert the base64 image to a Blob and then to a File
        const response = await fetch(image);
        const blob = await response.blob();
  
        // Convert Blob to File and append to FormData
        const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
        formData.append('file', file);
      } else if (image instanceof File) {
        // If the image is already a File (e.g., from upload)
        formData.append('file', image);
      } else {
        console.error('Invalid image type');
        return;
      }
  
      // Append the selected style to FormData
      formData.append('style', selectedStyle);
  
      try {
        const response = await fetch('http://127.0.0.1:5000/upload', {
          method: 'POST',
          body: formData,
        });
  
        if (response.ok) {
          const result = await response.json();
          setGeneratedArticle(result.article);
  
          // Dynamically inject the CSS
          if (result.theme_css) {
            const styleSheet = document.createElement("style");
            styleSheet.type = "text/css";
            styleSheet.innerText = result.theme_css;
            document.head.appendChild(styleSheet);
          }
  
          // Optionally, redirect to the newsified.html page with the result
          window.location.href = '/newsified.html?image=' + encodeURIComponent(result.image_url) + '&article=' + encodeURIComponent(result.article);
        } else {
          console.error('Failed to generate article');
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }
  };

  return (
    <main>
      <h1>Newsify your image!</h1>
      <p>Select your image to newsify</p>

      {!imageUrl && (
        <button onClick={() => {
          setShowPrompt(true);
          // Clear any existing article when starting new process
          setGeneratedArticle(null);
        }}>Choose Image</button>
      )}

      {showPrompt && (
        <div className="modal">
          <button onClick={() => setShowPrompt(false)} className="close-btn">Close</button>

          {!isCameraActive ? (
            <div className="options">
              <button onClick={requestCameraPermission}>Use Camera</button>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <button onClick={() => document.getElementById('file-upload').click()}>Upload Image</button>
            </div>
          ) : (
            <div className="camera">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
              />
              <button onClick={handleCameraCapture}>Capture Photo</button>
            </div>
          )}

          {cameraPermission === false && (
            <p style={{ color: 'red' }}>Please enable camera permissions in your browser settings to use the camera.</p>
          )}
        </div>
      )}

      {/* Display the selected or captured image with style selection */}
      {imageUrl && (
        <div className="preview-container">
          <img src={imageUrl} alt="Uploaded or Captured" className="preview-image" />
          <div className="controls">
            <button onClick={handleGoBack} className="back-button">
              ← Go Back
            </button>
            <div className="style-selector">
              <select 
                value={selectedStyle}
                onChange={handleStyleChange}
                className="style-dropdown"
              >
                <option value="formal">Formal News</option>
                <option value="tabloid">Tabloid Style</option>
                <option value="blog">Blog Style</option>
                <option value="social">Social Media Style</option>
              </select>
            </div>
            <button onClick={handleSubmit} className="submit-button">
              Generate Article
            </button>
          </div>
        </div>
      )}

      {/* Display the generated article */}
      {generatedArticle && (
        <div className="article">
          <h2>Generated Article</h2>
          <p>{generatedArticle}</p>
        </div>
      )}
    </main>
  );
};

export default App;
import { useState, useEffect, useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export const useCameraLeakDetection = (documentId: string, ownerEmail: string, readerEmail: string) => {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [leakDetected, setLeakDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<number | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    // 1. Load the COCO-SSD model.
    const loadModel = async () => {
      try {
        await tf.ready();
        const model = await cocoSsd.load();
        if (!isMounted.current) return;
        modelRef.current = model;
        setModelLoaded(true);
        console.log("Anti-leak detection model loaded.");
      } catch (error) {
        if (!isMounted.current) return;
        console.error("Failed to load detection model", error);
      }
    };
    loadModel();

    // 2. Request camera access.
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: 640, height: 480 } 
        });
        if (!isMounted.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        
        if (!videoRef.current) {
          const videoElements = document.createElement('video');
          videoElements.style.display = 'none';
          videoElements.autoplay = true;
          videoElements.playsInline = true;
          videoRef.current = videoElements;
          document.body.appendChild(videoElements);
        }

        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          if (!isMounted.current) return;
          setCameraEnabled(true);
        };
      } catch (error) {
        if (!isMounted.current) return;
        console.error("Camera access denied or unavailable", error);
        alert("La sécurisation PeraSafe requiert l'accès à la caméra pour prévenir les fuites de données (anti-photo).");
      }
    };

    setupCamera();

    return () => {
      isMounted.current = false;
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        if (videoRef.current.parentNode) {
          videoRef.current.parentNode.removeChild(videoRef.current);
        }
        videoRef.current = null;
      }
    };
  }, []);

  const signalLeak = useCallback(async () => {
    if (leakDetected || !isMounted.current) return; // Prevent multiple signals
    setLeakDetected(true);
    
    // In a real environment, this sends an HTTP request to the backend.
    console.warn("ALERTE DE FUITE DE DONNÉES DÉTECTÉE!");
    console.log(`Envoi de l'alerte au propriétaire (${ownerEmail}) et au super admin (jorisahoussi4@gmail.com)`);

    // We simulate the signal sending process
    try {
      // setTimeout to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isMounted.current) return;
      // TODO: the database could log this "leak_alerts" locally.
      alert(`ALERTE DE SÉCURITÉ: Une caméra ou un téléphone a été détecté. L'accès est révoqué et un signal a été envoyé au super admin et au propriétaire.`);
    } catch(err) {
      if (!isMounted.current) return;
      console.error(err);
    }
  }, [leakDetected, ownerEmail]);

  useEffect(() => {
    if (!modelLoaded || !cameraEnabled || leakDetected || !videoRef.current) return;

    const detect = async () => {
      if (videoRef.current && videoRef.current.readyState === 4 && isMounted.current) {
        try {
          const predictions = await modelRef.current!.detect(videoRef.current);
          if (!isMounted.current) return;
          
          // Check if a "cell phone" is detected in the view
          const phoneDetected = predictions.some(pred => pred.class === 'cell phone' && pred.score > 0.5);
          
          if (phoneDetected) {
            signalLeak();
          }
        } catch (e) {
          // model might fail if video structure is destroyed midway
        }
      }
    };

    detectionIntervalRef.current = window.setInterval(detect, 200); // Check 5 times per second
    
    return () => {
      if (detectionIntervalRef.current) {
        window.clearInterval(detectionIntervalRef.current);
      }
    };
  }, [modelLoaded, cameraEnabled, leakDetected, signalLeak]);

  return { cameraEnabled, leakDetected };
};
